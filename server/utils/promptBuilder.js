const heroScenePrompts = {
  diwali: `Festive Diwali celebration scene. Beautiful golden lit diyas and oil lamps arranged on a decorative rangoli. Rich purple and gold gradient background. Sparkles and warm amber glow. Flat 2D digital illustration style. No text, no people, no banners. Vertical composition filling the full frame. Jewel-tone colors.`,
  holi: `Joyful Holi festival scene. Colorful powder explosions in vibrant pink, yellow, green, blue, orange filling the air. Traditional color bowls and pichkari (water gun). Marigold flowers and festive bunting. Flat 2D digital illustration style. No text, no people. Vertical composition, vivid saturated colors.`,
  bhai_dooj: `Warm Bhai Dooj celebration scene. Marigold flower garlands, golden diyas, puja thali with tilak items. Decorative background with traditional Indian motifs. Warm maroon, gold and cream tones. Flat 2D digital illustration style. No text, no people, no hands. Vertical composition.`,
  eid: `Eid Mubarak celebration scene. Glowing crescent moon and decorative stars in night sky. Ornate mosque silhouette. Decorative lanterns and arabesque patterns. Rich emerald green and gold palette. Flat 2D digital illustration style. No text, no people.`,
  independence_day: `Indian Independence Day scene. Tricolor flag flowing in breeze. Ashoka chakra detailed pattern. Saffron orange, white, deep green color palette. Marigold flowers, patriotic decorations. Flat 2D digital illustration style. No text.`,
  generic_sale: `Celebration sale scene. Bold colorful confetti and ribbons falling. Geometric abstract shapes in red, yellow, orange. Gift boxes and shopping bags as decorative elements. Vibrant energetic composition. Flat 2D digital illustration style. No text.`
};

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
 * Build a structured prompt for Recraft V3 festival/promotional hero background scene.
 * @param {Object} template - The ImageTemplate document
 * @returns {string} The constructed prompt string
 */
function buildPrompt(template) {
  if (template.recraftScenePrompt) {
    return template.recraftScenePrompt;
  }
  return heroScenePrompts[template.occasion] || `Festive illustration for ${template.name}. Flat 2D digital illustration. No text, no people.`;
}

// Retained for backward compatibility/imports (but unused in the new pipeline)
function buildTextLayoutEntries() {
  return [];
}

module.exports = { hexToRgb, buildTextLayoutEntries, buildPrompt };

