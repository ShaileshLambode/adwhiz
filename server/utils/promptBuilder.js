/**
 * Utility functions for building Recraft V3 prompts and color conversions.
 */

/**
 * Convert a hex color string to an RGB array [r, g, b].
 * Supports both "#RRGGBB" and "RRGGBB" formats.
 * @param {string} hex 
 * @returns {number[]} [r, g, b]
 */
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

/**
 * Build a structured prompt for Recraft V3 festival/promotional image generation.
 * 
 * @param {Object} template - The ImageTemplate document
 * @param {Array} textInputs - Array of {id, value} text slot entries from the user
 * @param {Object} logo - The Logo document (with .name field for business name)
 * @returns {string} The constructed prompt string
 */
function buildPrompt(template, textInputs, logo) {
  let prompt = template.promptTemplate;

  // Replace template placeholders
  const replacements = {
    "{occasion}": template.occasion.replace(/_/g, " "),
    "{occasionName}": template.name,
    "{businessName}": logo.name || "the business",
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    prompt = prompt.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
  }

  // Append text content context to help Recraft understand the layout
  const textContext = textInputs
    .filter(slot => slot.value && slot.value.trim())
    .map(slot => `"${slot.value}"`)
    .join(", ");

  if (textContext) {
    prompt += ` The image should prominently feature the following text elements: ${textContext}.`;
  }

  return prompt;
}

module.exports = { hexToRgb, buildPrompt };
