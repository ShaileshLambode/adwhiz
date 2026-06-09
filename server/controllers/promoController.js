const cloudinary = require("../utils/cloudinary");
const axios = require("axios");
const sharp = require("sharp");
const streamifier = require("streamifier");
const path = require("path");

const PromoPost = require("../models/PromoPost");
const ImageTemplate = require("../models/ImageTemplate");
const Logo = require("../models/Logo");
const { buildPrompt, hexToRgb } = require("../utils/promptBuilder");
const {
  buildZone1Header,
  buildZone2Left,
  buildZone2Right_QuoteBox,
  buildZone3ValuesRow,
  buildZone4FeaturesBar,
  buildZone5ProductIcons,
  buildZone6FooterStrip
} = require("../utils/svgBuilder");
const { parseSize, calculateZoneHeights } = require("../utils/posterLayout");


// ─── Contact parser utility ──────────────────────────────────────────────────
function parseContactInfo(address) {
  let website = "www.aimaven.tech";
  let email = "aimaven.surat@gmail.com";
  
  if (address) {
    const parts = address.split(/[|,]/).map(p => p.trim());
    if (parts.length > 0) {
      let foundEmail = false;
      let foundWeb = false;
      parts.forEach(part => {
        if (part.includes('@')) {
          email = part;
          foundEmail = true;
        } else if (part.includes('.') || part.startsWith('www')) {
          website = part;
          foundWeb = true;
        }
      });
      if (!foundWeb && !foundEmail && parts[0]) {
        website = parts[0];
      }
    }
  }
  return { website, email };
}

// ─── Logo background removal (unchanged — works fine) ────────────────────────
async function removeLogoBackground(logoBuffer) {
  try {
    const sharpImg = sharp(logoBuffer);
    const { data, info } = await sharpImg.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bgR = data[0], bgG = data[1], bgB = data[2], bgA = data[3];
    if (bgA < 10) return logoBuffer;
    const threshold = 35;
    for (let i = 0; i < data.length; i += 4) {
      const dist = Math.sqrt(
        Math.pow(data[i] - bgR, 2) + Math.pow(data[i+1] - bgG, 2) + Math.pow(data[i+2] - bgB, 2)
      );
      if (dist < threshold) data[i+3] = 0;
    }
    return await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  } catch (error) {
    console.error("Background removal error:", error);
    return logoBuffer;
  }
}


// ─── Core generation logic (composite vertical pipeline) ───────────────────
async function runGeneration({ template, logoDoc, overrides, size, stylePreset }) {
  // 1. Build Recraft style and payload
  const VALID_STYLES = {
    'realistic_image':                    'digital_illustration',
    'digital_illustration':               'digital_illustration',
    'digital_illustration/flat_design':   'digital_illustration',
    'digital_illustration/2d_art_poster': 'digital_illustration/2d_art_poster',
    'digital_illustration/engraving':     'digital_illustration/engraving_color',
    'digital_illustration/hand_drawn':    'digital_illustration/hand_drawn',
    'minimalist':                         'digital_illustration',
    'vintage_poster':                     'digital_illustration/engraving_color',
    'three_d_render':                     'digital_illustration/handmade_3d',
    'flat_design':                        'digital_illustration',
  };
  const recraftStyle = VALID_STYLES[stylePreset] || 'digital_illustration';

  const recraftPayload = {
    prompt: buildPrompt(template),
    model: 'recraftv3',
    style: recraftStyle,
    size: '1024x1536', // Use portrait hero image for best cropping
    n: 1,
    response_format: 'url',
    controls: {
      colors: template.colorPalette
        .filter(hex => hex && hex.trim())
        .map(hex => hexToRgb(hex))
    }
  };

  console.log('[Promo] Recraft hero scene payload:', JSON.stringify(recraftPayload, null, 2));

  // 2. Call Recraft API
  const recraftResponse = await axios.post(
    'https://external.api.recraft.ai/v1/images/generations',
    recraftPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RECRAFT_API_KEY}`,
      },
    }
  );

  const generatedImageUrl = recraftResponse.data.data[0].url;
  console.log('[Promo] Recraft image URL:', generatedImageUrl);

  // 3. Download base image and logo
  const [heroSceneBaseBuffer, logoBuffer] = await Promise.all([
    axios.get(generatedImageUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
    axios.get(logoDoc.images.url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
  ]);

  // 4. Poster layout allocations
  const [W, H] = parseSize(size);
  const zones = calculateZoneHeights(H);

  const panelW_left = Math.floor(W * 0.46);
  const panelW_right = W - panelW_left;

  const quoteBoxW = Math.floor(panelW_right * 0.45);
  const quoteBoxH = Math.floor(zones.z2 * 0.84);
  const quoteBoxX = panelW_left + Math.floor(panelW_right * 0.50);
  const quoteBoxY = zones.z1 + Math.floor(zones.z2 * 0.08);

  // 5. Logo and hero background resize
  const processedLogoBuffer = await removeLogoBackground(logoBuffer);
  // Scale logo height to 65% of header height
  const targetLogoH = Math.floor(zones.z1 * 0.65);
  const resizedLogoBuffer = await sharp(processedLogoBuffer)
    .resize({ height: targetLogoH })
    .toBuffer();
  
  const logoMetadata = await sharp(resizedLogoBuffer).metadata();
  const logoH = logoMetadata.height;

  // Crop/Resize Recraft illustration to fill the right hero panel
  const heroSceneResizedBuffer = await sharp(heroSceneBaseBuffer)
    .resize({
      width: panelW_right,
      height: zones.z2,
      fit: 'cover',
      position: 'center'
    })
    .toBuffer();

  // 6. Generate SVG buffers for each zone
  const contact = parseContactInfo(logoDoc.address);
  const z1Svg = buildZone1Header({ website: contact.website, email: contact.email }, W, zones.z1, template.colorPalette);
  const z2LeftSvg = buildZone2Left(overrides.heroContent, panelW_left, zones.z2, template.colorPalette, template.occasion);
  const z2RightBoxSvg = buildZone2Right_QuoteBox(overrides.heroContent.rightBoxQuote, quoteBoxW, quoteBoxH, template.colorPalette, template.occasion);
  const z3Svg = buildZone3ValuesRow(overrides.valuesRow, W, zones.z3, template.colorPalette);
  const z4Svg = buildZone4FeaturesBar(overrides.featuresBar, W, zones.z4, template.colorPalette);
  const z5Svg = buildZone5ProductIcons(overrides.productCategories, W, zones.z5);
  const z6Svg = buildZone6FooterStrip(overrides.footerColumns, W, zones.z6, template.colorPalette);

  // 7. Composite in array order
  let currentY = 0;
  const composites = [];

  // Zone 1 — Header Bar
  composites.push({ input: z1Svg, top: currentY, left: 0 });
  currentY += zones.z1;

  // Zone 2 — Hero Right background scene (underneath the overlay box)
  composites.push({ input: heroSceneResizedBuffer, top: currentY, left: panelW_left });

  // Zone 2 — Hero Left dark panel
  composites.push({ input: z2LeftSvg, top: currentY, left: 0 });

  // Zone 2 — Right quote box overlay
  composites.push({ input: z2RightBoxSvg, top: quoteBoxY, left: quoteBoxX });
  currentY += zones.z2;

  // Zone 3 — Values Row
  composites.push({ input: z3Svg, top: currentY, left: 0 });
  currentY += zones.z3;

  // Zone 4 — Features Bar
  composites.push({ input: z4Svg, top: currentY, left: 0 });
  currentY += zones.z4;

  // Zone 5 — Product Categories
  composites.push({ input: z5Svg, top: currentY, left: 0 });
  currentY += zones.z5;

  // Zone 6 — Footer Strip
  composites.push({ input: z6Svg, top: currentY, left: 0 });

  // Brand Logo top-left centered vertically
  const logoTop = Math.floor((zones.z1 - logoH) / 2);
  composites.push({ input: resizedLogoBuffer, top: logoTop, left: 30 });

  const finalImageBuffer = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(composites)
  .jpeg({ quality: 93 })
  .toBuffer();

  return finalImageBuffer;
}


// ─── Route handlers ───────────────────────────────────────────────────────────

exports.listTemplates = async (req, res) => {
  try {
    const templates = await ImageTemplate.find({ active: true }).sort({ occasion: 1 }).lean();
    return res.status(200).json({ templates });
  } catch (error) {
    console.error('List templates error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
};


exports.generatePromo = async (req, res) => {
  try {
    const { templateId, logoId, size, stylePreset } = req.body;
    const userId = req.user.id;

    if (!templateId || !logoId) {
      return res.status(400).json({ error: 'Missing required fields: templateId, logoId' });
    }

    const template = await ImageTemplate.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) return res.status(404).json({ error: 'Valid logo not found' });

    // Construct the structured overlays merging defaults + overrides
    const overrides = {
      heroContent: {
        headline: req.body.heroContent?.headline || template.heroContent?.headline || '',
        subheading: req.body.heroContent?.subheading || template.heroContent?.subheading || '',
        bodyMessage: req.body.heroContent?.bodyMessage || template.heroContent?.bodyMessage || '',
        closingSlogan: req.body.heroContent?.closingSlogan || template.heroContent?.closingSlogan || '',
        rightBoxQuote: req.body.heroContent?.rightBoxQuote || template.heroContent?.rightBoxQuote || '',
      },
      valuesRow: req.body.valuesRow || template.valuesRow || [],
      featuresBar: req.body.featuresBar || template.featuresBar || [],
      productCategories: req.body.productCategories || template.productCategories || [],
      footerColumns: req.body.footerColumns || template.footerColumns || [],
    };

    const finalImageBuffer = await runGeneration({ template, logoDoc, overrides, size, stylePreset });

    // Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'promo_posts', resource_type: 'image' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Failed to upload final image' });
        }
        
        const newPromoPost = new PromoPost({
          user: userId,
          logo: logoId,
          template: templateId,
          occasion: template.occasion,
          size: size || template.aspectRatio || '1024x1024',
          userOverrides: overrides,
          generatedImageUrl: result.secure_url,
        });
        await newPromoPost.save();
        return res.status(201).json({ message: 'Promo post created successfully!', promoPost: newPromoPost });
      }
    );
    streamifier.createReadStream(finalImageBuffer).pipe(uploadStream);

  } catch (error) {
    console.error('Generate promo error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Server error while generating promo post' });
  }
};


exports.regeneratePromo = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const existingPost = await PromoPost.findOne({ _id: postId, user: userId });
    if (!existingPost) return res.status(404).json({ error: 'Promo post not found or unauthorized' });

    const {
      templateId = existingPost.template,
      logoId = existingPost.logo,
      size = existingPost.size,
      stylePreset
    } = req.body;

    const template = await ImageTemplate.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) return res.status(404).json({ error: 'Valid logo not found' });

    // Merge overrides
    const overrides = {
      heroContent: {
        headline: req.body.heroContent?.headline || existingPost.userOverrides?.heroContent?.headline || template.heroContent?.headline || '',
        subheading: req.body.heroContent?.subheading || existingPost.userOverrides?.heroContent?.subheading || template.heroContent?.subheading || '',
        bodyMessage: req.body.heroContent?.bodyMessage || existingPost.userOverrides?.heroContent?.bodyMessage || template.heroContent?.bodyMessage || '',
        closingSlogan: req.body.heroContent?.closingSlogan || existingPost.userOverrides?.closingSlogan || template.heroContent?.closingSlogan || '',
        rightBoxQuote: req.body.heroContent?.rightBoxQuote || existingPost.userOverrides?.rightBoxQuote || template.heroContent?.rightBoxQuote || '',
      },
      valuesRow: req.body.valuesRow || existingPost.userOverrides?.valuesRow || template.valuesRow || [],
      featuresBar: req.body.featuresBar || existingPost.userOverrides?.featuresBar || template.featuresBar || [],
      productCategories: req.body.productCategories || existingPost.userOverrides?.productCategories || template.productCategories || [],
      footerColumns: req.body.footerColumns || existingPost.userOverrides?.footerColumns || template.footerColumns || [],
    };

    const finalImageBuffer = await runGeneration({ template, logoDoc, overrides, size, stylePreset });

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'promo_posts', resource_type: 'image' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Failed to upload regenerated image' });

        // Delete old Cloudinary image
        const oldUrl = existingPost.generatedImageUrl;
        if (oldUrl) {
          const oldMatch = oldUrl.match(/\/promo_posts\/([^./]+)\./);
          if (oldMatch) await cloudinary.uploader.destroy(`promo_posts/${oldMatch[1]}`, { resource_type: 'image' });
        }

        existingPost.template = templateId;
        existingPost.logo = logoId;
        existingPost.occasion = template.occasion;
        existingPost.size = size || template.aspectRatio;
        existingPost.userOverrides = overrides;
        existingPost.generatedImageUrl = result.secure_url;
        await existingPost.save();

        return res.status(200).json({ message: 'Promo post regenerated successfully!', promoPost: existingPost });
      }
    );
    streamifier.createReadStream(finalImageBuffer).pipe(uploadStream);

  } catch (error) {
    console.error('Regenerate promo error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Server error while regenerating promo post' });
  }
};


exports.listPromos = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized: User ID missing' });
    const promoPosts = await PromoPost.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('template', 'name occasion')
      .lean();
    const transformed = promoPosts.map(post => ({ ...post, id: post._id.toString() }));
    return res.status(200).json({ promoPosts: transformed });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch promo posts' });
  }
};


exports.deletePromo = async (req, res) => {
  try {
    const post = await PromoPost.findOne({ _id: req.params.id, user: req.user.id });
    if (!post) return res.status(404).json({ error: 'Promo post not found or unauthorized' });
    const imageUrl = post.generatedImageUrl;
    if (imageUrl) {
      const match = imageUrl.match(/\/promo_posts\/([^./]+)\./);
      if (match) await cloudinary.uploader.destroy(`promo_posts/${match[1]}`, { resource_type: 'image' });
    }
    await PromoPost.deleteOne({ _id: req.params.id });
    return res.status(200).json({ message: 'Promo post deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while deleting promo post' });
  }
};


exports.downloadPromo = async (req, res) => {
  try {
    const post = await PromoPost.findById(req.params.id);
    if (!post || !post.generatedImageUrl) return res.status(404).json({ error: 'Image not found' });
    const response = await axios.get(post.generatedImageUrl, { responseType: 'arraybuffer' });
    const ext = path.extname(new URL(post.generatedImageUrl).pathname) || '.jpg';
    res.setHeader('Content-Disposition', `attachment; filename="promo_${post.occasion || 'image'}${ext}"`);
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    res.status(500).json({ error: 'Failed to download image' });
  }
};


exports.togglePromoFavorite = async (req, res) => {
  try {
    const post = await PromoPost.findOne({ _id: req.params.id, user: req.user.id });
    if (!post) return res.status(404).json({ error: 'Promo post not found or unauthorized' });
    post.favorite = !post.favorite;
    await post.save();
    return res.status(200).json({ message: 'Favorite status updated', favorite: post.favorite });
  } catch (error) {
    return res.status(500).json({ error: 'Server error while updating favorite' });
  }
};

exports.runGeneration = runGeneration;


