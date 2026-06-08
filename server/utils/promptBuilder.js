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
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { rgb: [r, g, b] };
}

/**
 * Converts a slot's text string into individual word entries for Recraft text_layout.
 * One entry per word. Uppercase only. 4-point bbox split evenly across the slot's zone.
 * @param {string} text - The full text string (e.g. "Happy Diwali!")
 * @param {Object} zone - The zone bbox as { x, y, width, height } (0-1 relative)
 * @returns {Array} Array of text_layout entries
 */
function buildTextLayoutEntries(text, zone) {
  if (!text || !zone) return [];

  // 1. Uppercase and strip unsupported characters
  const cleaned = text
    .toUpperCase()
    .replace(/[^A-Z0-9!"#$%&'()*+,\-./:;<>?@_{}]/g, ' ');

  // 2. Split into words
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  // 3. Divide the zone width equally among words
  const wordWidth = zone.width / words.length;

  return words.map((word, i) => {
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
 * Instructs Recraft to generate a flat digital banner instead of a real-world photograph.
 * 
 * @param {Object} template - The ImageTemplate document
 * @param {Object} logo - The Logo document (with .name field for business name)
 * @returns {string} The constructed prompt string
 */
function buildPrompt(template, logo) {
  const occasionDescriptions = {
    diwali: 'golden diyas, glowing lamps, rangoli patterns, fireworks, warm orange and purple gradients',
    holi: 'colorful powder explosions in pink, yellow, green, blue — festival of colors',
    bhai_dooj: 'marigold flowers, diya flames, tilka plate, warm golden tones, siblings celebration',
    eid: 'crescent moon, stars, mosque silhouette, soft green and gold palette',
    independence_day: 'Indian flag tricolor, Ashoka chakra, saffron white green palette',
    generic_sale: 'bold geometric shapes, confetti, celebration ribbons, vibrant colors'
  };

  const desc = occasionDescriptions[template.occasion] || 'festive celebration decorations';

  return `Flat graphic design marketing poster background for ${template.name} of "${logo.name || 'our business'}". 
${desc}. 
Bold festival typography layout with clear text zones. 
Clean professional marketing banner design. 
Left half reserved for text content on a semi-transparent dark overlay panel. 
Right half shows festive decorative elements and imagery. 
Do NOT show a physical poster in a room. Do NOT show hands or people holding signs.
Style: professional digital marketing banner, vibrant colors, high contrast text areas.`;
}

module.exports = { hexToRgb, buildTextLayoutEntries, buildPrompt };
