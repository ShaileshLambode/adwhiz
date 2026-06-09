const esc = (s) => {
  if (typeof s !== 'string') return '';
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;');
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
exports.buildZone1Header = (data, W, H1, colors = []) => {
  const website = esc(data.website || 'www.aimaven.tech');
  const email = esc(data.email || 'aimaven.surat@gmail.com');
  const tagline = esc(data.tagline || 'DESIGN · CONNECT · INSPIRE');
  const bg = '#FFFFFF';
  const textDark = '#222222';
  const textGray = '#666666';

  const svg = `<svg width="${W}" height="${H1}" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="${W}" height="${H1}" fill="${bg}" />
    
    <!-- Left side space reserved for logo (logo composite done at top-level) -->
    
    <!-- Center tagline -->
    <text x="${W / 2}" y="${H1 * 0.58}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.16)}" font-weight="bold" fill="${textGray}" letter-spacing="2">
      ${tagline}
    </text>
    
    <!-- Right side contact info -->
    <g transform="translate(${W - 30}, 0)">
      <text x="0" y="${H1 * 0.42}" text-anchor="end" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.15)}" font-weight="bold" fill="${textDark}">
        🌐 ${website}
      </text>
      <text x="0" y="${H1 * 0.72}" text-anchor="end" font-family="Arial, sans-serif" font-size="${Math.floor(H1 * 0.15)}" font-weight="bold" fill="${textDark}">
        ✉ ${email}
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
exports.buildZone2Left = (data, panelW, panelH, colors = [], occasion = '') => {
  const headline = esc(data.headline || '');
  const subheading = esc(data.subheading || '');
  const bodyMessage = data.bodyMessage || '';
  const closingSlogan = esc(data.closingSlogan || '');

  // Theme colors
  const primaryAccent = colors[0] || '#FFD700'; // Gold/Yellow
  const secondaryAccent = colors[2] || '#FF6347'; // Tomato Red/Coral
  const textWhite = '#FFFFFF';

  // Determine Background Fill based on occasion
  let bgFill = 'rgba(22, 11, 33, 0.76)'; // Default semi-transparent dark purple
  if (occasion === 'bhai_dooj') {
    bgFill = '#FAF6F0'; // Solid warm cream
  } else if (occasion === 'generic_sale') {
    bgFill = 'rgba(33, 33, 33, 0.85)'; // Solid dark gray
  }

  // Determine main text color
  const isLightBg = (occasion === 'bhai_dooj');
  const mainTextColor = isLightBg ? '#332211' : textWhite;
  const subtextColor = isLightBg ? '#554433' : 'rgba(255,255,255,0.9)';

  // Wrap body message into lines
  const bodyLines = wrapText(bodyMessage, 32);

  // Layout calculations
  const padTop = Math.floor(panelH * 0.10);
  const headlineSize = Math.floor(panelH * 0.11);
  const subheadingSize = Math.floor(panelH * 0.052);
  const bodySize = Math.floor(panelH * 0.046);
  const sloganSize = Math.floor(panelH * 0.055);

  let textElements = '';
  let currentY = padTop + headlineSize;

  // Headline
  textElements += `<text x="${panelW / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${headlineSize}" font-weight="900" fill="${primaryAccent}" letter-spacing="1">
    ${headline.toUpperCase()}
  </text>`;
  currentY += Math.floor(panelH * 0.04);

  // Decorative Divider
  const ornament = isLightBg ? '❖' : '✦ ❖ ✦';
  textElements += `<text x="${panelW / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="${secondaryAccent}">
    ${ornament}
  </text>`;
  currentY += Math.floor(panelH * 0.07);

  // Subheading
  if (subheading) {
    textElements += `<text x="${panelW / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${subheadingSize}" font-weight="bold" fill="${secondaryAccent}" letter-spacing="1.5">
      ${subheading.toUpperCase()}
    </text>`;
    currentY += Math.floor(panelH * 0.09);
  }

  // Body Lines
  const lineGap = Math.floor(bodySize * 1.5);
  bodyLines.forEach(line => {
    textElements += `<text x="${panelW / 2}" y="${currentY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${bodySize}" fill="${subtextColor}">
      ${esc(line)}
    </text>`;
    currentY += lineGap;
  });

  // Closing Slogan (near bottom)
  if (closingSlogan) {
    const sloganLines = wrapText(closingSlogan, 28);
    const numSloganLines = sloganLines.length;
    const sloganLineGap = Math.floor(sloganSize * 1.3);
    let startSloganY = Math.floor(panelH * 0.84) - Math.floor((numSloganLines - 1) * sloganLineGap / 2);
    sloganLines.forEach((line) => {
      textElements += `<text x="${panelW / 2}" y="${startSloganY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${sloganSize}" font-style="italic" font-weight="bold" fill="${primaryAccent}">
        ${esc(line)}
      </text>`;
      startSloganY += sloganLineGap;
    });
  }

  const svg = `<svg width="${panelW}" height="${panelH}" xmlns="http://www.w3.org/2000/svg">
    <!-- Panel Background -->
    <rect width="${panelW}" height="${panelH}" fill="${bgFill}" />
    ${textElements}
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 2R — DECORATIVE QUOTE BOX (Overlaid on Recraft background on right half)
 */
exports.buildZone2Right_QuoteBox = (quote, boxW, boxH, colors = [], occasion = '') => {
  const text = esc(quote || '');
  const primaryAccent = colors[0] || '#FFD700'; // Gold/Yellow
  const secondaryAccent = colors[2] || '#FF6347'; // Tomato/Red

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
exports.buildZone3ValuesRow = (values = [], W, H3, colors = []) => {
  const primaryAccent = colors[0] || '#FFD700';
  const secondaryAccent = colors[2] || '#FF6347';
  const bg = '#FFFFFF';
  const colW = W / 3;

  let content = '';

  for (let i = 0; i < 3; i++) {
    const item = values[i] || { icon: '✨', label: 'VALUE', sublabel: 'desc' };
    const x = i * colW + colW / 2;

    const icon = esc(item.icon || '✨');
    const label = esc(item.label || '');
    const sublabel = esc(item.sublabel || '');

    // Circle border
    content += `<circle cx="${x}" cy="${H3 * 0.35}" r="22" stroke="${primaryAccent}" fill="none" stroke-width="1.8" />`;
    // Icon
    content += `<text x="${x}" y="${H3 * 0.35 + 6}" text-anchor="middle" font-size="17">${icon}</text>`;
    // Label
    content += `<text x="${x}" y="${H3 * 0.68}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#222222" letter-spacing="1">
      ${label.toUpperCase()}
    </text>`;
    // Sublabel
    content += `<text x="${x}" y="${H3 * 0.85}" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" fill="#666666">
      ${sublabel}
    </text>`;

    // Vertical Divider
    if (i < 2) {
      const divX = (i + 1) * colW;
      content += `<line x1="${divX}" y1="12" x2="${divX}" y2="${H3 - 12}" stroke="#E5E7EB" stroke-width="1" />`;
    }
  }

  const svg = `<svg width="${W}" height="${H3}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H3}" fill="${bg}" />
    <!-- Top separator -->
    <line x1="0" y1="0" x2="${W}" y2="0" stroke="#E5E7EB" stroke-width="1" />
    ${content}
    <!-- Bottom separator -->
    <line x1="0" y1="${H3}" x2="${W}" y2="${H3}" stroke="#E5E7EB" stroke-width="1" />
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 4 — MARKETING FEATURES BAR (4-column horizontal features row)
 */
exports.buildZone4FeaturesBar = (features = [], W, H4, colors = []) => {
  const bg = '#FDFDFD';
  const borderColor = colors[2] || '#FF6347';
  const textDark = '#333333';
  const colW = W / 4;

  let content = '';

  for (let i = 0; i < 4; i++) {
    const item = features[i] || { icon: '🎁', text: 'FEATURE' };
    const x = i * colW + colW / 2;

    const icon = esc(item.icon);
    const textLines = wrapText(item.text, 22);

    // Render Icon
    content += `<text x="${x}" y="${H4 * 0.38}" text-anchor="middle" font-size="15">${icon}</text>`;

    // Render Text Lines
    let textY = H4 * 0.63;
    textLines.forEach((line, idx) => {
      content += `<text x="${x}" y="${textY + idx * 11}" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="${textDark}">
        ${line.toUpperCase()}
      </text>`;
    });

    // Vertical Divider
    if (i < 3) {
      const divX = (i + 1) * colW;
      content += `<line x1="${divX}" y1="10" x2="${divX}" y2="${H4 - 10}" stroke="#E5E7EB" stroke-width="1" />`;
    }
  }

  const svg = `<svg width="${W}" height="${H4}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H4}" fill="${bg}" />
    ${content}
    <!-- Bottom separator -->
    <line x1="0" y1="${H4}" x2="${W}" y2="${H4}" stroke="#E5E7EB" stroke-width="1" />
  </svg>`;

  return Buffer.from(svg);
};

/**
 * ZONE 5 — PRODUCT CATEGORY ICONS (Up to 7 products with icon and name)
 */
exports.buildZone5ProductIcons = (products = [], W, H5) => {
  const bg = '#FFFFFF';
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
exports.buildZone6FooterStrip = (footerColumns = [], W, H6, colors = []) => {
  // Use the secondary dark color or fallback to burgundy/purple
  const footerBg = colors[1] || colors[4] || '#1a0f26';
  const primaryAccent = colors[0] || '#FFD700'; // Gold/Yellow highlight
  const colW = W / 4;

  let content = '';

  for (let i = 0; i < 4; i++) {
    const col = footerColumns[i] || { icon: '✨', lines: [], highlight: '' };
    const x = i * colW + colW / 2;

    const icon = esc(col.icon);
    const highlight = esc(col.highlight);

    // Left relative position for column icon
    const iconX = i * colW + 18;
    const textStartX = i * colW + 42;

    // Draw Column Icon
    content += `<text x="${iconX}" y="${H6 * 0.45}" font-size="14">${icon}</text>`;

    // Draw Text lines
    let textY = H6 * 0.28;
    const fontSize = Math.floor(H6 * 0.08);
    const lineSpacing = Math.floor(fontSize * 1.4);

    if (col.lines && Array.isArray(col.lines)) {
      col.lines.forEach((line) => {
        content += `<text x="${textStartX}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="rgba(255,255,255,0.85)">
          ${esc(line).toUpperCase()}
        </text>`;
        textY += lineSpacing;
      });
    }

    // Draw Highlight (if exists)
    if (highlight) {
      content += `<text x="${textStartX}" y="${textY + 2}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="extrabold" fill="${primaryAccent}">
        ${highlight.toUpperCase()}
      </text>`;
    }

    // Divider
    if (i < 3) {
      const divX = (i + 1) * colW;
      content += `<line x1="${divX}" y1="12" x2="${divX}" y2="${H6 - 12}" stroke="rgba(255, 255, 255, 0.15)" stroke-width="1" />`;
    }
  }

  const svg = `<svg width="${W}" height="${H6}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H6}" fill="${footerBg}" />
    ${content}
  </svg>`;

  return Buffer.from(svg);
};
