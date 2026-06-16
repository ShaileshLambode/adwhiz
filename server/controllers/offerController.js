const axios       = require('axios');
const sharp       = require('sharp');
const streamifier = require('streamifier');
const path        = require('path');
const cloudinary  = require('../utils/cloudinary');
const openai      = require('../utils/openai');
const Logo        = require('../models/Logo');
const OfferPost   = require('../models/OfferPost');

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
  "backgroundPrompt": "Recraft AI background for a ${sector} business offer post. Abstract, clean, professional. No text, no people. Max 50 words.",
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
  const esc  = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fSize = Math.floor(H1 * 0.28);
  return Buffer.from(`<svg width="${W}" height="${H1}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H1}" fill="rgba(0,0,0,0.35)"/>
    <text x="${W - 20}" y="${H1 * 0.42}" text-anchor="end"
      font-family="Arial, sans-serif" font-size="${fSize}" fill="rgba(255,255,255,0.85)">${esc(website)}</text>
    <text x="${W - 20}" y="${H1 * 0.75}" text-anchor="end"
      font-family="Arial, sans-serif" font-size="${fSize}" fill="rgba(255,255,255,0.75)">${esc(email)}</text>
  </svg>`);
}

function buildOfferHeroZone(copy, W, H2, accentColor = '#FFD700') {
  const esc  = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const mid  = W / 2;
  const pad  = Math.floor(W * 0.07);

  const hlSize    = Math.floor(H2 * 0.16);
  const subSize   = Math.floor(H2 * 0.07);
  const bodySize  = Math.floor(H2 * 0.055);
  const validSize = Math.floor(H2 * 0.05);

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

  // Gradient overlay for readability
  content += `<defs>
    <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="rgba(0,0,0,0.65)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.80)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H2}" fill="url(#heroGrad)"/>`;

  // Decorative star ornaments
  content += `<text x="${pad}" y="${Math.floor(H2 * 0.22)}"
    font-family="Arial" font-size="${Math.floor(hlSize * 0.5)}" fill="${accentColor}" opacity="0.7">★</text>
  <text x="${W - pad - Math.floor(hlSize * 0.4)}" y="${Math.floor(H2 * 0.22)}"
    font-family="Arial" font-size="${Math.floor(hlSize * 0.5)}" fill="${accentColor}" opacity="0.7">★</text>`;

  // Headline
  content += `<text x="${mid}" y="${Math.floor(H2 * 0.22)}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${hlSize}" font-weight="900"
    fill="${accentColor}">${esc((copy.headline || '').toUpperCase())}</text>`;

  // Sub-headline
  content += `<text x="${mid}" y="${Math.floor(H2 * 0.38)}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${subSize}" font-weight="700" letter-spacing="1"
    fill="#FFFFFF">${esc(copy.subheadline || '')}</text>`;

  // Body lines
  bLines.forEach((line, i) => {
    content += `<text x="${mid}" y="${H2 * 0.52 + i * bodySize * 1.5}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${bodySize}" fill="rgba(255,255,255,0.88)">${esc(line)}</text>`;
  });

  // Validity badge
  const badgeY = Math.floor(H2 * 0.73);
  const badgeW = Math.floor(W * 0.52);
  const badgeX = Math.floor((W - badgeW) / 2);
  content += `<rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${Math.floor(H2 * 0.1)}"
    rx="4" fill="${accentColor}" opacity="0.15"/>
  <rect x="${badgeX}" y="${badgeY}" width="${badgeW}" height="${Math.floor(H2 * 0.1)}"
    rx="4" fill="none" stroke="${accentColor}" stroke-width="1.2" opacity="0.6"/>
  <text x="${mid}" y="${badgeY + Math.floor(H2 * 0.066)}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${validSize}" fill="${accentColor}" font-weight="600">${esc(copy.validity || '')}</text>`;

  return Buffer.from(`<svg width="${W}" height="${H2}" xmlns="http://www.w3.org/2000/svg">
    ${content}
  </svg>`);
}

function buildOfferCTAStrip(ctaText, W, H3, accentColor = '#FFD700') {
  const esc    = s => (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fSize  = Math.floor(H3 * 0.30);
  return Buffer.from(`<svg width="${W}" height="${H3}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H3}" fill="${accentColor}"/>
    <text x="${W/2}" y="${Math.floor(H3 * 0.63)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${fSize}" font-weight="900" letter-spacing="3"
      fill="#1A1A1A">${esc(ctaText.toUpperCase())}</text>
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
    const bgStyleRaw = copy.bgStyle || 'digital_illustration/flat_design';
    const VALID_STYLES = {
      'realistic_image':                    'digital_illustration',
      'digital_illustration':               'digital_illustration',
      'digital_illustration/flat_design':   'digital_illustration',
      'digital_illustration/2d_art_poster': 'digital_illustration/2d_art_poster',
      'digital_illustration/engraving':     'digital_illustration/engraving_color',
      'digital_illustration/engraving_color': 'digital_illustration/engraving_color',
      'digital_illustration/hand_drawn':    'digital_illustration/hand_drawn',
      'minimalist':                         'digital_illustration',
      'vintage_poster':                     'digital_illustration/engraving_color',
      'three_d_render':                     'digital_illustration/handmade_3d',
      'flat_design':                        'digital_illustration',
    };
    const bgStyle = VALID_STYLES[bgStyleRaw] || 'digital_illustration';

    const recraftRes = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      { prompt: copy.backgroundPrompt, model: 'recraftv3', style: bgStyle, size, n: 1, response_format: 'url' },
      { headers: { Authorization: `Bearer ${process.env.RECRAFT_API_KEY}` } }
    );
    const bgUrl = recraftRes.data.data[0].url;

    // 3. Download
    const [bgBuffer, logoBuffer] = await Promise.all([
      axios.get(bgUrl,              { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
      axios.get(logoDoc.images.url, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data))
    ]);

    const { width: W, height: H } = await sharp(bgBuffer).metadata();
    const accent = accentColor || '#FFD700';
    const z1H = Math.floor(H * 0.09);
    const z3H = Math.floor(H * 0.10);
    const z2H = H - z1H - z3H;
    const logoW = Math.floor(W * 0.16);

    const resizedLogo = await sharp(logoBuffer).resize({ width: logoW }).toBuffer();
    const z1Svg = buildOfferZone1(logoDoc.website || '', logoDoc.email || '', W, z1H);
    const z2Svg = buildOfferHeroZone(copy, W, z2H, accent);
    const z3Svg = buildOfferCTAStrip(copy.cta || cta || 'Visit Us Today', W, z3H, accent);

    // 4. Composite
    const finalBuffer = await sharp(bgBuffer)
      .composite([
        { input: z1Svg,       top: 0,         left: 0 },
        { input: z2Svg,       top: z1H,       left: 0 },
        { input: z3Svg,       top: z1H + z2H, left: 0 },
        { input: resizedLogo, top: Math.floor((z1H - Math.floor(logoW * 0.5)) / 2), left: 20 }
      ])
      .jpeg({ quality: 93 })
      .toBuffer();

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
        return res.status(201).json({ message: 'Offer post created!', post });
      }
    );
    streamifier.createReadStream(finalBuffer).pipe(uploadStream);

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
