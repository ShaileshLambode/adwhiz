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


// ─── SVG-based body text overlay (NO canvas package needed) ──────────────────
/**
 * Renders the body copy (tagline, body message, footer slogan) as an SVG overlay
 * on the LEFT PANEL of the poster using Sharp's built-in SVG support.
 *
 * This is how we show multi-line text — Recraft text_layout only handles
 * short display words (HAPPY DIWALI), NOT paragraph sentences.
 *
 * @param {Object} textData - { tagline, body, footer, website, email }
 * @param {number} imgWidth - Image width in px
 * @param {number} imgHeight - Image height in px
 * @returns {Buffer} PNG buffer from SVG
 */
function buildTextOverlaySVG(textData, imgWidth, imgHeight) {
  const leftPanelWidth = Math.floor(imgWidth * 0.46); // Left 46%
  const panelX = 0;

  // Escape XML special characters
  const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // Font sizes scaled to image size
  const taglineSize = Math.floor(imgWidth * 0.028);  // ~29px at 1024
  const bodySize    = Math.floor(imgWidth * 0.020);  // ~20px at 1024
  const footerSize  = Math.floor(imgWidth * 0.019);  // ~19px at 1024
  const contactSize = Math.floor(imgWidth * 0.017);  // ~17px at 1024

  // Tagline — wrap at ~28 chars per line
  const taglineLines = wrapText(textData.tagline || '', 28);
  // Body — wrap at ~32 chars per line
  const bodyLines = wrapText(textData.body || '', 32);

  // Y positions — below where Recraft renders HEADLINE + DIWALI! text
  // Recraft puts headline at y~0.18..0.30 of image, so start body content at 0.38
  let currentY = Math.floor(imgHeight * 0.38);
  const lineGap = bodySize * 1.55;

  let textElements = '';

  // Tagline
  if (taglineLines.length) {
    textElements += `<text x="${leftPanelWidth / 2}" y="${currentY}" 
      font-family="Arial, sans-serif" font-size="${taglineSize}" font-weight="600"
      fill="#F7C948" text-anchor="middle" opacity="0.95">${esc(taglineLines[0])}</text>`;
    currentY += taglineSize * 1.6;
    if (taglineLines[1]) {
      textElements += `<text x="${leftPanelWidth / 2}" y="${currentY}" 
        font-family="Arial, sans-serif" font-size="${taglineSize}" font-weight="600"
        fill="#F7C948" text-anchor="middle" opacity="0.95">${esc(taglineLines[1])}</text>`;
      currentY += taglineSize * 1.6;
    }
  }

  // Spacer
  currentY += bodySize * 0.8;

  // Body copy
  bodyLines.forEach(line => {
    textElements += `<text x="${leftPanelWidth / 2}" y="${currentY}"
      font-family="Arial, sans-serif" font-size="${bodySize}" font-weight="400"
      fill="#FFFFFF" text-anchor="middle" opacity="0.88">${esc(line)}</text>`;
    currentY += lineGap;
  });

  // ── Bottom contact strip ──────────────────────────────────────────────────
  // Footer slogan
  const footerY = Math.floor(imgHeight * 0.88);
  const footerLines = wrapText(textData.footer || '', 36);
  footerLines.forEach((line, idx) => {
    textElements += `<text x="${imgWidth / 2}" y="${footerY + idx * (footerSize * 1.4)}"
      font-family="Arial, sans-serif" font-size="${footerSize}" font-weight="500"
      fill="#FFFFFF" text-anchor="middle" opacity="0.85">${esc(line)}</text>`;
  });

  // Website + email contact bar at very bottom
  const contactBarY = imgHeight - Math.floor(imgHeight * 0.065);
  const contactText = [textData.website, textData.email].filter(Boolean).join('  |  ');
  textElements += `
    <rect x="0" y="${imgHeight - Math.floor(imgHeight * 0.08)}" 
      width="${imgWidth}" height="${Math.floor(imgHeight * 0.08)}" 
      fill="rgba(0,0,0,0.6)"/>
    <text x="${imgWidth / 2}" y="${contactBarY}"
      font-family="Arial, sans-serif" font-size="${contactSize}" font-weight="600"
      fill="#FFFFFF" text-anchor="middle">${esc(contactText)}</text>`;

  const svg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
    ${textElements}
  </svg>`;

  return Buffer.from(svg);
}

/**
 * Simple word-wrap utility — splits a string into lines of maxChars.
 */
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}


// ─── Canvas footer strip (used only for website+email bar) ───────────────────
function renderFooterStrip(website, email, imageWidth) {
  const height = Math.max(Math.floor(imageWidth * 0.07), 40);
  const canvas = createCanvas(imageWidth, height);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
  ctx.fillRect(0, 0, imageWidth, height);
  const fontSize = Math.floor(height * 0.38);
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const contactText = [website, email].filter(Boolean).join('  |  ');
  ctx.fillText(contactText, imageWidth / 2, height / 2);
  return canvas.toBuffer('image/png');
}


// ─── Core generation logic (shared by generate + regenerate) ─────────────────
async function runGeneration({ template, logoDoc, textInputs, size, stylePreset }) {

  const prompt = buildPrompt(template, logoDoc);
  console.log('[Promo] Prompt:', prompt);

  // ── Build text_layout: ONLY for short display words (headline slot only) ──
  // text_layout is Recraft's "signage" feature — works for HAPPY DIWALI, not body paragraphs
  const text_layout = [];
  const headlineSlot = template.textSlots.find(s => s.id === 'headline');
  if (headlineSlot) {
    const headlineInput = textInputs.find(ti => ti.id === 'headline');
    const headlineText = headlineInput ? headlineInput.value : headlineSlot.defaultText || '';
    if (headlineText.trim()) {
      const entries = buildTextLayoutEntries(headlineText, headlineSlot.bbox);
      text_layout.push(...entries);
    }
  }

  // ── Build color controls ──────────────────────────────────────────────────
  const colorControls = template.colorPalette
    .filter(hex => hex && hex.trim())
    .map(hex => hexToRgb(hex));

  const imageSize = size || template.aspectRatio || '1024x1024';

  // ── FIX: Map frontend preset labels to valid Recraft V3 style strings ──────
  // Frontend may send "minimalist", "vintage_poster", "three_d_render" — these are INVALID
  const VALID_STYLES = {
    'realistic_image':       'digital_illustration',       // override: realistic creates photos
    'digital_illustration':  'digital_illustration',
    'minimalist':            'digital_illustration/flat_design',
    'vintage_poster':        'digital_illustration/engraving',
    'three_d_render':        'digital_illustration/2d_art_poster',
    'flat_design':           'digital_illustration/flat_design',
  };
  const recraftStyle = VALID_STYLES[stylePreset] || 'digital_illustration/flat_design';

  // ── Recraft API Payload ───────────────────────────────────────────────────
  // CRITICAL: text_layout is a TOP-LEVEL parameter — NOT inside controls{}
  const recraftPayload = {
    prompt,
    model: 'recraftv3',
    style: recraftStyle,
    size: imageSize,
    n: 1,
    response_format: 'url',
    controls: {
      colors: colorControls.length > 0 ? colorControls : undefined,
    },
  };

  // Only add text_layout at top level if we have entries
  if (text_layout.length > 0) {
    recraftPayload.text_layout = text_layout;  // TOP LEVEL — not inside controls
  }

  console.log('[Promo] Recraft payload:', JSON.stringify(recraftPayload, null, 2));

  // ── Call Recraft API ──────────────────────────────────────────────────────
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

  // ── Download base image + logo ────────────────────────────────────────────
  const [baseImageBuffer, logoBuffer] = await Promise.all([
    axios.get(generatedImageUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
    axios.get(logoDoc.images.url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
  ]);

  const processedLogoBuffer = await removeLogoBackground(logoBuffer);
  const baseMetadata = await sharp(baseImageBuffer).metadata();
  const { width: imgWidth, height: imgHeight } = baseMetadata;

  // ── Resize logo to 18% of image width ────────────────────────────────────
  const resizedLogoBuffer = await sharp(processedLogoBuffer)
    .resize({ width: Math.round(imgWidth * 0.18) })
    .toBuffer();

  // ── Build text overlay SVG for tagline, body, footer (NOT Recraft text_layout) ─
  const taglineInput  = textInputs.find(ti => ti.id === 'tagline');
  const bodyInput     = textInputs.find(ti => ti.id === 'body');
  const footerInput   = textInputs.find(ti => ti.id === 'footer');
  const websiteInput  = textInputs.find(ti => ti.id === 'website');
  const emailInput    = textInputs.find(ti => ti.id === 'email');

  const svgOverlayBuffer = buildTextOverlaySVG(
    {
      tagline: taglineInput ? taglineInput.value : '',
      body:    bodyInput    ? bodyInput.value    : '',
      footer:  footerInput  ? footerInput.value  : '',
      website: websiteInput ? websiteInput.value : '',
      email:   emailInput   ? emailInput.value   : '',
    },
    imgWidth,
    imgHeight
  );

  // ── Composite: base → SVG text overlay → logo ────────────────────────────
  const finalImageBuffer = await sharp(baseImageBuffer)
    .composite([
      { input: svgOverlayBuffer, top: 0, left: 0 },      // text overlay (tagline, body, footer, contact)
      { input: resizedLogoBuffer, top: 28, left: 28 },    // brand logo top-left
    ])
    .jpeg({ quality: 92 })
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
    const { templateId, logoId, textInputs, size, stylePreset } = req.body;
    const userId = req.user.id;

    if (!templateId || !logoId || !textInputs || !Array.isArray(textInputs)) {
      return res.status(400).json({ error: 'Missing required fields: templateId, logoId, textInputs' });
    }

    const template = await ImageTemplate.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) return res.status(404).json({ error: 'Valid logo not found' });

    const finalImageBuffer = await runGeneration({ template, logoDoc, textInputs, size, stylePreset });

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
          textInputs,
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
      textInputs = existingPost.textInputs,
      size = existingPost.size,
      stylePreset
    } = req.body;

    const template = await ImageTemplate.findById(templateId);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) return res.status(404).json({ error: 'Valid logo not found' });

    const finalImageBuffer = await runGeneration({ template, logoDoc, textInputs, size, stylePreset });

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
        existingPost.textInputs = textInputs;
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
