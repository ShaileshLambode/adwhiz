const esc = (s) => {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
};

/**
 * Splits a string into lines of maximum characters without cutting words.
 */
function wrapText(text, maxChars) {
  if (!text) return [];
  const words = text.split(/\s+/);
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

/**
 * Auto-fit: find the largest fontSize where all lines fit within availableHeight
 * and no single line exceeds availableWidth.
 */
function autoFitText(text, availableW, availableH, maxFontSize, minFontSize = 8, lineHeightMult = 1.45) {
  let fontSize = maxFontSize;
  while (fontSize >= minFontSize) {
    const charWidth    = fontSize * 0.58;
    const maxChars     = Math.floor(availableW / charWidth);
    const wrappedLines = wrapText(text, maxChars);
    const lineGap      = fontSize * lineHeightMult;
    const totalH       = wrappedLines.length * lineGap;
    if (totalH <= availableH) {
      return { fontSize, lines: wrappedLines, lineGap };
    }
    fontSize -= 1;
  }
  const charWidth = minFontSize * 0.58;
  const maxChars  = Math.floor(availableW / charWidth);
  return {
    fontSize: minFontSize,
    lines: wrapText(text, maxChars),
    lineGap: minFontSize * lineHeightMult
  };
}

/**
 * Returns the correct text color for use on zoneBgTint backgrounds.
 * zoneBgTint is always light (per RULE 10), so always returns a dark color.
 * Prefers the festival's footerBg (a rich dark) over plain black.
 */
function getZoneTextColor(palette) {
  const bg  = palette.zoneBgTint || '#FFF8F0';
  const r   = parseInt(bg.slice(1,3), 16) / 255;
  const g   = parseInt(bg.slice(3,5), 16) / 255;
  const b_  = parseInt(bg.slice(5,7), 16) / 255;
  const lum = 0.299 * r + 0.587 * g + 0.114 * b_;

  if (lum > 0.5) {
    // Light background — use festival's dark footer color as text (always readable)
    return palette.footerBg || '#1A1A1A';
  } else {
    // Unexpectedly dark background — use light accent
    return palette.footerTextAccent || '#FFFFFF';
  }
}

/**
 * ZONE 1 — HEADER BAR (Logo left, Tagline center, Contact right)
 */
exports.buildZone1Header = (data, W, H1, palette = {}) => {
  const website = esc(data.website || 'www.aimaven.tech');
  const email = esc(data.email || 'aimaven.surat@gmail.com');
  const tagline = esc(data.tagline || 'DESIGN · CONNECT · INSPIRE');
  const bg = '#FFFFFF';
  const textDark = '#222222';
  const textGray = '#666666';

  // Globe icon replacing 🌐
  const globeIcon = (x, y) => `
    <circle cx="${x}" cy="${y}" r="6.5" fill="none" stroke="${textDark}" stroke-width="1.2"/>
    <line x1="${x-6.5}" y1="${y}" x2="${x+6.5}" y2="${y}" stroke="${textDark}" stroke-width="0.8"/>
    <ellipse cx="${x}" cy="${y}" rx="3" ry="6.5" fill="none" stroke="${textDark}" stroke-width="0.8"/>`;

  // Envelope icon replacing ✉  
  const mailIcon = (x, y) => `
    <rect x="${x-7.5}" y="${y-5}" width="15" height="10" rx="1" fill="none" stroke="${textDark}" stroke-width="1.2"/>
    <polyline points="${x-7.5},${y-5} ${x},${y} ${x+7.5},${y-5}" fill="none" stroke="${textDark}" stroke-width="1"/>`;

  const svg = `<svg width="${W}" height="${H1}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="${W}" height="${H1}" fill="${bg}" />
    
    <!-- Left side space reserved for logo (logo composite done at top-level) -->
    
    <!-- Center tagline -->
    <text x="${W / 2}" y="${H1 * 0.58}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.16)}" font-weight="bold" fill="${textGray}" letter-spacing="2">
      ${tagline}
    </text>
    
    <!-- Right side contact info with SVG path icons -->
    <g>
      ${globeIcon(W - 42, H1 * 0.38)}
      <text x="${W - 55}" y="${H1 * 0.43}" text-anchor="end" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.15)}" font-weight="bold" fill="${textDark}">
        ${website}
      </text>
      ${mailIcon(W - 42, H1 * 0.68)}
      <text x="${W - 55}" y="${H1 * 0.73}" text-anchor="end" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.15)}" font-weight="bold" fill="${textDark}">
        ${email}
      </text>
    </g>
    
    <!-- Bottom Separator -->
    <line x1="0" y1="${H1 - 1}" x2="${W}" y2="${H1 - 1}" stroke="#E5E7EB" stroke-width="1.5" />
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 2 — HERO LEFT (Festival Headline, Subheading, Body Message, Closing Slogan)
 */
exports.buildZone2Left = (data, panelW, panelH, palette = {}) => {
  const headline      = data.headline || '';
  const subheading    = data.subheading || '';
  const bodyMessage   = data.bodyMessage || '';
  const closingSlogan = data.closingSlogan || '';

  const panelBg         = palette.panelBg         || '#1A1A2E';
  const headlineColor   = palette.headlineColor    || '#FFD700';
  const subheadingColor = palette.subheadingColor  || '#FFA500';
  const bodyTextColor   = palette.bodyTextColor    || '#FFFFFF';
  const sloganColor     = palette.sloganColor      || headlineColor;

  const isPortraitOrStory = panelH > 500;

  // VISUAL HIERARCHY: headline is massive, subheading medium, body small
  const rawHeadlineSize = Math.floor(panelH * 0.100);
  const headlineSize    = Math.min(rawHeadlineSize, 54); // absolute cap to prevent wrap issues
  const subheadingSize  = Math.min(Math.floor(panelH * 0.048), isPortraitOrStory ? 22 : 26);
  const sloganSize      = Math.min(Math.floor(panelH * 0.046), isPortraitOrStory ? 20 : 24);

  const leftX = Math.floor(panelW * 0.08);
  const safeTextW = panelW - leftX - Math.floor(panelW * 0.14); // leave 14% for fade

  // Auto-scale body text size based on number of lines to prevent vertical overlap
  const maxBodySize = isPortraitOrStory ? 16 : 18;
  let bodySize = Math.min(Math.floor(panelH * 0.038), maxBodySize);
  let bodyChars = Math.floor(safeTextW / (bodySize * 0.58));
  let bodyLines = wrapText(bodyMessage, bodyChars);
  if (bodyLines.length > 5) {
    bodySize = Math.min(Math.floor(panelH * 0.034), maxBodySize - 2);
    bodyChars = Math.floor(safeTextW / (bodySize * 0.58));
    bodyLines = wrapText(bodyMessage, bodyChars);
  }
  if (bodyLines.length > 7) {
    bodySize = Math.min(Math.floor(panelH * 0.030), maxBodySize - 4);
    bodyChars = Math.floor(safeTextW / (bodySize * 0.58));
    bodyLines = wrapText(bodyMessage, bodyChars);
  }

  let content = '';
  let y = Math.floor(panelH * 0.10) + headlineSize;

  // Headline — wrapped to safe width
  const headlineChars = Math.floor(safeTextW / (headlineSize * 0.62));
  const headlineLines = wrapText(headline, headlineChars);
  headlineLines.forEach((line, i) => {
    content += `<text x="${leftX}" y="${y + i * (headlineSize * 1.05)}"
      text-anchor="start" font-family="Arial, sans-serif"
      font-size="${headlineSize}" font-weight="900"
      fill="${headlineColor}" letter-spacing="1">${esc(line.toUpperCase())}</text>`;
  });
  y += headlineLines.length * headlineSize * 1.05 + Math.floor(panelH * 0.025);

  // Ornamental divider — centered with the text starting from leftX
  const divStartX = leftX;
  const divEndX   = Math.floor(panelW * 0.62);
  const divMidX   = Math.floor((divStartX + divEndX) / 2);
  content += `
    <line x1="${divStartX}" y1="${y}" x2="${divMidX - 9}" y2="${y}"
      stroke="${subheadingColor}" stroke-width="1.5" opacity="0.7"/>
    <polygon points="${divMidX},${y-6} ${divMidX+8},${y} ${divMidX},${y+6} ${divMidX-8},${y}"
      fill="${subheadingColor}" opacity="0.85"/>
    <line x1="${divMidX + 9}" y1="${y}" x2="${divEndX}" y2="${y}"
      stroke="${subheadingColor}" stroke-width="1.5" opacity="0.7"/>`;
  y += Math.floor(panelH * 0.055);

  // Subheading
  if (subheading) {
    const subCharWidth = subheadingSize * 0.60 + 2;  // +2 for letter-spacing
    const subChars     = Math.floor(safeTextW / subCharWidth);
    const subheadingLines = wrapText(subheading, subChars);
    subheadingLines.forEach((line, i) => {
      content += `<text x="${leftX}" y="${y + i * (subheadingSize * 1.15)}"
        text-anchor="start" font-family="Arial, sans-serif"
        font-size="${subheadingSize}" font-weight="700"
        fill="${subheadingColor}" letter-spacing="2">${esc(line.toUpperCase())}</text>`;
    });
    y += subheadingLines.length * subheadingSize * 1.15 + Math.floor(panelH * 0.025);
  }

  // Body copy
  const lineGap = Math.floor(bodySize * 1.45);
  bodyLines.forEach(line => {
    content += `<text x="${leftX}" y="${y}"
      text-anchor="start" font-family="Arial, sans-serif"
      font-size="${bodySize}" fill="${bodyTextColor}" opacity="0.92">${esc(line)}</text>`;
    y += lineGap;
  });

  // Closing slogan — placed dynamically 28px below last body line with bottom boundary safety cap
  if (closingSlogan) {
    const sloganChars   = Math.floor(safeTextW / (sloganSize * 0.60));
    const sloganLines   = wrapText(closingSlogan, sloganChars);
    const sloganLineGap = Math.floor(sloganSize * 1.35);
    const sloganTotalH  = sloganLines.length * sloganLineGap;
    
    // Natural position: 28px below last body line
    const naturalSloganY = y + 28;
    
    // Cap: must not go closer than 12px from panel bottom
    const maxAllowedSloganY = panelH - sloganTotalH - 12;
    
    // Pick natural position but respect the cap
    let sy = Math.min(naturalSloganY, maxAllowedSloganY);
    
    // Safety: never above body text
    if (sy < y + 12) sy = y + 12;

    sloganLines.forEach((line, i) => {
      content += `<text x="${leftX}" y="${sy + i * sloganLineGap}"
        text-anchor="start" font-family="Arial, sans-serif"
        font-size="${sloganSize}" font-style="italic" font-weight="700"
        fill="${sloganColor}">${esc(line)}</text>`;
    });
  }

  // Gradient fade on RIGHT edge — makes the panel blend into the Recraft hero image
  const svg = `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="panelFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="${panelBg}" stop-opacity="1"/>
        <stop offset="93%"  stop-color="${panelBg}" stop-opacity="1"/>
        <stop offset="100%" stop-color="${panelBg}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="${panelW}" height="${panelH}" fill="url(#panelFade)"/>
    ${content}
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 2R — DECORATIVE QUOTE BOX (Overlaid on Recraft background on right half)
 * FIX: Icon is now rendered ABOVE the box border (not overlapping text area),
 * and box background tint now matches the festival palette for a premium look.
 */
exports.buildZone2Right_QuoteBox = (quote, boxW, boxH, palette = {}, occasion = '') => {
  const primaryAccent   = palette.iconCircleColor    || '#FFD700';
  const secondaryAccent = palette.featureBorderColor || '#FF6347';
  const useDarkPanel    = palette.useDarkPanel !== false; // default true

  // Box background: semi-transparent, tinted with the panel color for visual cohesion
  // Use a warm white or very light tint from the panel bg if light mode, else white
  const boxBgColor = useDarkPanel
    ? 'rgba(255,255,255,0.90)'          // On dark hero: bright white box contrasts well
    : `rgba(255,255,255,0.88)`;         // On light background: same

  // Text in box: always dark for legibility (box is white/light)
  const textColor = '#1A1A1A';

  // Icon circle is positioned 22px above the top of the box border
  // so it "floats" above the box — no overlap with text
  const iconR       = 16;
  const iconCy      = iconR + 2;           // icon center y = 18
  const boxStartY   = iconR * 2 + 10;      // box top edge y = 42
  const paddingX    = 18;
  const paddingInner = 16;                 // padding inside box top
  const paddingBot  = 14;

  // SVG height accommodates the icon overhang
  const svgH = boxH + boxStartY;
  
  const availableW = boxW - paddingX * 2;
  const availableH = boxH - 44; // Ensure at least 22px padding at top and bottom

  // Hard cap the text — never allow > 110 chars regardless of GPT output
  const text = (quote || '').substring(0, 110);

  const maxQuoteFontSize = boxH > 400 ? 20 : 24;
  const initialMaxFontSize = Math.min(Math.floor(boxH * 0.080), maxQuoteFontSize);

  const { fontSize, lines, lineGap } = autoFitText(
    text,
    availableW,
    availableH,
    initialMaxFontSize,
    8,
    1.45
  );

  const midX = boxW / 2;
  const textBlockH = (lines.length - 1) * lineGap + fontSize;
  // Centered inside the box area with standard baseline adjustment
  const textStartY = boxStartY + Math.floor(((boxH - 4) - textBlockH) / 2) + Math.floor(fontSize * 0.7);
  let currentY = textStartY;
  let textElements = '';

  // Floating icon — star inside a circle, sitting above the box
  textElements += `
    <circle cx="${midX}" cy="${iconCy}" r="${iconR}"
      stroke="${primaryAccent}" stroke-width="2"
      fill="${primaryAccent}" fill-opacity="0.15"/>
    <text x="${midX}" y="${iconCy + 5}" text-anchor="middle"
      font-family="Arial, sans-serif" font-size="14"
      fill="${primaryAccent}" font-weight="bold">★</text>`;

  lines.forEach(line => {
    textElements += `
    <text x="${midX}" y="${currentY}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${fontSize}" font-style="italic" font-weight="600"
      fill="${textColor}">${esc(line)}</text>`;
    currentY += lineGap;
  });

  return Buffer.from(`<svg width="${boxW}" height="${svgH}" xmlns="http://www.w3.org/2000/svg">
    <!-- Floating icon is ABOVE the box rect, no overlap -->
    <rect x="4" y="${boxStartY}" width="${boxW-8}" height="${svgH - boxStartY - 4}" rx="10"
      fill="${boxBgColor}" stroke="${primaryAccent}" stroke-width="2"/>
    <rect x="9" y="${boxStartY + 5}" width="${boxW-18}" height="${svgH - boxStartY - 14}" rx="7"
      fill="none" stroke="${secondaryAccent}" stroke-width="1" stroke-dasharray="4,3"/>
    ${textElements}
  </svg>`);
};

/**
 * ZONE 3 — VALUES/RITUAL ROW (3 columns with circle icon, title, subtitle)
 * FIX: All text colors now use the festival palette.
 */
exports.buildZone3ValuesRow = (values = [], W, H3, palette = {}) => {
  const zoneBgTint      = palette.zoneBgTint       || '#FFF8F0';
  const iconCircleColor = palette.iconCircleColor   || '#E07000';
  const zoneTextColor   = getZoneTextColor(palette);
  const labelColor      = zoneTextColor;
  const sublabelColor   = zoneTextColor + 'AA';  // same color at ~67% opacity
  const dividerColor    = palette.featureBorderColor ? palette.featureBorderColor + '55' : '#DDDDDD';

  const colW = W / 3;
  const circleR = Math.floor(H3 * 0.12);
  const iconSize = Math.max(Math.floor(H3 * 0.135), 13);

  const labelSize    = Math.max(Math.floor(W * 0.015), 15);
  const sublabelSize = Math.max(Math.floor(W * 0.011), 11);

  let content = '';
  for (let i = 0; i < 3; i++) {
    const item = values[i] || { icon: '★', label: 'VALUE', sublabel: '' };
    const cx = i * colW + colW / 2;

    // Circle with subtle filled tint + solid border
    content += `<circle cx="${cx}" cy="${H3 * 0.30}" r="${circleR}"
      stroke="${iconCircleColor}" stroke-width="2"
      fill="${iconCircleColor}" fill-opacity="0.12"/>`;
    // Icon
    content += `<text x="${cx}" y="${H3 * 0.30 + iconSize * 0.38}"
      text-anchor="middle" font-size="${iconSize}"
      font-family="Arial, sans-serif" fill="${iconCircleColor}">${esc(item.icon || '★')}</text>`;

    // Label — wrapped to column width
    const labelAvailW = colW * 0.82;
    const labelChars  = Math.floor(labelAvailW / (labelSize * 0.65));
    const labelLines  = wrapText(item.label || '', labelChars);
    labelLines.forEach((line, idx) => {
      content += `<text x="${cx}" y="${H3 * 0.59 + idx * labelSize * 1.25}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${labelSize}" font-weight="800"
        fill="${labelColor}" letter-spacing="1">${esc(line.toUpperCase())}</text>`;
    });

    // Sublabel — wrapped to column width
    const subAvailW = colW * 0.78;
    const subChars  = Math.floor(subAvailW / (sublabelSize * 0.6));
    const subLines  = wrapText(item.sublabel || '', subChars);
    subLines.forEach((line, idx) => {
      content += `<text x="${cx}" y="${H3 * 0.83 + idx * sublabelSize * 1.3}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${sublabelSize}" fill="${sublabelColor}">${esc(line)}</text>`;
    });

    // Divider
    if (i < 2) {
      content += `<line x1="${(i+1)*colW}" y1="${H3*0.12}" x2="${(i+1)*colW}" y2="${H3*0.88}"
        stroke="${dividerColor}" stroke-width="1"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H3}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H3}" fill="${zoneBgTint}"/>
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="${iconCircleColor}" stroke-width="3" opacity="0.5"/>
    <line x1="0" y1="${H3}" x2="${W}" y2="${H3}" stroke="${dividerColor}" stroke-width="2"/>
    ${content}
  </svg>`);
};

/**
 * ZONE 4 — MARKETING FEATURES BAR (4-column horizontal features row)
 * FIX: Badge text uses palette colors; icon and text colors are festival-themed.
 */
exports.buildZone4FeaturesBar = (features = [], W, H4, palette = {}) => {
  const zoneBgTint         = palette.zoneBgTint        || '#FFF8F0';
  const featureBorderColor = palette.featureBorderColor || '#E07000';
  const featureTextColor   = getZoneTextColor(palette);
  const colW = W / 4;
  const padX = Math.floor(colW * 0.08);
  const padY = Math.floor(H4 * 0.12);

  const iconBottomY  = Math.floor(H4 * 0.50);
  const badgeBottomY = H4 - padY;
  const textAreaH    = badgeBottomY - iconBottomY - 4;
  const badgeInnerW  = colW - padX * 2 - 10;

  let content = '';
  for (let i = 0; i < 4; i++) {
    const item = features[i] || { icon: '★', text: 'FEATURE' };
    const cx   = i * colW + colW / 2;

    const { fontSize, lines, lineGap } = autoFitText(
      item.text || '',
      badgeInnerW,
      textAreaH,
      Math.max(Math.floor(H4 * 0.14), 11),
      9,
      1.35
    );

    // Badge border — now uses a fill tint too
    content += `<rect x="${i * colW + padX}" y="${padY}"
      width="${colW - padX * 2}" height="${H4 - padY * 2}"
      rx="7" fill="${featureBorderColor}" fill-opacity="0.07"
      stroke="${featureBorderColor}" stroke-width="1.5" opacity="0.70"/>`;

    // Icon
    content += `<text x="${cx}" y="${H4 * 0.42}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${Math.floor(H4 * 0.22)}" fill="${featureBorderColor}">${esc(item.icon || '★')}</text>`;

    // Auto-fitted text lines
    lines.forEach((line, idx) => {
      content += `<text x="${cx}" y="${iconBottomY + (idx + 1) * lineGap}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${fontSize}" font-weight="700"
        fill="${featureTextColor}">${esc(line.toUpperCase())}</text>`;
    });

    if (i < 3) {
      content += `<line x1="${(i+1)*colW}" y1="${H4*0.15}" x2="${(i+1)*colW}" y2="${H4*0.85}"
        stroke="${featureBorderColor}" stroke-width="1" opacity="0.25"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H4}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H4}" fill="${zoneBgTint}"/>
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="${featureBorderColor}" stroke-width="3" opacity="0.4"/>
    ${content}
    <line x1="0" y1="${H4}" x2="${W}" y2="${H4}" stroke="${featureBorderColor}" stroke-width="1" opacity="0.3"/>
  </svg>`);
};

/**
 * ZONE 5 — PRODUCT CATEGORY LABELS ONLY (Product images composited separately using Sharp)
 */
exports.buildZone5ProductLabels = (products = [], W, H5, palette = {}) => {
  const bg         = palette.zoneBgTint        || '#FFF8F0';
  const nameColor  = getZoneTextColor(palette);
  const divColor   = (palette.featureBorderColor || '#888888') + '44';
  const N = Math.max(products.length, 1);
  const colW = W / N;

  let content = '';

  for (let i = 0; i < N; i++) {
    const item = products[i];
    if (!item) continue;
    const x = i * colW + colW / 2;
    const name = (item.name || '').toUpperCase();

    // Name only — image composited separately using Sharp
    content += `<text x="${x}" y="${H5 * 0.88}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${nameColor}">
      ${esc(name)}
    </text>`;

    // Vertical Divider
    if (i < N - 1) {
      const divX = (i + 1) * colW;
      content += `<line x1="${divX}" y1="8" x2="${divX}" y2="${H5 - 8}" stroke="${divColor}" stroke-width="1" />`;
    }
  }

  const svg = `<svg width="${W}" height="${H5}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H5}" fill="${bg}" />
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="${nameColor}" stroke-width="3" opacity="0.35"/>
    ${content}
    <!-- Bottom separator -->
    <line x1="0" y1="${H5 - 1}" x2="${W}" y2="${H5 - 1}" stroke="${divColor}" stroke-width="1" />
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 6 — FOOTER STRIP (4 Columns, dark background, highlight support)
 */
exports.buildZone6FooterStrip = (footerColumns = [], W, H6, palette = {}) => {
  const footerBg     = palette.footerBg        || '#16213E';
  const footerAccent = palette.footerTextAccent || '#FFD700';
  const colW         = W / 4;
  const leftPad      = 16;
  const availTextW   = colW - leftPad - 8;

  // Icon and text layout bounds
  const iconFontSize  = Math.max(Math.floor(H6 * 0.11), 14);
  const iconBottomPad = 6;
  const iconBaselineY = Math.floor(H6 * 0.14) + iconFontSize; // top area only
  const textStartY    = iconBaselineY + iconBottomPad; // text starts below icon
  const bottomPad     = Math.floor(H6 * 0.06); // bottom padding
  const linesAreaH    = H6 - textStartY - bottomPad; // accurate available height for text

  // Find shared font size: smallest that fits all columns
  const isPortraitOrStory = H6 > 220;
  const maxFooterFont     = isPortraitOrStory ? 14 : 16;
  let sharedFontSize      = Math.min(Math.floor(H6 * 0.095), maxFooterFont);
  while (sharedFontSize >= 7) {
    const charW    = sharedFontSize * 0.58;
    const maxChars = Math.floor(availTextW / charW);
    const lineGap  = sharedFontSize * 1.4;
    let fits = true;
    for (const col of footerColumns) {
      const allLines = [...(col.lines || []), col.highlight || ''].filter(Boolean);
      const wrapped  = allLines.flatMap(l => wrapText(l, maxChars));
      if (wrapped.length * lineGap > linesAreaH) { fits = false; break; }
    }
    if (fits) break;
    sharedFontSize -= 1;
  }

  const charW    = sharedFontSize * 0.58;
  const maxChars = Math.floor(availTextW / charW);
  const lineGap  = sharedFontSize * 1.4;

  let content = '';
  for (let i = 0; i < 4; i++) {
    const col   = footerColumns[i] || { icon: '★', lines: [], highlight: '' };
    const colX  = i * colW;
    const iconX = colX + leftPad;
    const textX = colX + leftPad;

    // Icon — small, top-left of each column
    content += `<text x="${iconX}" y="${iconBaselineY}"
      font-family="Arial, sans-serif"
      font-size="${iconFontSize}"
      fill="${footerAccent}" opacity="0.9">${esc(col.icon || '★')}</text>`;

    // textY begins at textStartY + sharedFontSize (first baseline)
    let textY = textStartY + sharedFontSize;

    // Regular lines
    (col.lines || []).forEach(line => {
      wrapText(line, maxChars).forEach(wl => {
        content += `<text x="${textX}" y="${textY}"
          font-family="Arial, sans-serif" font-size="${sharedFontSize}" font-weight="700"
          fill="rgba(255,255,255,0.88)">${esc(wl.toUpperCase())}</text>`;
        textY += lineGap;
      });
    });

    // Highlight
    if (col.highlight) {
      wrapText(col.highlight, maxChars).forEach(wl => {
        content += `<text x="${textX}" y="${textY}"
          font-family="Arial, sans-serif" font-size="${sharedFontSize}" font-weight="900"
          fill="${footerAccent}">${esc(wl.toUpperCase())}</text>`;
        textY += lineGap;
      });
    }

    if (i < 3) {
      content += `<line x1="${(i+1)*colW}" y1="${H6*0.08}" x2="${(i+1)*colW}" y2="${H6*0.92}"
        stroke="rgba(255,255,255,0.15)" stroke-width="1"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H6}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H6}" fill="${footerBg}"/>
    ${content}
  </svg>`);
};
