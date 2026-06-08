const cloudinary = require("../utils/cloudinary");
const axios = require("axios");
const sharp = require("sharp");
const streamifier = require("streamifier");
const path = require("path");
const { createCanvas } = require("canvas");

const PromoPost = require("../models/PromoPost");
const ImageTemplate = require("../models/ImageTemplate");
const Logo = require("../models/Logo");
const { buildPrompt, hexToRgb, buildTextLayoutEntries } = require("../utils/promptBuilder");


/**
 * Programmatically make solid backgrounds transparent on logo files.
 * Detects the background color from the top-left pixel.
 */
async function removeLogoBackground(logoBuffer) {
  try {
    const sharpImg = sharp(logoBuffer);
    const { data, info } = await sharpImg
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    const bgA = data[3];

    // If the corner pixel is already transparent, return early
    if (bgA < 10) return logoBuffer;

    const threshold = 35; // color distance threshold

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i+1];
      const b = data[i+2];

      const dist = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );

      if (dist < threshold) {
        data[i+3] = 0; // Transparent
      }
    }

    return await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toBuffer();
  } catch (error) {
    console.error("Background removal error:", error);
    return logoBuffer;
  }
}

/**
 * Renders a footer bar (website + email) as a PNG buffer
 * @param {string} website
 * @param {string} email
 * @param {number} imageWidth
 * @returns {Buffer} PNG buffer of the footer strip
 */
function renderFooterStrip(website, email, imageWidth) {
  const height = Math.max(Math.floor(imageWidth * 0.07), 40); // 7% of image width, min 40px
  const canvas = createCanvas(imageWidth, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fillRect(0, 0, imageWidth, height);

  // Text
  const fontSize = Math.floor(height * 0.38);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${website}  |  ${email}`, imageWidth / 2, height / 2);

  return canvas.toBuffer('image/png');
}


/**
 * List all active templates for the occasion picker.
 */
exports.listTemplates = async (req, res) => {
  try {
    const templates = await ImageTemplate.find({ active: true })
      .sort({ occasion: 1 })
      .lean();
    return res.status(200).json({ templates });
  } catch (error) {
    console.error("List templates error:", error.message);
    return res.status(500).json({ error: "Failed to fetch templates" });
  }
};


/**
 * Generate a promotional image using Recraft V3 with text_layout controls.
 */
exports.generatePromo = async (req, res) => {
  try {
    const { templateId, logoId, textInputs, size, stylePreset } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!templateId || !logoId || !textInputs || !Array.isArray(textInputs)) {
      return res.status(400).json({ error: "Missing required fields: templateId, logoId, textInputs" });
    }

    // Fetch template and logo
    const template = await ImageTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) {
      return res.status(404).json({ error: "Valid logo not found" });
    }

    const logoImageUrl = logoDoc.images.url;

    // Build Recraft V3 payload with text_layout controls (except website and email)
    const prompt = buildPrompt(template, logoDoc);
    console.log("Promo generation prompt:", prompt);

    // Build text_layout from template bbox + user text inputs
    const textLayoutControls = [];
    for (const slot of template.textSlots) {
      if (slot.id === "website" || slot.id === "email") {
        continue;
      }
      const userSlot = textInputs.find(ti => ti.id === slot.id);
      const userText = userSlot ? userSlot.value : slot.defaultText || "";
      if (userText && userText.trim()) {
        const entries = buildTextLayoutEntries(userText, slot.bbox);
        textLayoutControls.push(...entries);
      }
    }

    // Build color controls from template palette
    const colorControls = template.colorPalette
      .filter(hex => hex && hex.trim())
      .map(hex => hexToRgb(hex));

    const imageSize = size || template.aspectRatio || "1024x1024";
    const preset = stylePreset || "realistic_image";

    const recraftPayload = {
      prompt,
      model: "recraftv3",
      style: preset,
      size: imageSize,
      n: 1,
      response_format: "url",
    };

    // Add controls only if we have valid data
    if (textLayoutControls.length > 0 || colorControls.length > 0) {
      recraftPayload.controls = {};
      if (textLayoutControls.length > 0) {
        recraftPayload.controls.text_layout = textLayoutControls;
      }
      if (colorControls.length > 0) {
        recraftPayload.controls.colors = colorControls;
      }
    }

    console.log("Recraft payload:", JSON.stringify(recraftPayload, null, 2));

    // Call Recraft API
    const recraftResponse = await axios.post(
      "https://external.api.recraft.ai/v1/images/generations",
      recraftPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RECRAFT_API_KEY}`,
        },
      }
    );

    const generatedImageUrl = recraftResponse.data.data[0].url;
    console.log("Recraft generated image:", generatedImageUrl);

    // Download generated image and logo for compositing
    const baseImageBuffer = (await axios.get(generatedImageUrl, { responseType: "arraybuffer" })).data;
    const logoBuffer = (await axios.get(logoImageUrl, { responseType: "arraybuffer" })).data;

    // Process logo background
    const processedLogoBuffer = await removeLogoBackground(logoBuffer);

    // Get base image dimensions
    const baseImage = sharp(baseImageBuffer);
    const baseMetadata = await baseImage.metadata();

    // Resize logo to 18% of base image width
    const resizedLogoBuffer = await sharp(processedLogoBuffer)
      .resize({ width: Math.round(baseMetadata.width * 0.18) })
      .toBuffer();

    // Render website and email to footer bar using Canvas
    const websiteSlot = textInputs.find(ti => ti.id === "website");
    const websiteText = websiteSlot ? websiteSlot.value : "";
    const emailSlot = textInputs.find(ti => ti.id === "email");
    const emailText = emailSlot ? emailSlot.value : "";

    const footerHeight = Math.floor(baseMetadata.width * 0.07);
    const footerBuffer = renderFooterStrip(websiteText || "", emailText || "", baseMetadata.width);

    // Composite logo and footer strip onto the generated image
    const finalImageBuffer = await baseImage
      .composite([
        { input: resizedLogoBuffer, top: 28, left: 28 },
        { input: footerBuffer, top: baseMetadata.height - footerHeight, left: 0 }
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "promo_posts", resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload final image" });
        }

        // Save PromoPost to database
        const newPromoPost = new PromoPost({
          user: userId,
          logo: logoId,
          template: templateId,
          occasion: template.occasion,
          size: imageSize,
          textInputs,
          generatedImageUrl: result.secure_url,
        });

        await newPromoPost.save();

        return res.status(201).json({
          message: "Promo post created successfully!",
          promoPost: newPromoPost,
        });
      }
    );

    streamifier.createReadStream(finalImageBuffer).pipe(uploadStream);
  } catch (error) {
    console.error("Generate promo error:", error?.response?.data || error.message);
    return res.status(500).json({ error: "Server error while generating promo post" });
  }
};


/**
 * List all promo posts for the authenticated user.
 */
exports.listPromos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }

    const promoPosts = await PromoPost.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate("template", "name occasion")
      .lean();

    const transformed = promoPosts.map(post => ({
      ...post,
      id: post._id.toString(),
    }));

    return res.status(200).json({ promoPosts: transformed });
  } catch (error) {
    console.error("List promos error:", error.message);
    return res.status(500).json({ error: "Failed to fetch promo posts" });
  }
};


/**
 * Delete a promo post and its Cloudinary asset.
 */
exports.deletePromo = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await PromoPost.findOne({ _id: postId, user: userId });
    if (!post) {
      return res.status(404).json({ error: "Promo post not found or unauthorized" });
    }

    // Delete image from Cloudinary
    const imageUrl = post.generatedImageUrl;
    if (imageUrl) {
      const publicIdMatch = imageUrl.match(/\/promo_posts\/([^./]+)\./);
      const publicId = publicIdMatch ? `promo_posts/${publicIdMatch[1]}` : null;
      if (publicId) {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      }
    }

    await PromoPost.deleteOne({ _id: postId });
    return res.status(200).json({ message: "Promo post deleted successfully" });
  } catch (error) {
    console.error("Delete promo error:", error.message);
    return res.status(500).json({ error: "Server error while deleting promo post" });
  }
};


/**
 * Download a promo post image.
 */
exports.downloadPromo = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await PromoPost.findById(postId);

    if (!post || !post.generatedImageUrl) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imageUrl = post.generatedImageUrl;
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
    const contentType = response.headers["content-type"];
    const fileName = `promo_${post.occasion || "image"}${ext}`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);
    res.send(buffer);
  } catch (error) {
    console.error("Download promo error:", error.message);
    res.status(500).json({ error: "Failed to download image" });
  }
};


/**
 * Toggle the favorite status of a promo post.
 */
exports.togglePromoFavorite = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await PromoPost.findOne({ _id: postId, user: userId });
    if (!post) {
      return res.status(404).json({ error: "Promo post not found or unauthorized" });
    }

    post.favorite = !post.favorite;
    await post.save();

    return res.status(200).json({ message: "Favorite status updated", favorite: post.favorite });
  } catch (error) {
    console.error("Toggle promo favorite error:", error.message);
    return res.status(500).json({ error: "Server error while updating favorite" });
  }
};


/**
 * Regenerate a promo post with updated parameters.
 */
exports.regeneratePromo = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const existingPost = await PromoPost.findOne({ _id: postId, user: userId });
    if (!existingPost) {
      return res.status(404).json({ error: "Promo post not found or unauthorized" });
    }

    // Accept updated values, fallback to existing
    const {
      templateId = existingPost.template,
      logoId = existingPost.logo,
      textInputs = existingPost.textInputs,
      size = existingPost.size,
      stylePreset
    } = req.body;

    // Fetch template and logo
    const template = await ImageTemplate.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) {
      return res.status(404).json({ error: "Valid logo not found" });
    }

    const logoImageUrl = logoDoc.images.url;

    // Build prompt and payload
    const prompt = buildPrompt(template, logoDoc);

    const textLayoutControls = [];
    for (const slot of template.textSlots) {
      if (slot.id === "website" || slot.id === "email") {
        continue;
      }
      const userSlot = textInputs.find(ti => ti.id === slot.id);
      const userText = userSlot ? userSlot.value : slot.defaultText || "";
      if (userText && userText.trim()) {
        const entries = buildTextLayoutEntries(userText, slot.bbox);
        textLayoutControls.push(...entries);
      }
    }

    const colorControls = template.colorPalette
      .filter(hex => hex && hex.trim())
      .map(hex => hexToRgb(hex));

    const imageSize = size || template.aspectRatio || "1024x1024";
    const preset = stylePreset || "realistic_image";

    const recraftPayload = {
      prompt,
      model: "recraftv3",
      style: preset,
      size: imageSize,
      n: 1,
      response_format: "url",
    };

    if (textLayoutControls.length > 0 || colorControls.length > 0) {
      recraftPayload.controls = {};
      if (textLayoutControls.length > 0) {
        recraftPayload.controls.text_layout = textLayoutControls;
      }
      if (colorControls.length > 0) {
        recraftPayload.controls.colors = colorControls;
      }
    }

    // Call Recraft API
    const recraftResponse = await axios.post(
      "https://external.api.recraft.ai/v1/images/generations",
      recraftPayload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RECRAFT_API_KEY}`,
        },
      }
    );

    const generatedImageUrl = recraftResponse.data.data[0].url;

    // Composite logo
    const baseImageBuffer = (await axios.get(generatedImageUrl, { responseType: "arraybuffer" })).data;
    const logoBuffer = (await axios.get(logoImageUrl, { responseType: "arraybuffer" })).data;

    // Process logo background
    const processedLogoBuffer = await removeLogoBackground(logoBuffer);

    const baseImage = sharp(baseImageBuffer);
    const baseMetadata = await baseImage.metadata();

    const resizedLogoBuffer = await sharp(processedLogoBuffer)
      .resize({ width: Math.round(baseMetadata.width * 0.18) })
      .toBuffer();

    // Render website and email to footer bar using Canvas
    const websiteSlot = textInputs.find(ti => ti.id === "website");
    const websiteText = websiteSlot ? websiteSlot.value : "";
    const emailSlot = textInputs.find(ti => ti.id === "email");
    const emailText = emailSlot ? emailSlot.value : "";

    const footerHeight = Math.floor(baseMetadata.width * 0.07);
    const footerBuffer = renderFooterStrip(websiteText || "", emailText || "", baseMetadata.width);

    const finalImageBuffer = await baseImage
      .composite([
        { input: resizedLogoBuffer, top: 28, left: 28 },
        { input: footerBuffer, top: baseMetadata.height - footerHeight, left: 0 }
      ])
      .jpeg({ quality: 92 })
      .toBuffer();

    // Upload new image
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "promo_posts", resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload regenerated image" });
        }

        // Delete old image from Cloudinary
        const oldUrl = existingPost.generatedImageUrl;
        if (oldUrl) {
          const oldMatch = oldUrl.match(/\/promo_posts\/([^./]+)\./);
          const oldPublicId = oldMatch ? `promo_posts/${oldMatch[1]}` : null;
          if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" });
          }
        }

        // Update the existing post
        existingPost.template = templateId;
        existingPost.logo = logoId;
        existingPost.occasion = template.occasion;
        existingPost.size = imageSize;
        existingPost.textInputs = textInputs;
        existingPost.generatedImageUrl = result.secure_url;

        await existingPost.save();

        return res.status(200).json({
          message: "Promo post regenerated successfully!",
          promoPost: existingPost,
        });
      }
    );

    streamifier.createReadStream(finalImageBuffer).pipe(uploadStream);
  } catch (error) {
    console.error("Regenerate promo error:", error?.response?.data || error.message);
    return res.status(500).json({ error: "Server error while regenerating promo post" });
  }
};
