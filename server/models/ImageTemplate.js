const mongoose = require("mongoose");

const imageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  occasion: {
    type: String,
    required: true
    // holi | bhai_dooj | diwali | eid | independence_day | generic_sale
  },
  aspectRatio: {
    type: String,
    default: "1024x1024"
  },
  colorPalette: {
    type: [String],
    default: []
    // hex codes for Recraft color controls
  },
  textSlots: [{
    id: {
      type: String,
      required: true
      // headline | tagline | body | footer | contact
    },
    label: {
      type: String,
      required: true
    },
    defaultText: {
      type: String,
      default: ""
    },
    bbox: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      width: { type: Number, required: true },
      height: { type: Number, required: true }
    }
  }],
  promptTemplate: {
    type: String,
    required: true
    // template string with placeholders: {occasion}, {businessName}, {sector}, etc.
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model("ImageTemplate", imageTemplateSchema);
