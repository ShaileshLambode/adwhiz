/**
 * Seed script to insert 6 pre-built festival/occasion templates into MongoDB.
 * 
 * Run from the server directory:
 *   node seed/templates.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const ImageTemplate = require("../models/ImageTemplate");

const templates = [
  {
    name: "Happy Holi",
    occasion: "holi",
    aspectRatio: "1024x1024",
    colorPalette: ["#FF6B35", "#F7C948", "#7B2D8E", "#4CAF50", "#E91E63"],
    textSlots: [
      {
        id: "headline",
        label: "Festival Headline",
        defaultText: "Happy Holi!",
        bbox: [[0.02, 0.08], [0.45, 0.08], [0.45, 0.22], [0.02, 0.22]]
      },
      {
        id: "tagline",
        label: "Tagline / Subheading",
        defaultText: "Festival of Colors",
        bbox: [[0.02, 0.23], [0.45, 0.23], [0.45, 0.32], [0.02, 0.32]]
      },
      {
        id: "body",
        label: "Message / Body Copy",
        defaultText: "May this Holi fill your life with vibrant colors of joy, happiness, love and success.",
        bbox: [[0.02, 0.34], [0.45, 0.34], [0.45, 0.55], [0.02, 0.55]]
      },
      {
        id: "footer",
        label: "Footer Slogan",
        defaultText: "Bura Na Mano, Holi Hai!",
        bbox: [[0.05, 0.88], [0.95, 0.88], [0.95, 0.97], [0.05, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "A vibrant and colorful {occasionName} festival marketing poster for a business called \"{businessName}\". The scene should include splashes of colored powder (gulal), festive decorations, Indian cultural elements, and a joyful celebratory atmosphere. Professional marketing layout with clear zones for text placement. High quality, photorealistic style with warm festive lighting."
  },
  {
    name: "Happy Bhai Dooj",
    occasion: "bhai_dooj",
    aspectRatio: "1024x1024",
    colorPalette: ["#8B0000", "#FFD700", "#B8860B", "#FFFACD", "#DC143C"],
    textSlots: [
      {
        id: "headline",
        label: "Festival Headline",
        defaultText: "Happy Bhai Dooj!",
        bbox: [[0.02, 0.08], [0.45, 0.08], [0.45, 0.22], [0.02, 0.22]]
      },
      {
        id: "tagline",
        label: "Tagline / Subheading",
        defaultText: "A Bond of Love That Lasts Forever",
        bbox: [[0.02, 0.23], [0.45, 0.23], [0.45, 0.32], [0.02, 0.32]]
      },
      {
        id: "body",
        label: "Message / Body Copy",
        defaultText: "On this special day, let's celebrate the beautiful bond of love, trust and protection.",
        bbox: [[0.02, 0.34], [0.45, 0.34], [0.45, 0.55], [0.02, 0.55]]
      },
      {
        id: "footer",
        label: "Footer Slogan",
        defaultText: "Celebrate the Bond. Gift Love. Create Memories.",
        bbox: [[0.05, 0.88], [0.95, 0.88], [0.95, 0.97], [0.05, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "A warm and festive {occasionName} celebration marketing poster for \"{businessName}\". Include traditional Indian elements like tilak, diya lamps, marigold flowers, gift boxes, and sweets. Show a sibling bonding theme with warm golden lighting, traditional Indian decor and a professional poster layout with clear text zones."
  },
  {
    name: "Happy Diwali",
    occasion: "diwali",
    aspectRatio: "1024x1024",
    colorPalette: ["#FFD700", "#4B0082", "#FF6347", "#FFA500", "#800020"],
    textSlots: [
      {
        id: "headline",
        label: "Festival Headline",
        defaultText: "Happy Diwali!",
        bbox: [[0.02, 0.08], [0.45, 0.08], [0.45, 0.22], [0.02, 0.22]]
      },
      {
        id: "tagline",
        label: "Tagline / Subheading",
        defaultText: "Festival of Lights",
        bbox: [[0.02, 0.23], [0.45, 0.23], [0.45, 0.32], [0.02, 0.32]]
      },
      {
        id: "body",
        label: "Message / Body Copy",
        defaultText: "May the festival of lights bring brightness and joy to your life. Wishing you a prosperous Diwali!",
        bbox: [[0.02, 0.34], [0.45, 0.34], [0.45, 0.55], [0.02, 0.55]]
      },
      {
        id: "footer",
        label: "Footer Slogan",
        defaultText: "Light up your world with happiness and prosperity.",
        bbox: [[0.05, 0.88], [0.95, 0.88], [0.95, 0.97], [0.05, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "A magnificent {occasionName} festival marketing poster for \"{businessName}\". Feature glowing diyas, fireworks, rangoli patterns, sparklers, and golden lanterns. Rich purple and gold color theme with luxurious festive atmosphere. Professional marketing layout with designated text placement areas."
  },
  {
    name: "Eid Mubarak",
    occasion: "eid",
    aspectRatio: "1024x1024",
    colorPalette: ["#006400", "#FFD700", "#FFFFFF", "#C0C0C0", "#1B5E20"],
    textSlots: [
      {
        id: "headline",
        label: "Festival Headline",
        defaultText: "Eid Mubarak!",
        bbox: [[0.02, 0.08], [0.45, 0.08], [0.45, 0.22], [0.02, 0.22]]
      },
      {
        id: "tagline",
        label: "Tagline / Subheading",
        defaultText: "Blessed Celebrations",
        bbox: [[0.02, 0.23], [0.45, 0.23], [0.45, 0.32], [0.02, 0.32]]
      },
      {
        id: "body",
        label: "Message / Body Copy",
        defaultText: "May this Eid bring peace, happiness and prosperity to you and your family. Eid Mubarak!",
        bbox: [[0.02, 0.34], [0.45, 0.34], [0.45, 0.55], [0.02, 0.55]]
      },
      {
        id: "footer",
        label: "Footer Slogan",
        defaultText: "Spreading joy and blessings this Eid.",
        bbox: [[0.05, 0.88], [0.95, 0.88], [0.95, 0.97], [0.05, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "An elegant {occasionName} celebration marketing poster for \"{businessName}\". Include crescent moon, mosque silhouette, ornate lanterns, and intricate Islamic geometric patterns. Green and gold color theme with a serene and celebratory atmosphere. Professional marketing layout."
  },
  {
    name: "Independence Day",
    occasion: "independence_day",
    aspectRatio: "1024x1024",
    colorPalette: ["#FF9933", "#FFFFFF", "#138808", "#000080", "#FFD700"],
    textSlots: [
      {
        id: "headline",
        label: "Headline",
        defaultText: "Happy Independence Day!",
        bbox: [[0.02, 0.08], [0.55, 0.08], [0.55, 0.22], [0.02, 0.22]]
      },
      {
        id: "tagline",
        label: "Tagline / Subheading",
        defaultText: "Jai Hind — Proud to be Indian",
        bbox: [[0.02, 0.23], [0.55, 0.23], [0.55, 0.32], [0.02, 0.32]]
      },
      {
        id: "body",
        label: "Message / Body Copy",
        defaultText: "Let us celebrate the spirit of freedom and unity. Together we rise, together we shine.",
        bbox: [[0.02, 0.34], [0.50, 0.34], [0.50, 0.55], [0.02, 0.55]]
      },
      {
        id: "footer",
        label: "Footer Slogan",
        defaultText: "Freedom in every stride. Pride in every heart.",
        bbox: [[0.05, 0.88], [0.95, 0.88], [0.95, 0.97], [0.05, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "A patriotic {occasionName} marketing poster for \"{businessName}\". Feature the Indian tricolor flag, Ashoka Chakra, national monuments like India Gate or Red Fort, doves of peace, and patriotic decorations. Saffron, white and green color theme. Bold and inspiring professional layout."
  },
  {
    name: "Mega Sale",
    occasion: "generic_sale",
    aspectRatio: "1024x1024",
    colorPalette: ["#FF4444", "#FFC107", "#212121", "#FFFFFF", "#FF6F00"],
    textSlots: [
      {
        id: "headline",
        label: "Sale Headline",
        defaultText: "MEGA SALE!",
        bbox: [[0.05, 0.05], [0.60, 0.05], [0.60, 0.25], [0.05, 0.25]]
      },
      {
        id: "tagline",
        label: "Offer Details",
        defaultText: "Up to 50% OFF on all products",
        bbox: [[0.05, 0.26], [0.55, 0.26], [0.55, 0.38], [0.05, 0.38]]
      },
      {
        id: "body",
        label: "Promo Message",
        defaultText: "Don't miss out on our biggest sale of the year! Limited time offer on premium products.",
        bbox: [[0.02, 0.40], [0.50, 0.40], [0.50, 0.58], [0.02, 0.58]]
      },
      {
        id: "footer",
        label: "Call to Action",
        defaultText: "Shop Now — Limited Time Only!",
        bbox: [[0.10, 0.88], [0.90, 0.88], [0.90, 0.97], [0.10, 0.97]]
      },
      {
        id: "website",
        label: "Website URL",
        defaultText: "www.yourbusiness.com",
        bbox: [[0.55, 0.02], [0.98, 0.02], [0.98, 0.05], [0.55, 0.05]]
      },
      {
        id: "email",
        label: "Email Address",
        defaultText: "contact@yourbusiness.com",
        bbox: [[0.55, 0.055], [0.98, 0.055], [0.98, 0.085], [0.55, 0.085]]
      }
    ],
    promptTemplate: "A high-energy commercial sale promotion poster for \"{businessName}\". Feature bold sale graphics, shopping bags, price tags, discount badges, confetti, and exciting retail atmosphere. Red and gold color scheme with urgency-driven professional marketing layout."
  }
];


async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing templates
    const deleted = await ImageTemplate.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing templates`);

    // Insert new templates
    const inserted = await ImageTemplate.insertMany(templates);
    console.log(`Successfully seeded ${inserted.length} templates:`);
    inserted.forEach(t => console.log(`  ✓ ${t.name} (${t.occasion})`));

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
