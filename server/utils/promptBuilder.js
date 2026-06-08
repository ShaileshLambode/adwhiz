/**
 * Utility functions for building Recraft V3 prompts and color conversions.
 */

/**
 * Convert a hex color string to an RGB array wrapper matching Recraft API color controls.
 * Supports both "#RRGGBB" and "RRGGBB" formats.
 * @param {string} hex
 * @returns {Object} { rgb: [r, g, b] }
 */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { rgb: [r, g, b] };
}

/**
 * Converts a SHORT text string (1–4 words max) into individual word entries
 * for Recraft V3 text_layout.
 *
 * IMPORTANT RULES FROM RECRAFT V3 API:
 * - text_layout is designed for DISPLAY TEXT only (headlines, short labels)
 * - One entry per WORD — never multi-word strings
 * - Uppercase only — lowercase is not in the supported character set
 * - bbox must be 4 polygon points: [[x1,y1],[x2,y1],[x2,y2],[x1,y2]]
 * - Each word bbox must be large enough (~100px+) to actually render
 * - DO NOT use text_layout for body copy / long sentences (too many words = tiny boxes)
 *
 * @param {string} text - Short text (headline or tagline only, max ~4 words)
 * @param {Object} zone - bbox as { x, y, width, height } (0–1 relative)
 * @returns {Array} Array of Recraft text_layout entries
 */
function buildTextLayoutEntries(text, zone) {
  if (!text || !zone) return [];

  // Uppercase and strip characters not in Recraft's supported set
  const cleaned = text
    .toUpperCase()
    .replace(/[^A-Z0-9!"#$%&'()*+,\-./:;<>?@_{}]/g, ' ')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // SAFETY LIMIT: text_layout only works well for short display text.
  // If more than 6 words, truncate — long sentences belong in body copy (Sharp SVG).
  const displayWords = words.slice(0, 6);

  const wordWidth = zone.width / displayWords.length;

  return displayWords.map((word, i) => {
    const x1 = zone.x + i * wordWidth;
    const x2 = x1 + wordWidth;
    const y1 = zone.y;
    const y2 = zone.y + zone.height;

    return {
      text: word,
      bbox: [
        [x1, y1], [x2, y1],
        [x2, y2], [x1, y2]
      ]
    };
  });
}

/**
 * Build a structured prompt for Recraft V3 festival/promotional image generation.
 *
 * KEY STRATEGY:
 * - Use "digital_illustration/flat_design" style (NOT realistic_image)
 * - Instruct left half = dark overlay for text content
 * - Instruct right half = festive scene elements
 * - Recraft generates the BACKGROUND — all body text is added by Sharp SVG overlay
 *
 * @param {Object} template - The ImageTemplate document
 * @param {Object} logo - The Logo document
 * @returns {string} The constructed prompt string
 */
function buildPrompt(template, logo) {
  const occasionDescriptions = {
    diwali: 'golden diyas, glowing oil lamps, rangoli patterns, sparkles, warm deep purple and gold gradient background',
    holi: 'vibrant color powder explosions in pink, yellow, green, blue, orange — festival of colors celebration',
    bhai_dooj: 'marigold flower garlands, golden diya flames, puja thali with tilak, warm maroon and gold tones',
    eid: 'glowing crescent moon, decorative stars, mosque silhouette, rich green and gold palette',
    independence_day: 'Indian tricolor flag waving, Ashoka chakra, saffron orange, white, and deep green gradients',
    generic_sale: 'bold geometric confetti shapes, celebration ribbons and stars, vivid red and yellow palette'
  };

  const desc = occasionDescriptions[template.occasion] || 'festive celebration decorations';

  return `Flat 2D digital illustration graphic design marketing poster for ${template.name}.
Background elements: ${desc}.
Layout: LEFT 45% of the poster has a solid semi-transparent dark purple or dark maroon panel with space for text. RIGHT 55% shows beautiful festive decorative illustration.
Design style: clean flat graphic design, professional marketing banner, no photographs, no real rooms, no real people, no physical objects in real spaces.
The dark left panel must have clear empty space — do not fill it with decorations.
Rich jewel-tone festival colors, ornate decorative borders, professional marketing aesthetic.`;
}

module.exports = { hexToRgb, buildTextLayoutEntries, buildPrompt };
