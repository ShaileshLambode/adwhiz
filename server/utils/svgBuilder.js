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
  const headline      = esc(data.headline || '');
  const subheading    = esc(data.subheading || '');
  const bodyMessage   = data.bodyMessage || '';
  const closingSlogan = esc(data.closingSlogan || '');

  const panelBg         = palette.panelBg         || '#1A1A2E';
  const headlineColor   = palette.headlineColor    || '#FFD700';
  const subheadingColor = palette.subheadingColor  || '#FFA500';
  const bodyTextColor   = palette.bodyTextColor    || '#FFFFFF';
  const sloganColor     = palette.sloganColor      || headlineColor;

  // VISUAL HIERARCHY: headline is massive, subheading medium, body small
  const headlineSize    = Math.floor(panelH * 0.115); // ~47px — dominant
  const subheadingSize  = Math.floor(panelH * 0.048); // ~20px — clearly smaller
  const sloganSize      = Math.floor(panelH * 0.046); // ~19px — slightly larger than body

  // Wrap at 36 characters to prevent excessive lines
  const bodyLines = wrapText(bodyMessage, 36);

  // Auto-scale body text size based on number of lines to prevent vertical overlap
  let bodySize = Math.floor(panelH * 0.038); // ~16px
  if (bodyLines.length > 5) {
    bodySize = Math.floor(panelH * 0.034); // ~14px
  }
  if (bodyLines.length > 7) {
    bodySize = Math.floor(panelH * 0.030); // ~12px
  }

  let content = '';
  let y = Math.floor(panelH * 0.10) + headlineSize;

  // Headline — wrap at 15 characters to keep standard greetings on a single line
  const headlineLines = wrapText(headline, 15);
  headlineLines.forEach((line, i) => {
    content += `<text x="${panelW / 2}" y="${y + i * (headlineSize * 1.05)}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${headlineSize}" font-weight="900"
      fill="${headlineColor}" letter-spacing="1">${line.toUpperCase()}</text>`;
  });
  y += headlineLines.length * headlineSize * 1.05 + Math.floor(panelH * 0.025);

  // Ornamental divider — diamond center with lines on each side
  const dMid = panelW / 2;
  content += `
    <line x1="${dMid - 55}" y1="${y}" x2="${dMid - 8}" y2="${y}"
      stroke="${subheadingColor}" stroke-width="1.2" opacity="0.65"/>
    <polygon points="${dMid},${y-5} ${dMid+7},${y} ${dMid},${y+5} ${dMid-7},${y}"
      fill="${subheadingColor}" opacity="0.75"/>
    <line x1="${dMid + 8}" y1="${y}" x2="${dMid + 55}" y2="${y}"
      stroke="${subheadingColor}" stroke-width="1.2" opacity="0.65"/>`;
  y += Math.floor(panelH * 0.055);

  // Subheading
  if (subheading) {
    content += `<text x="${panelW / 2}" y="${y}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${subheadingSize}" font-weight="700"
      fill="${subheadingColor}" letter-spacing="2">${subheading.toUpperCase()}</text>`;
    y += Math.floor(panelH * 0.075);
  }

  // Body copy
  const lineGap = Math.floor(bodySize * 1.45);
  bodyLines.forEach(line => {
    content += `<text x="${panelW / 2}" y="${y}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${bodySize}" fill="${bodyTextColor}" opacity="0.92">${esc(line)}</text>`;
    y += lineGap;
  });

  // Closing slogan — pinned near bottom, pushed down if body copy runs very long, but capped to avoid screen cutoff
  if (closingSlogan) {
    const sloganLines = wrapText(closingSlogan, 26);
    const sloganLineGap = Math.floor(sloganSize * 1.35);
    
    let sy = Math.floor(panelH * 0.83);
    const minSloganY = y + Math.floor(panelH * 0.03);
    if (sy < minSloganY) {
      sy = minSloganY;
    }
    
    const maxSloganY = panelH - Math.floor(sloganSize * 1.1) - (sloganLines.length - 1) * sloganLineGap;
    if (sy > maxSloganY) {
      sy = maxSloganY;
    }

    sloganLines.forEach(line => {
      content += `<text x="${panelW / 2}" y="${sy}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${sloganSize}" font-style="italic" font-weight="700"
        fill="${sloganColor}">${esc(line)}</text>`;
      sy += sloganLineGap;
    });
  }

  // Gradient fade on RIGHT edge — makes the panel blend into the Recraft hero image
  const svg = `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="panelFade" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%"   stop-color="${panelBg}" stop-opacity="1"/>
        <stop offset="78%"  stop-color="${panelBg}" stop-opacity="1"/>
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
 */
exports.buildZone2Right_QuoteBox = (quote, boxW, boxH, palette = {}, occasion = '') => {
  const text = esc(quote || '');
  const primaryAccent = palette.iconCircleColor || '#FFD700'; 
  const secondaryAccent = palette.featureBorderColor || '#FF6347';

  // Determine background and borders
  const boxBg = 'rgba(255, 255, 255, 0.88)';
  const borderColor = primaryAccent;
  const quoteLines = wrapText(text, 22);

  // Select top icon
  let topIcon = '🪔';
  if (occasion === 'holi') topIcon = '🌸';
  else if (occasion === 'bhai_dooj') topIcon = '❤️';
  else if (occasion === 'eid') topIcon = '🌙';
  else if (occasion === 'independence_day') topIcon = '🇮🇳';
  else if (occasion === 'generic_sale') topIcon = '🎁';

  let textElements = '';
  let currentY = 55;
  const fontSize = 11;
  const lineGap = 16;

  // Icon
  textElements += `<text x="${boxW / 2}" y="35" text-anchor="middle" font-size="16">${topIcon}</text>`;

  // Lines
  quoteLines.forEach(line => {
    textElements += `<text x="${boxW / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-style="italic" font-weight="bold" fill="#333333">
      ${line}
    </text>`;
    currentY += lineGap;
  });

  const svg = `<svg width="${boxW}" height="${boxH}" xmlns="http://www.w3.org/2000/svg">
    <!-- Outer boundary double border -->
    <rect x="5" y="5" width="${boxW - 10}" height="${boxH - 10}" rx="10" fill="${boxBg}" stroke="${borderColor}" stroke-width="2" />
    <rect x="10" y="10" width="${boxW - 20}" height="${boxH - 20}" rx="7" fill="none" stroke="${secondaryAccent}" stroke-width="1" stroke-dasharray="4,3" />
    
    <!-- Contents -->
    ${textElements}
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 3 — VALUES/RITUAL ROW (3 columns with circle icon, title, subtitle)
 */
exports.buildZone3ValuesRow = (values = [], W, H3, palette = {}) => {
  const zoneBgTint      = palette.zoneBgTint      || '#FAFAFA';
  const iconCircleColor = palette.iconCircleColor  || '#888888';
  const colW = W / 3;
  const circleR = Math.floor(H3 * 0.24);
  const iconSize = Math.floor(circleR * 1.1);

  let content = '';
  for (let i = 0; i < 3; i++) {
    const item = values[i] || { icon: '★', label: 'VALUE', sublabel: '' };
    const cx = i * colW + colW / 2;

    // Circle with subtle filled tint + solid border
    content += `<circle cx="${cx}" cy="${H3 * 0.36}" r="${circleR}"
      stroke="${iconCircleColor}" stroke-width="2"
      fill="${iconCircleColor}" fill-opacity="0.10"/>`;
    // Icon
    content += `<text x="${cx}" y="${H3 * 0.36 + iconSize * 0.38}"
      text-anchor="middle" font-size="${iconSize}"
      font-family="Arial, sans-serif" fill="${iconCircleColor}">${esc(item.icon || '★')}</text>`;
    // Label
    content += `<text x="${cx}" y="${H3 * 0.70}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${Math.floor(H3 * 0.12)}" font-weight="800"
      fill="#1A1A1A" letter-spacing="1">${esc(item.label || '').toUpperCase()}</text>`;
    // Sublabel
    content += `<text x="${cx}" y="${H3 * 0.87}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${Math.floor(H3 * 0.085)}" fill="#777777">${esc(item.sublabel || '')}</text>`;
    // Divider
    if (i < 2) {
      content += `<line x1="${(i+1)*colW}" y1="${H3*0.12}" x2="${(i+1)*colW}" y2="${H3*0.88}"
        stroke="#DDDDDD" stroke-width="1"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H3}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H3}" fill="${zoneBgTint}"/>
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="#E0E0E0" stroke-width="1.5"/>
    <line x1="0" y1="${H3}" x2="${W}" y2="${H3}" stroke="#E0E0E0" stroke-width="1.5"/>
    ${content}
  </svg>`);
};

/**
 * ZONE 4 — MARKETING FEATURES BAR (4-column horizontal features row)
 */
exports.buildZone4FeaturesBar = (features = [], W, H4, palette = {}) => {
  const zoneBgTint         = palette.zoneBgTint         || '#FAFAFA';
  const featureBorderColor = palette.featureBorderColor  || '#AAAAAA';
  const colW = W / 4;
  const padX = Math.floor(colW * 0.08);
  const padY = Math.floor(H4 * 0.12);

  let content = '';
  for (let i = 0; i < 4; i++) {
    const item = features[i] || { icon: '★', text: 'FEATURE' };
    const cx = i * colW + colW / 2;

    // Rounded pill badge border around the whole column cell
    content += `<rect x="${i * colW + padX}" y="${padY}"
      width="${colW - padX * 2}" height="${H4 - padY * 2}"
      rx="7" fill="none"
      stroke="${featureBorderColor}" stroke-width="1.3" opacity="0.55"/>`;
    // Icon
    content += `<text x="${cx}" y="${H4 * 0.42}"
      text-anchor="middle" font-family="Arial, sans-serif"
      font-size="${Math.floor(H4 * 0.22)}" fill="${featureBorderColor}">${esc(item.icon || '★')}</text>`;
    // Text
    const lines = wrapText(item.text || '', 20);
    lines.forEach((line, idx) => {
      content += `<text x="${cx}" y="${H4 * 0.64 + idx * Math.floor(H4 * 0.13)}"
        text-anchor="middle" font-family="Arial, sans-serif"
        font-size="${Math.floor(H4 * 0.095)}" font-weight="700"
        fill="#333333">${esc(line).toUpperCase()}</text>`;
    });
    // Vertical separator
    if (i < 3) {
      content += `<line x1="${(i+1)*colW}" y1="${H4*0.15}" x2="${(i+1)*colW}" y2="${H4*0.85}"
        stroke="#E0E0E0" stroke-width="1"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H4}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H4}" fill="${zoneBgTint}"/>
    ${content}
    <line x1="0" y1="${H4}" x2="${W}" y2="${H4}" stroke="#E0E0E0" stroke-width="1.5"/>
  </svg>`);
};

/**
 * ZONE 5 — PRODUCT CATEGORY ICONS (Up to 7 products with icon and name)
 */
exports.buildZone5ProductIcons = (products = [], W, H5, palette = {}) => {
  const bg = palette.zoneBgTint || '#FFFFFF';
  const N = Math.max(products.length, 1);
  const colW = W / N;

  let content = '';

  for (let i = 0; i < N; i++) {
    const item = products[i];
    if (!item) continue;
    const x = i * colW + colW / 2;

    const icon = esc(item.icon || '🎒');
    const name = esc(item.name || '');

    // Icon
    content += `<text x="${x}" y="${H5 * 0.44}" text-anchor="middle" font-size="20">${icon}</text>`;
    
    // Name
    content += `<text x="${x}" y="${H5 * 0.78}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#333333">
      ${name.toUpperCase()}
    </text>`;

    // Vertical Divider
    if (i < N - 1) {
      const divX = (i + 1) * colW;
      content += `<line x1="${divX}" y1="12" x2="${divX}" y2="${H5 - 12}" stroke="#E5E7EB" stroke-width="1" />`;
    }
  }

  const svg = `<svg width="${W}" height="${H5}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H5}" fill="${bg}" />
    ${content}
    <!-- Bottom separator -->
    <line x1="0" y1="${H5}" x2="${W}" y2="${H5}" stroke="#E5E7EB" stroke-width="1" />
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 6 — FOOTER STRIP (4 Columns, dark background, highlight support)
 */
exports.buildZone6FooterStrip = (footerColumns = [], W, H6, palette = {}) => {
  const footerBg     = palette.footerBg        || '#16213E';
  const footerAccent = palette.footerTextAccent || '#FFD700';
  const colW = W / 4;

  let content = '';
  for (let i = 0; i < 4; i++) {
    const col = footerColumns[i] || { icon: '★', lines: [], highlight: '' };
    const iconX   = i * colW + 20;
    const textX   = i * colW + 44;
    const fontSize = Math.floor(H6 * 0.09);
    const lineGap  = Math.floor(fontSize * 1.45);

    // Column icon
    content += `<text x="${iconX}" y="${H6 * 0.42}"
      font-family="Arial, sans-serif"
      font-size="${Math.floor(H6 * 0.13)}"
      fill="${footerAccent}" opacity="0.9">${esc(col.icon || '★')}</text>`;

    // Text lines
    let textY = H6 * 0.25;
    (col.lines || []).forEach(line => {
      content += `<text x="${textX}" y="${textY}"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700"
        fill="rgba(255,255,255,0.88)">${esc(line).toUpperCase()}</text>`;
      textY += lineGap;
    });

    // Highlight line
    if (col.highlight) {
      content += `<text x="${textX}" y="${textY + 3}"
        font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="900"
        fill="${footerAccent}">${esc(col.highlight).toUpperCase()}</text>`;
    }

    // Column divider
    if (i < 3) {
      content += `<line x1="${(i+1)*colW}" y1="${H6*0.1}" x2="${(i+1)*colW}" y2="${H6*0.9}"
        stroke="rgba(255,255,255,0.12)" stroke-width="1"/>`;
    }
  }

  return Buffer.from(`<svg width="${W}" height="${H6}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H6}" fill="${footerBg}"/>
    ${content}
  </svg>`);
};
