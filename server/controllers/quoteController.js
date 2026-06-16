const axios       = require('axios');
const sharp       = require('sharp');
const streamifier = require('streamifier');
const path        = require('path');
const cloudinary  = require('../utils/cloudinary');
const openai      = require('../utils/openai');
const Logo        = require('../models/Logo');
const QuotePost   = require('../models/QuotePost');

// ── GPT generates the quote ───────────────────────────────────────────────────
async function generateQuoteText(businessName, sector, theme, tone) {
  const systemPrompt = `You are a creative copywriter for ${businessName}, a ${sector} business. 
Write short, impactful quotes for social media posts. Always respond with ONLY valid JSON.`;

  const userPrompt = `Generate a social media quote post for this business.
Theme: "${theme}"
Tone: "${tone}" (inspirational / witty / warm / bold)

Return this JSON exactly:
{
  "quote": "The quote text. Maximum 120 characters. Punchy, memorable, fits one visual.",
  "attribution": "Short attribution line. E.g. '— ${businessName}' or 'By ${businessName}'. Max 30 chars.",
  "backgroundPrompt": "Recraft AI image prompt for an abstract/textural background that matches this quote's mood. No text, no people, no logos. Flat 2D illustration or atmospheric texture. Max 60 words.",
  "suggestedStyle": "digital_illustration/flat_design"
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 400,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

// ── SVG quote overlay ─────────────────────────────────────────────────────────
function buildQuoteOverlay(quote, attribution, W, H, accentColor = '#FFFFFF') {
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  // Wrap quote text at ~28 chars per line
  const words    = quote.split(' ');
  const lines    = [];
  let   cur      = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 28) { cur = (cur + ' ' + w).trim(); }
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);

  const quoteSize = Math.floor(W * 0.062);   // ~63px at 1024
  const attribSize = Math.floor(W * 0.026);   // ~27px
  const lineGap    = quoteSize * 1.4;
  const totalH     = lines.length * lineGap + attribSize * 2.5;

  const startY = Math.floor((H - totalH) / 2);  // vertically centered
  const midX   = W / 2;

  let content = '';

  // Large opening quote mark
  content += `<text x="${midX}" y="${startY - 10}" text-anchor="middle"
    font-family="Georgia, serif" font-size="${Math.floor(quoteSize * 2)}"
    fill="${accentColor}" opacity="0.25">"</text>`;

  // Quote lines
  lines.forEach((line, i) => {
    content += `<text x="${midX}" y="${startY + (i + 1) * lineGap}"
      text-anchor="middle" font-family="Georgia, serif"
      font-size="${quoteSize}" font-weight="700" font-style="italic"
      fill="${accentColor}">${esc(line)}</text>`;
  });

  // Attribution
  const attribY = startY + (lines.length + 1) * lineGap + attribSize;
  content += `<text x="${midX}" y="${attribY}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${attribSize}" font-weight="600" letter-spacing="2"
    fill="${accentColor}" opacity="0.85">${esc(attribution.toUpperCase())}</text>`;

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
        <stop offset="0%"   stop-color="transparent"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.45)"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#vignette)"/>
    ${content}
  </svg>`);
}

// ── Contact bar (bottom) ──────────────────────────────────────────────────────
function buildQuoteContactBar(website, email, W, barH) {
  const esc   = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fontSize = Math.floor(barH * 0.32);
  const contact  = [website, email].filter(Boolean).join('  ·  ');

  return Buffer.from(`<svg width="${W}" height="${barH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${barH}" fill="rgba(0,0,0,0.55)"/>
    <text x="${W/2}" y="${Math.floor(barH * 0.65)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${fontSize}" fill="rgba(255,255,255,0.85)">${esc(contact)}</text>
  </svg>`);
}

// ── Main generate handler ─────────────────────────────────────────────────────
exports.generateQuotePost = async (req, res) => {
  try {
    const { logoId, theme, tone, customQuote, size = '1024x1024' } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!logoId || !theme) {
      return res.status(400).json({ error: 'logoId and theme are required' });
    }

    const logoDoc = await Logo.findById(logoId);
    if (!logoDoc || !logoDoc.images?.url) {
      return res.status(404).json({ error: 'Logo not found' });
    }

    // 1. GPT generates quote text + background prompt
    const gptResult = await generateQuoteText(
      logoDoc.name, logoDoc.sector || 'business', theme, tone || 'inspirational'
    );

    const quoteText  = customQuote || gptResult.quote;
    const attribution = gptResult.attribution;
    const bgPrompt   = gptResult.backgroundPrompt;
    const bgStyleRaw = gptResult.suggestedStyle || 'digital_illustration/flat_design';
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

    // 2. Recraft generates the background
    const recraftRes = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      {
        prompt: bgPrompt,
        model:  'recraftv3',
        style:  bgStyle,
        size,
        n: 1,
        response_format: 'url'
      },
      { headers: { Authorization: `Bearer ${process.env.RECRAFT_API_KEY}` } }
    );
    const bgUrl = recraftRes.data.data[0].url;

    // 3. Download base image and logo
    const [bgBuffer, logoBuffer] = await Promise.all([
      axios.get(bgUrl,                { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data)),
      axios.get(logoDoc.images.url,   { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data))
    ]);

    const { width: W, height: H } = await sharp(bgBuffer).metadata();
    const barH    = Math.floor(H * 0.065);
    const logoW   = Math.floor(W * 0.16);

    const resizedLogo = await sharp(logoBuffer).resize({ width: logoW }).toBuffer();
    const quoteSvg    = buildQuoteOverlay(quoteText, attribution, W, H - barH, '#FFFFFF');
    const contactBar  = buildQuoteContactBar(logoDoc.website || '', logoDoc.email || '', W, barH);

    // 4. Composite: background → vignette+quote overlay → contact bar → logo
    const finalBuffer = await sharp(bgBuffer)
      .composite([
        { input: quoteSvg,    top: 0,       left: 0 },
        { input: contactBar,  top: H - barH, left: 0 },
        { input: resizedLogo, top: 20,       left: 20 }
      ])
      .jpeg({ quality: 93 })
      .toBuffer();

    // 5. Upload to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'quote_posts', resource_type: 'image' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });

        const post = new QuotePost({
          user: userId,
          logo: logoId,
          theme,
          tone: tone || 'inspirational',
          quoteText,
          attribution,
          size,
          generatedImageUrl: result.secure_url
        });
        await post.save();

        return res.status(201).json({ message: 'Quote post created!', post });
      }
    );
    streamifier.createReadStream(finalBuffer).pipe(uploadStream);

  } catch (err) {
    console.error('Quote generation error:', err?.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to generate quote post' });
  }
};

// List, delete, favorite, download
exports.listQuotePosts = async (req, res) => {
  try {
    const posts = await QuotePost.find({ user: req.user.id || req.user.userId })
      .sort({ createdAt: -1 }).lean();
    return res.json({ posts });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch quote posts' });
  }
};

exports.deleteQuotePost = async (req, res) => {
  try {
    const post = await QuotePost.findOne({ _id: req.params.id, user: req.user.id || req.user.userId });
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.generatedImageUrl) {
      const match = post.generatedImageUrl.match(/\/quote_posts\/([^./]+)\./);
      if (match) await cloudinary.uploader.destroy(`quote_posts/${match[1]}`);
    }
    await QuotePost.deleteOne({ _id: req.params.id });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete' });
  }
};

exports.toggleQuoteFavorite = async (req, res) => {
  try {
    const post = await QuotePost.findOne({ _id: req.params.id, user: req.user.id || req.user.userId });
    if (!post) return res.status(404).json({ error: 'Not found' });
    post.favorite = !post.favorite;
    await post.save();
    return res.json({ favorite: post.favorite });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

exports.downloadQuote = async (req, res) => {
  try {
    const post = await QuotePost.findById(req.params.id);
    if (!post || !post.generatedImageUrl) return res.status(404).json({ error: 'Image not found' });
    const response = await axios.get(post.generatedImageUrl, { responseType: 'arraybuffer' });
    const ext = path.extname(new URL(post.generatedImageUrl).pathname) || '.jpg';
    res.setHeader('Content-Disposition', `attachment; filename="quote_${post.theme || 'image'}${ext}"`);
    res.setHeader('Content-Type', response.headers['content-type']);
    res.send(Buffer.from(response.data, 'binary'));
  } catch (error) {
    console.error("Download quote error:", error);
    res.status(500).json({ error: 'Failed to download image' });
  }
};
