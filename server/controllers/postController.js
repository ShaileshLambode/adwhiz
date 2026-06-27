const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const Post = require("../models/post");
const Logo = require("../models/Logo");
const axios = require("axios");
const sharp = require("sharp");
const streamifier = require("streamifier");
const path = require("path");
const { applyWatermark } = require("../utils/watermark");
const { incrementUsage } = require("../middleware/usageMiddleware");


function getValidSize(postType) {
  switch (postType) {
    case "1024x1024":
      return "1024x1024";
    case "1365x1024":
      return "1365x1024";
    case "1024x1365":
      return "1024x1365";
    case "1536x1024":
      return "1536x1024";
    case "1024x1536":
      return "1024x1536";
    case "1820x1024":
      return "1820x1024";
    case "1024x1820":
      return "1024x1820";
    case "1024x2048":
      return "1024x2048";
    case "2048x1024":
      return "2048x1024";
    case "1434x1024":
      return "1434x1024";
    case "1024x1434":
      return "1024x1434";
    case "1024x1280":
      return "1024x1280";
    case "1280x1024":
      return "1280x1024";
    case "1024x1707":
      return "1024x1707";
    case "1707x1024":
      return "1707x1024";
    default:
      return "1024x1024";
  }
}


// Create Post
exports.createpost = async (req, res) => {
  try {
    const { logo, postType, tone, postName, description, sector, } = req.body;
    const userId = req.user.id;
    const logoDoc = await Logo.findById(logo);

    if (!logoDoc || !logoDoc.images?.url) {
      return res.status(404).json({ error: "Valid logo not found" });
    }
    const logoImageUrl = logoDoc.images.url;

    // Handle the uploaded background image
    let backgroundImageUrl = "";
    if (req.file) {
      // Upload the background image to Cloudinary first
      const result = await cloudinary.uploader.upload(req.file.path);
      backgroundImageUrl = result.secure_url;
    }

    // Construct prompt with background image URL
    const prompt = `Create a realistic marketing image for a business named "${postName}", 
which belongs to the ${sector} industry. The image should be styled as ${tone}. Use this background image as the base: ${backgroundImageUrl}. Please clearly feature this logo in the design: ${logoImageUrl}.
Image should match type: ${postType}. Description: ${description}.`;

    console.log(prompt);

    // Send prompt to Recraft API
    const recraftPayload = {
      prompt,
      style: "realistic_image",
      model: "recraftv3",
      size: getValidSize(postType),
      n: 1,
      response_format: "url",
      image_url: backgroundImageUrl || logoImageUrl,
    };

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

    // const generatedImageUrl = "https://res.cloudinary.com/doikojnwk/image/upload/v1749879342/posts/sveim02szqmahr7tlaqb.webp";


    // Process and upload the final image
    const baseImageBuffer = (await axios.get(generatedImageUrl, { responseType: "arraybuffer" })).data;
    const logoBuffer = (await axios.get(logoImageUrl, { responseType: "arraybuffer" })).data;

    const baseImage = sharp(baseImageBuffer);
    const baseMetadata = await baseImage.metadata();
    
    // Resize logo to be 20% of the base image width
    const resizedLogoBuffer = await sharp(logoBuffer)
      .resize({ width: Math.round(baseMetadata.width * 0.2) })
      .toBuffer();

    const finalImageBuffer = await baseImage
      .composite([{ input: resizedLogoBuffer, top: 20, left: 20 }])
      .toBuffer();

    const outputBuffer = req.userPlan?.watermark
      ? await applyWatermark(finalImageBuffer)
      : finalImageBuffer;

    // Upload to Cloudinary
    cloudinary.uploader.upload_stream(
      { folder: "posts", resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload final image" });
        }

        const newPost = new Post({
          user: userId,
          logo,
          props: {
            postType,
            tone,
            postName,
            sector,
            image: result.secure_url,
            backgroundImageUrl,
            description,
          },
        });

        await newPost.save();

        await incrementUsage(userId);

        return res.status(201).json({
          message: "Post created successfully!",
          post: newPost,
        });
      }
    ).end(outputBuffer);

  } catch (error) {
    console.error("Create post error:", error?.response?.data || error.message);
    return res.status(500).json({ error: "Server error while creating post" });
  }
};


// Regenerate Post
exports.regeneratePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findOne({ _id: postId, user: userId }).populate("logo");

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    const logoDoc = post.logo;

    if (!logoDoc || !logoDoc.images?.url) {
      return res.status(400).json({ error: "Logo image is missing" });
    }

    const logoImageUrl = logoDoc.images.url;

    // Accept updated values from the request body, fallback to post.props
    const {
      postType = post.props.postType,
      tone = post.props.tone,
      postName = post.props.postName,
      description = post.props.description,
      sector = post.props.sector,
    } = req.body;

    // Initialize backgroundImageUrl with the existing one
    let backgroundImageUrl = post.props.backgroundImageUrl || '';

    // Handle the uploaded background image (if provided)
    if (req.file) {
      // Upload the new background image to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path);
      backgroundImageUrl = result.secure_url;

      // Optional: Delete old background image if it exists
      if (post.props.backgroundImageUrl) {
        try {
          const oldBgUrl = post.props.backgroundImageUrl;
          const publicId = oldBgUrl.split('/').pop().split('.')[0];
          if (publicId) {
            await cloudinary.uploader.destroy(`posts/${publicId}`, { resource_type: "image" });
          }
        } catch (error) {
          console.error("Error deleting old background image:", error);
        }
      }
    }

    // Construct prompt with background image URL (same as createpost)
    const prompt = `Create a realistic marketing image for a business named "${postName}", 
which belongs to the ${sector} industry. The image should be styled as ${tone}. Use this background image as the base: ${backgroundImageUrl}. Please clearly feature this logo in the design: ${logoImageUrl}.
Image should match type: ${postType}. Description: ${description}.`;

    console.log("Regeneration Prompt:", prompt);

    // Send prompt to Recraft API
    const recraftPayload = {
      prompt,
      style: "realistic_image",
      model: "recraftv3",
      size: getValidSize(postType),
      n: 1,
      response_format: "url",
      image_url: logoImageUrl,
    };

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

    // const generatedImageUrl = "https://res.cloudinary.com/doikojnwk/image/upload/v1749879342/posts/sveim02szqmahr7tlaqb.webp";


    const baseImageBuffer = (await axios.get(generatedImageUrl, { responseType: "arraybuffer" })).data;
    const logoBuffer = (await axios.get(logoImageUrl, { responseType: "arraybuffer" })).data;

    const baseImage = sharp(baseImageBuffer);
    const baseMetadata = await baseImage.metadata();

    // Resize logo to be 20% of the base image width
    const resizedLogoBuffer = await sharp(logoBuffer)
      .resize({ width: Math.round(baseMetadata.width * 0.2) })
      .toBuffer();

    const finalImageBuffer = await baseImage
      .composite([{ input: resizedLogoBuffer, top: 20, left: 20 }])
      .toBuffer();

    const outputBuffer = req.userPlan?.watermark
      ? await applyWatermark(finalImageBuffer)
      : finalImageBuffer;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "posts", resource_type: "image" },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ error: "Failed to upload regenerated image" });
        }

        // Delete old post image if it exists
        const oldImageUrl = post.props.image;
        const publicIdMatch = oldImageUrl?.match(/\/posts\/([^\.\/]+)\./);
        const oldPublicId = publicIdMatch ? `posts/${publicIdMatch[1]}` : null;

        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId, { resource_type: "image" });
        }

        // Save updated props and image URL
        post.props = {
          ...post.props,
          postType,
          tone,
          postName,
          description,
          sector,
          image: result.secure_url,
          backgroundImageUrl,
        };

        await post.save();

        await incrementUsage(userId);

        res.status(200).json({
          message: "Post image regenerated successfully!",
          post,
        });
      }
    );

    streamifier.createReadStream(outputBuffer).pipe(uploadStream);
  } catch (error) {
    console.error("Regenerate post error:", error?.response?.data || error.message);
    res.status(500).json({ error: "Server error while regenerating post" });
  }
};


// View Post Controller
exports.viewpost = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized: User ID missing" });
    }

    const posts = await Post.find({ user: userId }).sort({ createdAt: -1 }).lean();

    const transformedPosts = posts.map(post => ({
      ...post,
      id: post._id.toString()
    }));

    return res.status(200).json({ posts: transformedPosts });
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    return res.status(500).json({ error: "Failed to fetch posts" });
  }
};


// Delete Post Controller
exports.deletepost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    // Find the post
    const post = await Post.findOne({ _id: postId, user: userId });

    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    // Extract image public_id from URL to delete from Cloudinary
    const imageUrl = post.props.image;
    const publicIdMatch = imageUrl.match(/\/posts\/([^\.\/]+)\./);
    const publicId = publicIdMatch ? `posts/${publicIdMatch[1]}` : null;

    if (publicId) {
      // Delete image from Cloudinary
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    // Delete post from database
    await Post.deleteOne({ _id: postId });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error.message);
    res.status(500).json({ error: "Server error while deleting post" });
  }
};


// Download Post Image
exports.downloadPostImage = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post || !post.props?.image) {
      return res.status(404).json({ error: "Image not found" });
    }

    const imageUrl = post.props.image;
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    const ext = path.extname(new URL(imageUrl).pathname) || ".jpg";
    const contentType = response.headers["content-type"];
    const fileName = `${post.props.postName?.replace(/\s+/g, "_") || "downloaded_image"}${ext}`;

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", contentType);

    res.send(buffer);
  } catch (error) {
    console.error("Download image error:", error.message);
    res.status(500).json({ error: "Failed to download image" });
  }
};


// Toggle Favorite Status
exports.toggleFavorite = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const post = await Post.findOne({ _id: postId, user: userId });
    if (!post) {
      return res.status(404).json({ error: "Post not found or unauthorized" });
    }

    post.favorite = !post.favorite;
    await post.save();

    res.status(200).json({ message: "Favorite status updated", favorite: post.favorite });
  } catch (error) {
    console.error("Toggle favorite error:", error.message);
    res.status(500).json({ error: "Server error while updating favorite" });
  }
};


// Get All Favorite Posts for User
exports.getFavoritePosts = async (req, res) => {
  try {
    const userId = req.user.id;

    const favoritePosts = await Post.find({ user: userId, favorite: true }).sort({ createdAt: -1 }).lean();

    const transformedPosts = favoritePosts.map(post => ({
      ...post,
      id: post._id.toString()
    }));

    res.status(200).json({ favorites: transformedPosts });
  } catch (error) {
    console.error("Get favorites error:", error.message);
    res.status(500).json({ error: "Failed to get favorite posts" });
  }
};
