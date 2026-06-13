const sharp = require('sharp');
const {
  buildZone1Header,
  buildZone2Left,
  buildZone2Right_QuoteBox,
  buildZone3ValuesRow,
  buildZone4FeaturesBar,
  buildZone5ProductLabels,
  buildZone6FooterStrip,
  buildFullscreenOverlay,
  buildCenteredCard,
  buildSplitBoldLeft,
  buildStoryTextBlock,
  buildStoryValuesCompact,
  buildFooterTwoCol,
} = require('./svgBuilder');

// ── LAYOUT 1: Infographic (current layout, extracted into a function) ─────────
async function renderInfographic({ W, H, zones, palette, overrides, logoDoc,
  heroSceneResizedBuffer, resizedLogoBuffer, logoH }) {

  const panelW_left  = Math.floor(W * 0.46);
  const panelW_right = W - panelW_left;
  const quoteBoxW    = Math.floor(panelW_right * 0.45);
  const quoteBoxH    = Math.floor(zones.z2 * 0.78);
  const quoteBoxX    = panelW_left + Math.floor(panelW_right * 0.50);
  const quoteBoxY    = zones.z1 + Math.floor(zones.z2 * 0.08);

  const z1Svg  = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, zones.z1, palette);
  const z2LSvg = buildZone2Left(overrides.heroContent, panelW_left, zones.z2, palette);
  const z2RSvg = buildZone2Right_QuoteBox(overrides.heroContent.rightBoxQuote, quoteBoxW, quoteBoxH, palette);
  const z3Svg  = buildZone3ValuesRow(overrides.valuesRow, W, zones.z3, palette);
  const z4Svg  = buildZone4FeaturesBar(overrides.featuresBar, W, zones.z4, palette);
  const z5Svg  = buildZone5ProductLabels(overrides.productCategories, W, zones.z5, palette);
  const z6Svg  = buildZone6FooterStrip(overrides.footerColumns, W, zones.z6, palette);

  let currentY = 0;
  const composites = [
    { input: z1Svg,               top: currentY, left: 0 }, // z1
  ];
  currentY += zones.z1;
  composites.push(
    { input: heroSceneResizedBuffer, top: currentY, left: panelW_left },
    { input: z2LSvg,              top: currentY, left: 0 },
    { input: z2RSvg,              top: quoteBoxY, left: quoteBoxX },
  );
  currentY += zones.z2;
  composites.push({ input: z3Svg,  top: currentY, left: 0 }); currentY += zones.z3;
  composites.push({ input: z4Svg,  top: currentY, left: 0 }); currentY += zones.z4;
  const z5Y = currentY;
  composites.push({ input: z5Svg,  top: z5Y, left: 0 });
  currentY += zones.z5;
  composites.push({ input: z6Svg,  top: currentY, left: 0 });

  // Logo
  const logoTop = Math.floor((zones.z1 - logoH) / 2);
  composites.push({ input: resizedLogoBuffer, top: logoTop, left: 30 });

  return composites;
}

// ── LAYOUT 2: Fullscreen Hero ─────────────────────────────────────────────────
async function renderFullscreenHero({ W, H, zones, palette, overrides, logoDoc,
  heroSceneResizedBuffer, resizedLogoBuffer, logoH }) {

  // Hero covers ENTIRE image (resize to W×H)
  const fullHeroBuffer = await sharp(heroSceneResizedBuffer)
    .resize({ width: W, height: H, fit: 'cover', position: 'center' })
    .toBuffer();

  // Gradient overlay SVG: bottom 45% of image
  const overlayH = Math.floor(H * 0.45);
  const overlaySvg = buildFullscreenOverlay(overrides.heroContent, W, overlayH, palette);
  const overlayY   = H - overlayH;

  const z1Svg = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, zones.z1, palette);

  const logoTop = Math.floor((zones.z1 - logoH) / 2);

  return [
    { input: fullHeroBuffer,    top: 0, left: 0 },
    { input: z1Svg,             top: 0, left: 0 },
    { input: overlaySvg,        top: overlayY, left: 0 },
    { input: resizedLogoBuffer, top: logoTop, left: 30 },
  ];
}

// ── LAYOUT 3: Centered Card ───────────────────────────────────────────────────
async function renderCenteredCard({ W, H, zones, palette, overrides, logoDoc,
  resizedLogoBuffer, logoH }) {
  // No AI image — pure SVG/typography
  // The card builder creates one large SVG covering the full inner area

  const z1Svg        = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, zones.z1, palette);
  const cardBodyH    = H - zones.z1 - zones.z6;
  const cardBodySvg  = buildCenteredCard(overrides, W, cardBodyH, palette);
  const z6Svg        = buildZone6FooterStrip(overrides.footerColumns, W, zones.z6, palette);

  const logoTop = Math.floor((zones.z1 - logoH) / 2);

  return [
    { input: z1Svg,           top: 0,                     left: 0 },
    { input: cardBodySvg,     top: zones.z1,              left: 0 },
    { input: z6Svg,           top: H - zones.z6,          left: 0 },
    { input: resizedLogoBuffer, top: logoTop,             left: 30 },
  ];
}

// ── LAYOUT 4: Split Bold ──────────────────────────────────────────────────────
async function renderSplitBold({ W, H, zones, palette, overrides, logoDoc,
  heroSceneResizedBuffer, resizedLogoBuffer, logoH }) {

  const halfW = Math.floor(W / 2);

  // Right half: AI illustration resized to fill halfW × (H - z1 - z3 - z4 - z6)
  const heroH   = H - zones.z1 - zones.z3 - zones.z4 - zones.z6;
  const halfHeroBuffer = await sharp(heroSceneResizedBuffer)
    .resize({ width: halfW, height: heroH, fit: 'cover', position: 'center' })
    .toBuffer();

  const z1Svg         = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, zones.z1, palette);
  const leftPanelSvg  = buildSplitBoldLeft(overrides.heroContent, halfW, heroH, palette);
  const z3Svg         = buildZone3ValuesRow(overrides.valuesRow, W, zones.z3, palette);
  const z4Svg         = buildZone4FeaturesBar(overrides.featuresBar, W, zones.z4, palette);
  const z6Svg         = buildZone6FooterStrip(overrides.footerColumns, W, zones.z6, palette);

  const heroY = zones.z1;
  const z3Y   = heroY + heroH;
  const z4Y   = z3Y + zones.z3;
  const z6Y   = z4Y + zones.z4;

  const logoTop = Math.floor((zones.z1 - logoH) / 2);

  return [
    { input: z1Svg,           top: 0,     left: 0 },
    { input: leftPanelSvg,    top: heroY, left: 0 },
    { input: halfHeroBuffer,  top: heroY, left: halfW },
    { input: z3Svg,           top: z3Y,   left: 0 },
    { input: z4Svg,           top: z4Y,   left: 0 },
    { input: z6Svg,           top: z6Y,   left: 0 },
    { input: resizedLogoBuffer, top: logoTop, left: 30 },
  ];
}

// ── LAYOUT 5: Story Banner ────────────────────────────────────────────────────
async function renderStoryBanner({ W, H, zones, palette, overrides, logoDoc,
  heroSceneResizedBuffer, resizedLogoBuffer, logoH }) {

  const headerH   = Math.floor(H * 0.08);  // short header
  const imageH    = Math.floor(H * 0.50);  // AI image top half
  const textH     = Math.floor(H * 0.22);  // headline + body
  const valuesH   = Math.floor(H * 0.09);  // compact values
  const footerH   = H - headerH - imageH - textH - valuesH;

  // Full width hero image
  const storyHeroBuffer = await sharp(heroSceneResizedBuffer)
    .resize({ width: W, height: imageH, fit: 'cover', position: 'center' })
    .toBuffer();

  const z1Svg      = buildZone1Header({ website: logoDoc.website || '', email: logoDoc.email || '' }, W, headerH, palette);
  const textSvg    = buildStoryTextBlock(overrides.heroContent, W, textH, palette);
  const valuesSvg  = buildStoryValuesCompact(overrides.valuesRow, W, valuesH, palette);
  const footerSvg  = buildFooterTwoCol(overrides.footerColumns, W, footerH, palette);

  const imageY  = headerH;
  const textY   = imageY + imageH;
  const valuesY = textY + textH;
  const footerY = valuesY + valuesH;

  const logoTop = Math.floor((headerH - logoH) / 2);

  return [
    { input: z1Svg,           top: 0,       left: 0 },
    { input: storyHeroBuffer, top: imageY,  left: 0 },
    { input: textSvg,         top: textY,   left: 0 },
    { input: valuesSvg,       top: valuesY, left: 0 },
    { input: footerSvg,       top: footerY, left: 0 },
    { input: resizedLogoBuffer, top: logoTop, left: 30 },
  ];
}

module.exports = {
  renderInfographic,
  renderFullscreenHero,
  renderCenteredCard,
  renderSplitBold,
  renderStoryBanner,
};
