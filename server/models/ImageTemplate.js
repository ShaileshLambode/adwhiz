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
      type: [[Number]],
      required: true
      // 4-point polygon: [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
      // coordinates in [0,1] range relative to image dimensions
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
