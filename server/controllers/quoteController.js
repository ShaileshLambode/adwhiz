const axios       = require('axios');
const sharp       = require('sharp');
const streamifier = require('streamifier');
const path        = require('path');
const cloudinary  = require('../utils/cloudinary');
const openai      = require('../utils/openai');
const Logo        = require('../models/Logo');
const QuotePost   = require('../models/QuotePost');
const { processLogo } = require('../utils/logoProcessor');

// ── GPT generates the quote ───────────────────────────────────────────────────
async function generateQuoteText(businessName, sector, theme, tone) {
  const systemPrompt = `You are a creative copywriter AND color-theory expert for ${businessName}, a ${sector} business.
Write short, impactful quotes for social media posts. Always respond with ONLY valid JSON.

Color rules for quotePalette:
RULE 1 — cardBg: A solid, rich color matching the theme/tone mood. NEVER white, NEVER near-white, NEVER a pale neutral. Always a deliberate saturated or deep color (e.g. deep teal, warm terracotta, deep plum, forest green, midnight blue).
RULE 2 — textColor: Must have STRONG contrast against cardBg. If cardBg is dark, use a bright/light color. If cardBg is a mid-tone bright color, use pure white or near-black — whichever contrasts more.
RULE 3 — accentColor: A complementary highlight color for the attribution line and quote marks. Should feel premium, not clash with cardBg.
RULE 4 — footerBg: A darker variant of cardBg for the bottom contact bar — always dark enough for white text.`;

  const userPrompt = `Generate a social media quote post for this business.
Theme: "${theme}"
Tone: "${tone}" (inspirational / witty / warm / bold)

Return this JSON exactly:
{
  "quote": "The quote text. Maximum 100 characters. Punchy, memorable, fits one visual.",
  "attribution": "Short attribution line. E.g. '— ${businessName}'. Max 30 chars.",
  "backgroundPrompt": "Abstract decorative background — soft shapes, gradients, bokeh, organic patterns, or subtle texture. NO text, NO readable elements. This will be DIMMED behind a solid card, so it just needs to feel atmospheric, not be a focal illustration. Max 40 words.",
  "quotePalette": {
    "cardBg": "hex — solid card background, RULE 1",
    "textColor": "hex — quote text color, RULE 2",
    "accentColor": "hex — quote marks and highlights, RULE 3",
    "footerBg": "hex — bottom contact bar, RULE 4"
  }
}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user',   content: userPrompt }
    ],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  });

  return JSON.parse(completion.choices[0].message.content);
}

// ── SVG quote overlay ─────────────────────────────────────────────────────────
function buildQuoteOverlay(quote, attribution, W, H, palette = {}) {
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const cardBg     = palette.cardBg     || '#1A1A2E';
  const textColor  = palette.textColor  || '#FFFFFF';
  const accentColor = palette.accentColor || textColor;

  // Card dimensions: 84% width, vertically centered, with padding
  const cardW = Math.floor(W * 0.84);
  const cardX = Math.floor((W - cardW) / 2);
  const padX  = Math.floor(cardW * 0.10);
  const availableW = cardW - padX * 2;

  const quoteSize  = Math.floor(W * 0.044);
  const attribSize = Math.floor(W * 0.021);
  const lineGap    = quoteSize * 1.5;

  const charW    = quoteSize * 0.60;
  const maxChars = Math.floor(availableW / charW);

  const words = quote.split(' ');
  const lines = [];
  let   cur   = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= maxChars) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);

  // Card height: padding + quote mark + lines + attribution + padding
  const topPad     = Math.floor(quoteSize * 1.4);
  const quoteBlockH = lines.length * lineGap;
  const attribBlockH = attribSize * 2.2;
  const bottomPad  = Math.floor(quoteSize * 0.8);
  const cardH = topPad + quoteBlockH + attribBlockH + bottomPad;

  const cardY = Math.floor((H - cardH) / 2);
  const midX  = W / 2;

  let content = '';

  // Quote mark — large, positioned INSIDE the card, top-left of text block
  content += `<text x="${cardX + padX}" y="${cardY + Math.floor(quoteSize * 1.1)}"
    font-family="Georgia, serif" font-size="${Math.floor(quoteSize * 2.2)}"
    fill="${accentColor}" opacity="0.35">"</text>`;

  // Quote lines — centered within card
  let textY = cardY + topPad;
  lines.forEach(line => {
    content += `<text x="${midX}" y="${textY}"
      text-anchor="middle" font-family="Georgia, serif"
      font-size="${quoteSize}" font-weight="700" font-style="italic"
      fill="${textColor}">${esc(line)}</text>`;
    textY += lineGap;
  });

  // Divider line above attribution
  textY += Math.floor(attribSize * 0.3);
  content += `<line x1="${midX - 30}" y1="${textY}" x2="${midX + 30}" y2="${textY}"
    stroke="${accentColor}" stroke-width="1.5" opacity="0.6"/>`;
  textY += Math.floor(attribSize * 1.6);

  // Attribution
  content += `<text x="${midX}" y="${textY}"
    text-anchor="middle" font-family="Arial, sans-serif"
    font-size="${attribSize}" font-weight="700" letter-spacing="2"
    fill="${accentColor}">${esc(attribution.toUpperCase())}</text>`;

  return Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="14" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
    </defs>
    <rect x="${cardX}" y="${cardY}" width="${cardW}" height="${cardH}"
      rx="18" fill="${cardBg}" opacity="0.94" filter="url(#cardShadow)"/>
    ${content}
  </svg>`);
}

function buildQuoteContactBar(website, email, W, barH, footerBg = '#1A1A2E') {
  const esc = s => (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fontSize = Math.floor(barH * 0.34);

  // Always show something — fallback text if both are empty
  const contact = [website, email].filter(Boolean).join('   ·   ') || 'Follow us for more updates';

  return Buffer.from(`<svg width="${W}" height="${barH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${barH}" fill="${footerBg}"/>
    <text x="${W/2}" y="${Math.floor(barH * 0.66)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${fontSize}" font-weight="500"
      fill="rgba(255,255,255,0.92)">${esc(contact)}</text>
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

    const gptResult = await generateQuoteText(
      logoDoc.name, logoDoc.sector || 'business', theme, tone || 'inspirational'
    );

    const quoteText   = customQuote || gptResult.quote;
    const attribution = gptResult.attribution;
    const bgPrompt     = gptResult.backgroundPrompt;
    const palette      = gptResult.quotePalette || {
      cardBg: '#1A1A2E', textColor: '#FFFFFF', accentColor: '#FFD700', footerBg: '#16213E'
    };
    const bgStyle = 'vector_illustration';

    const recraftRes = await axios.post(
      'https://external.api.recraft.ai/v1/images/generations',
      { prompt: bgPrompt, model: 'recraftv3', style: bgStyle, size, n: 1, response_format: 'url' },
      { headers: { Authorization: `Bearer ${process.env.RECRAFT_API_KEY}` } }
    );
    const bgUrl = recraftRes.data.data[0].url;

    const bgBuffer = await axios.get(bgUrl, { responseType: 'arraybuffer' }).then(r => Buffer.from(r.data));

    const { width: W, height: H } = await sharp(bgBuffer).metadata();
    const barH  = Math.floor(H * 0.07);
    const logoW = Math.floor(W * 0.16);

    const logo = await processLogo(logoDoc.images.url, logoW);
    const resizedLogo = logo.buffer;

    // Dim the AI background slightly so the card pops more, regardless of palette
    const dimmedBg = await sharp(bgBuffer)
      .modulate({ brightness: 0.85, saturation: 0.9 })
      .toBuffer();

    const quoteSvg   = buildQuoteOverlay(quoteText, attribution, W, H - barH, palette);
    const contactBar = buildQuoteContactBar(logoDoc.website || '', logoDoc.email || '', W, barH, palette.footerBg);

    const finalBuffer = await sharp(dimmedBg)
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
