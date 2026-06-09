const mongoose = require("mongoose");

const imageTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },           // "Happy Holi"
  occasion: { type: String, required: true },        // "holi"
  aspectRatio: { type: String, default: '1024x1024' },
  colorPalette: [String],                            // hex codes for Recraft scene

  // Zone 2 — Hero content (left panel text)
  heroContent: {
    headline: String,        // "Happy Holi!"
    subheading: String,      // "Festival of Colors"
    bodyMessage: String,     // "May this Holi fill your life..."
    closingSlogan: String,   // "Bura Na Mano, Holi Hai!"
    rightBoxQuote: String,   // "Let the colors of Holi spread love..."
  },

  // Zone 3 — Values/ritual row (3 items)
  valuesRow: [{
    icon: String,            // Unicode emoji or SVG path: "🎨" "❤️" "∞"
    label: String,           // "ENJOY" "LOVE" "BOND"
    sublabel: String,        // "every moment" "that never ends" "that grows stronger"
  }],

  // Zone 4 — Marketing features (4 items, mostly fixed per brand)
  featuresBar: [{
    icon: String,            // "🎁" "🛡" "❤" "🇮🇳"
    text: String,            // "THOUGHTFUL GIFTS THAT BRING SMILES."
  }],

  // Zone 5 — Product categories (user's product list)
  productCategories: [{
    icon: String,            // "🎒" "👜" "💼"
    name: String,            // "LAPTOP BAG"
  }],

  // Zone 6 — Footer columns (4 items)
  footerColumns: [{
    icon: String,            // emoji or color indicator
    lines: [String],         // array of text lines per column
    highlight: String,       // optional highlighted phrase in last line
  }],

  // Recraft prompt config for hero scene
  recraftScenePrompt: String, // base description for the festive scene

  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("ImageTemplate", imageTemplateSchema);

