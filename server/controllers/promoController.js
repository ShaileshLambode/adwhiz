const cloudinary = require("../utils/cloudinary");
const axios = require("axios");
const sharp = require("sharp");
const streamifier = require("streamifier");
const path = require("path");
const openai = require("../utils/openai");

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
  buildZone5ProductLabels,
  buildZone6FooterStrip
} = require("../utils/svgBuilder");
const { parseSize, calculateZoneHeights } = require("../utils/posterLayout");
const { getDefaultFestivalPalette } = require("../utils/festivalPalettes");


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

/**
 * Extracts up to 5 dominant colors from a logo image buffer using Sharp pixel sampling.
 * Samples a downscaled version of the logo, filters out near-white/near-black,
 * sorts remaining pixels by hue, and picks 5 evenly-spaced samples.
 * Returns an array of hex color strings.
 */
async function extractLogoColors(logoBuffer) {
  try {
    const smallBuffer = await sharp(logoBuffer)
      .resize(80, 80, { fit: 'inside' })
      .removeAlpha()
      .raw()
      .toBuffer();

    const pixels = [];
    for (let i = 0; i + 2 < smallBuffer.length; i += 12) { // every 4th pixel
      const r = smallBuffer[i], g = smallBuffer[i+1], b = smallBuffer[i+2];
      const brightness = (r + g + b) / 3;
      if (brightness > 235 || brightness < 20) continue; // skip white/black bg
      pixels.push([r, g, b]);
    }

    if (pixels.length < 5) {
      return ['#FFD700', '#4B0082', '#FF6347', '#FFA500', '#FFFFFF'];
    }

    const toHex = ([r, g, b]) =>
      '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Sort by hue
    const withHue = pixels.map(px => {
      const [r, g, b] = [px[0]/255, px[1]/255, px[2]/255];
      const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
      let h = 0;
      if (d !== 0) {
        if (max === r) h = ((g-b)/d + (g < b ? 6 : 0)) / 6;
        else if (max === g) h = ((b-r)/d + 2) / 6;
        else h = ((r-g)/d + 4) / 6;
      }
      return { px, h };
    });
    withHue.sort((a, b) => a.h - b.h);

    // Pick 5 evenly spaced samples
    const step = Math.floor(withHue.length / 5);
    return Array.from({ length: 5 }, (_, i) =>
      toHex(withHue[Math.min(i * step, withHue.length - 1)].px)
    );
  } catch (err) {
    console.error('Color extraction error:', err.message);
    return ['#FFD700', '#4B0082', '#FF6347', '#FFA500', '#FFFFFF'];
  }
}

// ─── Core generation logic (composite vertical pipeline) ───────────────────
async function runGeneration({ template, logoDoc, overrides, size, stylePreset, aiSuggestedColors, recraftScenePrompt, festivalPalette }) {
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

  // Download logo first to extract colors
  const logoBuffer = await axios.get(logoDoc.images.url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data));
  const logoColors = await extractLogoColors(logoBuffer);

  // Logo colors → Recraft ONLY (so hero scene is brand-influenced)
  const recraftColors = (logoColors && logoColors.length >= 2 ? logoColors : template.colorPalette).slice(0, 3);

  // Festival palette → all SVG zone rendering
  // Priority: GPT-provided > generic fallback
  const palette = (festivalPalette && festivalPalette.panelBg) ? festivalPalette : getDefaultFestivalPalette();

  const RECRAFT_SIZE_MAP = {
    '1024x1024': '1024x1024',   // Square → Square hero
    '1024x1365': '1024x1365',   // Portrait → Portrait hero
    '1365x1024': '1365x1024',   // Landscape → Landscape hero
    '1024x1536': '1024x1536',   // Story → Tall portrait hero
  };
  const recraftImageSize = RECRAFT_SIZE_MAP[size] || '1024x1536';

  const recraftPayload = {
    prompt: recraftScenePrompt || buildPrompt(template),
    model: 'recraftv3',
    style: recraftStyle,
    size: recraftImageSize,
    n: 1,
    response_format: 'url',
    controls: {
      colors: recraftColors
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

  // 3. Download base image
  const heroSceneBaseBuffer = await axios.get(generatedImageUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data));

  // 4. Poster layout allocations
  const [W, H] = parseSize(size);
  const zones = calculateZoneHeights(H, W);

  const isLandscape = W > H;
  const panelW_left = isLandscape
    ? Math.floor(W * 0.40)
    : Math.floor(W * 0.46);
  const panelW_right = W - panelW_left;

  const quoteBoxW = isLandscape
    ? Math.floor(panelW_right * 0.55)
    : Math.floor(panelW_right * 0.45);
  const quoteBoxH = Math.floor(zones.z2 * 0.78);      // slightly shorter so floating icon fits
  const quoteBoxX = panelW_left + Math.floor(panelW_right * 0.50);
  const minRightMargin = Math.floor(W * 0.02); // 2% right margin minimum
  const maxRightEdge = W - minRightMargin;
  const clampedQuoteBoxX = Math.min(quoteBoxX, maxRightEdge - quoteBoxW);

  // Pull quoteBoxY up by 20px so the floating icon above the box is visible within z2
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

  // 6. Generate SVG buffers for each zone using festival palette
  const z1Svg = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, zones.z1, palette);
  const z2LeftSvg = buildZone2Left(overrides.heroContent, panelW_left, zones.z2, palette, template.occasion);
  const z2RightBoxSvg = buildZone2Right_QuoteBox(overrides.heroContent.rightBoxQuote, quoteBoxW, quoteBoxH, palette, template.occasion);
  const z3Svg = buildZone3ValuesRow(overrides.valuesRow, W, zones.z3, palette);
  const z4Svg = buildZone4FeaturesBar(overrides.featuresBar, W, zones.z4, palette);
  const z5Svg = buildZone5ProductLabels(overrides.productCategories, W, zones.z5, palette);
  const z6Svg = buildZone6FooterStrip(overrides.footerColumns, W, zones.z6, palette);

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
  composites.push({ input: z2RightBoxSvg, top: quoteBoxY, left: clampedQuoteBoxX });
  currentY += zones.z2;

  // Zone 3 — Values Row
  composites.push({ input: z3Svg, top: currentY, left: 0 });
  currentY += zones.z3;

  // Zone 4 — Features Bar
  composites.push({ input: z4Svg, top: currentY, left: 0 });
  currentY += zones.z4;

  // Zone 5 — Product Categories
  const currentY_z5 = currentY;
  composites.push({ input: z5Svg, top: currentY_z5, left: 0 });
  currentY += zones.z5;

  // Zone 6 — Footer Strip
  composites.push({ input: z6Svg, top: currentY, left: 0 });

  // 8. Product image compositing
  const productComposites = [];
  if (overrides.productCategories && overrides.productCategories.length > 0) {
    const N = overrides.productCategories.length;
    const colW = Math.floor(W / N);
    const imgSize = Math.min(Math.floor(zones.z5 * 0.65), colW - 8); // max size fits in cell
    const imgY = currentY_z5 + Math.floor(zones.z5 * 0.08); // top padding

    for (let i = 0; i < N; i++) {
      const prod = overrides.productCategories[i];
      if (!prod || !prod.imageUrl) continue;

      try {
        const productImgBuffer = await axios
          .get(prod.imageUrl, { responseType: 'arraybuffer', timeout: 8000 })
          .then(r => Buffer.from(r.data));

        const resizedProduct = await sharp(productImgBuffer)
          .resize({ width: imgSize, height: imgSize, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();

        const imgX = i * colW + Math.floor((colW - imgSize) / 2);
        productComposites.push({ input: resizedProduct, top: imgY, left: imgX });
      } catch (err) {
        console.warn(`Product image ${i} failed to load:`, err.message);
        // Silently skip — name label still shows from SVG
      }
    }
  }

  composites.push(...productComposites);

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
    const { templateId, logoId, size, stylePreset, aiSuggestedColors, recraftScenePrompt, festivalPalette } = req.body;
    const userId = req.user.id;

    if (!logoId) {
      return res.status(400).json({ error: 'Missing required field: logoId' });
    }

    let template;
    if (templateId) {
      template = await ImageTemplate.findById(templateId);
    } else {
      template = await ImageTemplate.findOne({ occasion: 'default' });
    }
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

    const finalImageBuffer = await runGeneration({
      template,
      logoDoc,
      overrides,
      size,
      stylePreset,
      aiSuggestedColors,
      recraftScenePrompt,
      festivalPalette
    });

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
          template: template._id,
          occasion: req.body.occasion || template.occasion,
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
      stylePreset,
      aiSuggestedColors,
      recraftScenePrompt,
      festivalPalette
    } = req.body;

    let template;
    if (templateId) {
      template = await ImageTemplate.findById(templateId);
    } else {
      template = await ImageTemplate.findOne({ occasion: 'default' });
    }
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

    const finalImageBuffer = await runGeneration({
      template,
      logoDoc,
      overrides,
      size,
      stylePreset,
      aiSuggestedColors,
      recraftScenePrompt,
      festivalPalette
    });

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

        existingPost.template = template._id;
        existingPost.logo = logoId;
        existingPost.occasion = req.body.occasion || template.occasion;
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


exports.aiFillContent = async (req, res) => {
  try {
    const { businessName, festivalName, sector, website, email } = req.body;

    if (!businessName || !festivalName) {
      return res.status(400).json({ error: 'businessName and festivalName are required' });
    }

    const systemPrompt = `You are an expert Indian marketing copywriter AND a color-theory expert creating festival poster content for "${businessName}", a ${sector || 'business'} company. Always respond with ONLY valid JSON — no markdown, no explanation, no code fences.

When generating festivalPalette, follow these strict design rules:

RULE 1 — panelBg (left panel background):
  Choose EITHER:
  (a) A rich, dark color deeply associated with the festival mood — e.g. deep indigo for Diwali, deep crimson for Bhai Dooj, forest green for Christmas, deep teal for Onam. Set useDarkPanel: true.
  (b) A very warm light cream/ivory tone (in the #FAF6F0 to #FFFDF5 range) for festivals that feel bright and celebratory — e.g. Holi, Independence Day, Navratri. Set useDarkPanel: false.
  NEVER use: grey, muted corporate tones, or any color that does not evoke the specific festival.

RULE 2 — headlineColor:
  If useDarkPanel is true: use a bright glowing color (gold, bright orange, bright yellow) that shines on the dark background. 
  If useDarkPanel is false: use a deep, fully saturated version of the festival primary color.
  CRITICAL: Contrast against panelBg must be very high. Never choose a headlineColor similar to panelBg.

RULE 3 — subheadingColor:
  A secondary accent that complements headlineColor. Use a different hue from the same festival family.

RULE 4 — bodyTextColor:
  If useDarkPanel is true: use #FFFFFF or a near-white tone.
  If useDarkPanel is false: use a dark rich tone (#2D2D2D or a dark festival color) with strong contrast.

RULE 5 — sloganColor:
  Color for the italic closing slogan. Should feel warm and expressive. Usually matches headlineColor or uses a warm accent from the festival palette.

RULE 6 — footerBg:
  ALWAYS a rich, saturated, deep festival color. This strip anchors the poster and must feel bold.
  Examples: deep purple, deep crimson, forest green, navy, dark maroon.
  NEVER white, cream, or light colors. NEVER grey.

RULE 7 — footerTextAccent:
  Bright warm color for highlighted footer text. Gold #FFD700 or festival bright accent works for most.

RULE 8 — iconCircleColor:
  The accent color for icon circle borders and fills in the values row. Use the festival main accent.

RULE 9 — featureBorderColor:
  Border color for the feature badge pill outlines. Can match or complement iconCircleColor.

RULE 10 — zoneBgTint:
  Background for Zones 3, 4, and 5 (values row, features bar, products row).
  Use a CLEARLY VISIBLE light tint of the festival color — not plain white.
  It must look like a deliberate background choice, not an accident.
  For warm/orange festivals: #FFF0E0 or #FFE8CC range.
  For red/maroon festivals: #FFF0F0 or #FFE8E8 range.
  For green festivals: #F0FFF0 or #E8F5E8 range.
  For purple/indigo festivals: #F5F0FF or #EDE0FF range.
  For pink/magenta festivals: #FFF0F8 or #FFE0F0 range.
  Minimum saturation: the hex value must differ from #FFFFFF by at least 20 in at least one channel.
  NEVER return #FFFFFF, #FAFAFA, #F8F8F8, or any near-white without a clear hue.`;

    const userPrompt = `Generate complete festival marketing poster content for "${festivalName}".
Business: ${businessName} | Sector: ${sector || 'General'} | Website: ${website || ''} | Email: ${email || ''}

CRITICAL: For all 'icon' fields in valuesRow, featuresBar, and footerColumns, do NOT use standard colored emojis (like 🎁, 🛡️, ✉, 🌐, 🛍️). Instead, ALWAYS use one of the following safe cross-platform unicode geometric/shape symbols: '★', '♥', '◆', '●', '✿', '✦', '❖', '▲', '■'.

STRICT LENGTH LIMITS — required for the poster layout to render correctly:
- headline: max 20 characters (e.g. "Happy Holi!" = 11 chars)
- subheading: max 30 characters
- closingSlogan: max 40 characters
- rightBoxQuote: STRICT max 110 characters. Count the characters before submitting. If over 110, shorten it.
- valuesRow[].label: ONE word only, max 12 characters
- valuesRow[].sublabel: max 22 characters (3-4 short words)
- featuresBar[].text: max 30 characters
- footerColumns[].lines[]: each line max 22 characters
- footerColumns[].highlight: max 25 characters

Return ONLY this JSON structure (no extra keys):
{
  "heroContent": {
    "headline": "2-3 word greeting like Happy Diwali!",
    "subheading": "3-6 word occasion tagline",
    "bodyMessage": "2-3 warm sentences mentioning ${businessName} naturally",
    "closingSlogan": "Short memorable closing line under 10 words",
    "rightBoxQuote": "2-3 sentence inspirational festival quote"
  },
  "valuesRow": [
    { "icon": "safe unicode symbol", "label": "ONE WORD", "sublabel": "3-4 word phrase" },
    { "icon": "safe unicode symbol", "label": "ONE WORD", "sublabel": "3-4 word phrase" },
    { "icon": "safe unicode symbol", "label": "ONE WORD", "sublabel": "3-4 word phrase" }
  ],
  "featuresBar": [
    { "icon": "safe unicode symbol", "text": "SHORT MARKETING PHRASE IN CAPS." },
    { "icon": "safe unicode symbol", "text": "SHORT MARKETING PHRASE IN CAPS." },
    { "icon": "safe unicode symbol", "text": "SHORT MARKETING PHRASE IN CAPS." },
    { "icon": "safe unicode symbol", "text": "SHORT MARKETING PHRASE IN CAPS." }
  ],
  "footerColumns": [
    { "icon": "safe unicode symbol", "lines": ["LINE 1", "LINE 2", "LINE 3"], "highlight": "HIGHLIGHT PHRASE" },
    { "icon": "safe unicode symbol", "lines": ["LINE 1", "LINE 2", "LINE 3"], "highlight": null },
    { "icon": "safe unicode symbol", "lines": ["LINE 1", "LINE 2", "LINE 3"], "highlight": null },
    { "icon": "safe unicode symbol", "lines": ["${businessName.toUpperCase()} \\u2014", "TAGLINE LINE", "BRAND LINE"], "highlight": "BRAND CALL TO ACTION." }
  ],
  "recraftScenePrompt": "Detailed Recraft AI scene description for ${festivalName} festival background. Flat 2D digital illustration style. No text, no people, no banners.",
  "festivalPalette": {
    "panelBg": "hex — left panel background, following RULE 1",
    "useDarkPanel": true,
    "headlineColor": "hex — large headline text, following RULE 2",
    "subheadingColor": "hex — subheading text, following RULE 3",
    "bodyTextColor": "hex — body copy text, following RULE 4",
    "sloganColor": "hex — italic closing slogan, following RULE 5",
    "footerBg": "hex — footer strip background, following RULE 6",
    "footerTextAccent": "hex — footer highlight text, following RULE 7",
    "iconCircleColor": "hex — values row icon circles, following RULE 8",
    "featureBorderColor": "hex — feature badge borders, following RULE 9",
    "zoneBgTint": "hex — zones 3/4/5 background, following RULE 10"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1600,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(completion.choices[0].message.content);

    if (!parsed.heroContent || !parsed.valuesRow || !parsed.featuresBar || !parsed.footerColumns) {
      throw new Error('GPT response missing required fields');
    }

    return res.status(200).json({ content: parsed });

  } catch (error) {
    console.error('AI fill error:', error?.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to generate AI content. Please try again.' });
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

exports.uploadProductImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const fs = require('fs');
    
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'promo_product_images',
      resource_type: 'image',
      transformation: [
        { width: 200, height: 200, crop: 'fill', gravity: 'center' },
        { background: 'white', effect: 'trim' }
      ]
    });

    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn("Failed to delete local file:", err.message);
    }

    return res.status(200).json({
      imageUrl:           result.secure_url,
      cloudinaryPublicId: result.public_id
    });
  } catch (error) {
    console.error('Product image upload error:', error.message);
    if (req.file && req.file.path) {
      const fs = require('fs');
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (err) {
        console.warn("Failed to cleanup local file:", err.message);
      }
    }
    return res.status(500).json({ error: 'Failed to upload product image' });
  }
};


