const axios       = require('axios');
const sharp       = require('sharp');
const streamifier = require('streamifier');
const path        = require('path');
const cloudinary  = require('../utils/cloudinary');
const openai      = require('../utils/openai');
const Logo        = require('../models/Logo');
const OfferPost   = require('../models/OfferPost');
const { processLogo } = require('../utils/logoProcessor');
const { applyWatermark } = require('../utils/watermark');
const { incrementUsage } = require('../middleware/usageMiddleware');

// ── GPT polishes the offer copy ───────────────────────────────────────────────
async function generateOfferCopy(businessName, sector, offerHeadline, offerDetails, validity, cta) {
  const systemPrompt = `You are a marketing copywriter for ${businessName}. Write punchy, clear offer announcements. Only return JSON.`;
  const userPrompt = `Polish this offer announcement for social media:
Offer: "${offerHeadline}"
Details: "${offerDetails}"
Valid: "${validity}"
CTA: "${cta}"
Sector: ${sector}

Return JSON:
{
  "headline": "Polished offer headline. Max 30 chars. Bold and exciting.",
  "subheadline": "Sub-line with key detail. Max 40 chars.",
  "body": "1-2 sentences of offer detail. Max 100 chars.",
  "validity": "Validity line. Max 30 chars.",
  "cta": "Call to action text. Max 25 chars.",
  "backgroundPrompt": "Pure abstract background art. Smooth gradient color fields, soft geometric shapes, subtle light bokeh or flowing curves. Calm and professional mood. ABSOLUTELY NO text, NO letters, NO numbers, NO labels, NO diagrams, NO icons, NO people, NO faces. Just color and shape — nothing that resembles writing or symbols. Max 35 words.",
  "bgStyle": "digital_illustration/flat_design"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.6,
    max_tokens: 350,
    response_format: { type: 'json_object' }
  });
  return JSON.parse(completion.choices[0].message.content);
}

// ── 3-zone SVG for offer post ─────────────────────────────────────────────────
function buildOfferZone1(website, email, W, H1) {
  const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fSize = Math.floor(H1 * 0.30);

  const parts = [];
  if (website) parts.push(`🌐 ${website}`);
  if (email)   parts.push(`✉ ${email}`);
  const contact = parts.join('     ') || '';

  return Buffer.from(`<svg width="${W}" height="${H1}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H1}" fill="rgba(0,0,0,0.55)"/>
    <text x="${W - 20}" y="${Math.floor(H1 * 0.62)}" text-anchor="end"
      font-family="Arial, sans-serif" font-size="${fSize}"
      fill="rgba(255,255,255,0.90)">${esc(contact)}</text>
  </svg>`);
}

function buildOfferHeroZone(copy, W, H2, accentColor = '#FFD700') {
  const esc  = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const mid  = W / 2;
  const pad  = Math.floor(W * 0.07);

  // Scale to IMAGE WIDTH, not zone height, and add pixel-accurate wrapping
  const hlSize    = Math.floor(W * 0.060);   // ~61px at 1024 — much safer
  const subSize   = Math.floor(W * 0.032);   // ~33px
  const bodySize  = Math.floor(W * 0.022);   // ~23px
  const validSize = Math.floor(W * 0.020);   // ~21px

  // Headline wrapping (pixel-accurate pattern)
  const hlCharW    = hlSize * 0.65;          // uppercase bold Arial slightly wider
  const hlMaxChars = Math.floor((W - pad * 2) / hlCharW);
  const hlWords    = (copy.headline || '').split(' ');
  const hlLines    = [];
  let   hlCur      = '';
  for (const w of hlWords) {
    if ((hlCur + ' ' + w).trim().length <= hlMaxChars) {
      hlCur = (hlCur + ' ' + w).trim();
    } else {
      if (hlCur) hlLines.push(hlCur);
      hlCur = w;
    }
  }
  if (hlCur) hlLines.push(hlCur);

  // Wrap body
  const bChars = Math.floor((W - pad * 2) / (bodySize * 0.58));
  const bWords = (copy.body || '').split(' ');
  const bLines = []; let cur = '';
  for (const w of bWords) {
    if ((cur + ' ' + w).trim().length <= bChars) cur = (cur + ' ' + w).trim();
    else { if (cur) bLines.push(cur); cur = w; }
  }
  if (cur) bLines.push(cur);

  let content = '';

  // Gradient overlay for readability (increased opacity)
  content += `<defs>
    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(0,0,0,0.58)"/>
      <stop offset="35%"  stop-color="rgba(0,0,0,0.50)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.68)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H2}" fill="url(#heroGrad)"/>`;

  // Headline (multiple lines if wrapped)
  hlLines.forEach((line, i) => {
    content += `<text x="${mid}" y="${Math.floor(H2 * 0.20) + (i + 1) * hlSize * 1.1}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${hlSize}" font-weight="900"
      fill="${accentColor}">${esc(line.toUpperCase())}</text>`;
  });

  // Track dynamic Y position after headline lines
  let currentY = Math.floor(H2 * 0.20) + hlLines.length * hlSize * 1.1 + Math.floor(H2 * 0.06);

  // Sub-headline
  content += `<text x="${mid}" y="${currentY}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${subSize}" font-weight="700" letter-spacing="1"
    fill="#FFFFFF">${esc(copy.subheadline || '')}</text>`;
  currentY += Math.floor(subSize * 2.4);

  // Body lines
  bLines.forEach(line => {
    content += `<text x="${mid}" y="${currentY}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${bodySize}" fill="rgba(255,255,255,0.88)">${esc(line)}</text>`;
    currentY += Math.floor(bodySize * 1.85);
  });
  currentY += Math.floor(H2 * 0.05);

  // Validity badge
  const badgeH = Math.floor(validSize * 2.5);
  const badgeW = Math.floor(W * 0.52);
  const badgeX = Math.floor((W - badgeW) / 2);
  content += `
  <rect x="${badgeX - 4}" y="${currentY - 4}" width="${badgeW + 8}" height="${badgeH + 8}"
    rx="6" fill="rgba(0,0,0,0.55)"/>
  <rect x="${badgeX}" y="${currentY}" width="${badgeW}" height="${badgeH}"
    rx="4" fill="${accentColor}" opacity="0.22"/>
  <rect x="${badgeX}" y="${currentY}" width="${badgeW}" height="${badgeH}"
    rx="4" fill="none" stroke="${accentColor}" stroke-width="1.5" opacity="0.9"/>
  <text x="${mid}" y="${currentY + Math.floor(badgeH * 0.65)}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${validSize}" fill="${accentColor}" font-weight="700">${esc(copy.validity || '')}</text>`;

  return Buffer.from(`<svg width="${W}" height="${H2}" xmlns="http://www.w3.org/2000/svg">
    ${content}
  </svg>`);
}

function buildOfferCTAStrip(ctaText, W, H3, accentColor = '#FFD700') {
  const esc   = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fSize = Math.floor(H3 * 0.32);
  const iconSize = Math.floor(H3 * 0.34);

  return Buffer.from(`<svg width="${W}" height="${H3}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H3}" fill="${accentColor}"/>
    <text x="${W/2 - Math.floor(W*0.16)}" y="${Math.floor(H3 * 0.65)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${iconSize}" fill="#1A1A1A">&#10148;</text>
    <text x="${W/2}" y="${Math.floor(H3 * 0.63)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${fSize}" font-weight="900" letter-spacing="3"
      fill="#1A1A1A">${esc(ctaText.toUpperCase())}</text>
  </svg>`);
}

function detectUrgency(validityText) {
  const urgentWords = ['today', 'weekend', 'limited', 'ends', 'only', 'last', 'final', 'hurry'];
  const lower = (validityText || '').toLowerCase();
  return urgentWords.some(w => lower.includes(w));
}

function buildUrgencyRibbon(W, H, label = 'LIMITED TIME') {
  const esc = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const ribbonW = Math.floor(W * 0.34);
  const ribbonH = Math.floor(W * 0.045);

  return Buffer.from(`<svg width="${ribbonW * 1.5}" height="${ribbonH * 3}" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(40 ${ribbonW * 0.75} ${ribbonH * 1.5})">
      <rect x="0" y="${ribbonH}" width="${ribbonW * 1.5}" height="${ribbonH}"
        fill="#E63946"/>
      <text x="${ribbonW * 0.75}" y="${ribbonH * 1.72}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${Math.floor(ribbonH * 0.55)}" font-weight="900" letter-spacing="1"
        fill="#FFFFFF">${esc(label)}</text>
    </g>
  </svg>`);
}

// ── Main generate handler ─────────────────────────────────────────────────────
exports.generateOfferPost = async (req, res) => {
  try {
    const { logoId, offerHeadline, offerDetails, validity, cta, accentColor, size = '1024x1024' } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!logoId || !offerHeadline) {
      return res.status(400).json({ error: 'logoId and offerHeadline are required' });
    }

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) return res.status(404).json({ error: 'Logo not found' });

    // 1. GPT polishes copy
    const copy = await generateOfferCopy(
      logoDoc.name, logoDoc.sector || 'business',
      offerHeadline, offerDetails || '', validity || '', cta || 'Visit Us Today'
    );

    // 2. Recraft background
    const bgStyle = 'vector_illustration';   // always for offer posts

    const recraftRes = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      { prompt: copy.backgroundPrompt, model: 'recraftv3', style: bgStyle, size, n: 1, response_format: 'url' },
      { headers: { Authorization: `Bearer ${process.env.RECRAFT_API_KEY}` } }
    );
    const bgUrl = recraftRes.data.data[0].url;

    // 3. Download
    const bgBuffer = await axios.get(bgUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data));

    const { width: W, height: H } = await sharp(bgBuffer).metadata();
    const accent = accentColor || '#FFD700';
    const z1H = Math.floor(H * 0.09);
    const z3H = Math.floor(H * 0.10);
    const z2H = H - z1H - z3H;
    const logoW = Math.floor(W * 0.16);

    const logo = await processLogo(logoDoc.images.url, logoW);
    const resizedLogo = logo.buffer;
    const logoH = logo.height;

    const z1Svg = buildOfferZone1(logoDoc.website || '', logoDoc.email || '', W, z1H);
    const z2Svg = buildOfferHeroZone(copy, W, z2H, accent);
    const z3Svg = buildOfferCTAStrip(copy.cta || cta || 'Visit Us Today', W, z3H, accent);

    const isUrgent = detectUrgency(copy.validity);
    const ribbonSvg = isUrgent ? buildUrgencyRibbon(W, H, 'LIMITED TIME') : null;

    // 4. Composite
    const compositeLayers = [
      { input: z1Svg,       top: 0,         left: 0 },
      { input: z2Svg,       top: z1H,       left: 0 },
      { input: z3Svg,       top: z1H + z2H, left: 0 },
      { input: resizedLogo, top: Math.max(0, Math.floor((z1H - logoH) / 2)), left: 20 }
    ];
    if (ribbonSvg) {
      compositeLayers.push({ input: ribbonSvg, top: -10, left: W - Math.floor(W * 0.40) });
    }

    const finalBuffer = await sharp(bgBuffer)
      .composite(compositeLayers)
      .jpeg({ quality: 93 })
      .toBuffer();

    const outputBuffer = req.userPlan?.watermark
      ? await applyWatermark(finalBuffer)
      : finalBuffer;

    // 5. Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'offer_posts', resource_type: 'image' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Upload failed' });
        const post = new OfferPost({
          user: userId, logo: logoId,
          offerHeadline, offerDetails, validity, cta, accentColor: accent, size,
          generatedImageUrl: result.secure_url
        });
        await post.save();

        await incrementUsage(userId);

        return res.status(201).json({ message: 'Offer post created!', post });
      }
    );
    streamifier.createReadStream(outputBuffer).pipe(uploadStream);

  } catch (err) {
    console.error('Offer generation error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to generate offer post' });
  }
};

exports.listOfferPosts    = async (req, res) => {
  try {
    const posts = await OfferPost.find({ user: req.user.id || req.user.userId }).sort({ createdAt: -1 }).lean();
    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch offer posts' });
  }
};

exports.deleteOfferPost   = async (req, res) => {
  try {
    const post = await OfferPost.findOneAndDelete({ _id: req.params.id, user: req.user.id || req.user.userId });
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.generatedImageUrl) {
      const m = post.generatedImageUrl.match(/\/offer_posts\/([^./]+)\./);
      if (m) await cloudinary.uploader.destroy(`offer_posts/${m[1]}`);
    }
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete' });
  }
};

exports.toggleOfferFavorite = async (req, res) => {
  try {
    const post = await OfferPost.findOne({ _id: req.params.id, user: req.user.id || req.user.userId });
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.favorite = !post.favorite;
    await post.save();
    return res.json({ favorite: post.favorite });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

exports.downloadOffer = async (req, res) => {
  try {
    const post = await OfferPost.findById(req.params.id);
    if (!post || !post.generatedImageUrl) return res.status(404).json({ error: 'Image not found' });
    const response = await axios.get(post.generatedImageUrl, { responseType: 'arraybuffer' });
    const ext = path.extname(new URL(post.generatedImageUrl).pathname) || '.jpg';
    res.setHeader('Content-Disposition', `attachment; filename="offer_${post.offerHeadline || 'image'}${ext}"`);
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error("Download offer error:", error);
    res.status(500).json({ error: 'Failed to download image' });
  }
};
