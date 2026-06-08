/**
 * Seed script — 6 festival templates for AdWhiz Promo Creator.
 *
 * BBOX STRATEGY:
 * - headline slot: left panel, large bbox, 2-3 words only → goes to Recraft text_layout
 * - ALL other slots (tagline, body, footer, website, email): handled by Sharp SVG overlay
 *   Their bboxes are kept for reference but are not sent to Recraft text_layout
 *
 * Run: node seed/templates.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ImageTemplate = require('../models/ImageTemplate');

const templates = [
  {
    name: 'Happy Holi',
    occasion: 'holi',
    aspectRatio: '1024x1024',
    colorPalette: ['#FF6B35', '#F7C948', '#7B2D8E', '#4CAF50', '#E91E63'],
    textSlots: [
      {
        id: 'headline',
        label: 'Festival Headline',
        defaultText: 'Happy Holi!',
        // Large bbox — 2 words split across left panel top area
        bbox: { x: 0.05, y: 0.14, width: 0.40, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Tagline / Subheading',
        defaultText: 'Festival of Colors',
        bbox: { x: 0.05, y: 0.31, width: 0.42, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Message / Body Copy',
        defaultText: 'May this Holi fill your life with vibrant colors of joy, happiness, love and success. Wishing you a safe and joyful Holi!',
        bbox: { x: 0.05, y: 0.40, width: 0.42, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Footer Slogan',
        defaultText: 'Bura Na Mano, Holi Hai!',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  },

  {
    name: 'Happy Bhai Dooj',
    occasion: 'bhai_dooj',
    aspectRatio: '1024x1024',
    colorPalette: ['#8B0000', '#FFD700', '#B8860B', '#FFFACD', '#DC143C'],
    textSlots: [
      {
        id: 'headline',
        label: 'Festival Headline',
        defaultText: 'Happy Bhai Dooj!',
        bbox: { x: 0.05, y: 0.14, width: 0.40, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Tagline / Subheading',
        defaultText: 'A Bond of Love That Lasts Forever',
        bbox: { x: 0.05, y: 0.31, width: 0.42, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Message / Body Copy',
        defaultText: 'On this special day, let us celebrate the beautiful bond of love, trust and protection. Wishing you both happiness, good health and endless joy!',
        bbox: { x: 0.05, y: 0.40, width: 0.42, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Footer Slogan',
        defaultText: 'Celebrate the Bond. Gift Love. Create Memories.',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  },

  {
    name: 'Happy Diwali',
    occasion: 'diwali',
    aspectRatio: '1024x1024',
    colorPalette: ['#FFD700', '#4B0082', '#FF6347', '#FFA500', '#800020'],
    textSlots: [
      {
        id: 'headline',
        label: 'Festival Headline',
        defaultText: 'Happy Diwali!',
        bbox: { x: 0.05, y: 0.14, width: 0.40, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Tagline / Subheading',
        defaultText: 'Festival of Lights',
        bbox: { x: 0.05, y: 0.31, width: 0.42, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Message / Body Copy',
        defaultText: 'May the festival of lights bring brightness and joy to your life. Wishing you and your family a prosperous and happy Diwali!',
        bbox: { x: 0.05, y: 0.40, width: 0.42, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Footer Slogan',
        defaultText: 'Light up your world with happiness and prosperity.',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  },

  {
    name: 'Eid Mubarak',
    occasion: 'eid',
    aspectRatio: '1024x1024',
    colorPalette: ['#006400', '#FFD700', '#FFFFFF', '#C0C0C0', '#1B5E20'],
    textSlots: [
      {
        id: 'headline',
        label: 'Festival Headline',
        defaultText: 'Eid Mubarak!',
        bbox: { x: 0.05, y: 0.14, width: 0.40, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Tagline / Subheading',
        defaultText: 'Blessed Celebrations',
        bbox: { x: 0.05, y: 0.31, width: 0.42, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Message / Body Copy',
        defaultText: 'May this Eid bring peace, happiness and prosperity to you and your family. Wishing you all the blessings of this joyful occasion!',
        bbox: { x: 0.05, y: 0.40, width: 0.42, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Footer Slogan',
        defaultText: 'Spreading joy and blessings this Eid.',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  },

  {
    name: 'Independence Day',
    occasion: 'independence_day',
    aspectRatio: '1024x1024',
    colorPalette: ['#FF9933', '#FFFFFF', '#138808', '#000080', '#FFD700'],
    textSlots: [
      {
        id: 'headline',
        label: 'Headline',
        defaultText: 'Independence Day!',
        bbox: { x: 0.05, y: 0.14, width: 0.44, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Tagline / Subheading',
        defaultText: 'Jai Hind — Proud to be Indian',
        bbox: { x: 0.05, y: 0.31, width: 0.44, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Message / Body Copy',
        defaultText: 'Let us celebrate the spirit of freedom and unity. Together we rise, together we shine. Happy Independence Day to every proud Indian!',
        bbox: { x: 0.05, y: 0.40, width: 0.44, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Footer Slogan',
        defaultText: 'Freedom in every stride. Pride in every heart.',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  },

  {
    name: 'Mega Sale',
    occasion: 'generic_sale',
    aspectRatio: '1024x1024',
    colorPalette: ['#FF4444', '#FFC107', '#212121', '#FFFFFF', '#FF6F00'],
    textSlots: [
      {
        id: 'headline',
        label: 'Sale Headline',
        defaultText: 'MEGA SALE!',
        bbox: { x: 0.05, y: 0.14, width: 0.44, height: 0.14 }
      },
      {
        id: 'tagline',
        label: 'Offer Details',
        defaultText: 'Up to 50% OFF on all products',
        bbox: { x: 0.05, y: 0.31, width: 0.44, height: 0.07 }
      },
      {
        id: 'body',
        label: 'Promo Message',
        defaultText: 'Do not miss out on our biggest sale of the year! Limited time offer on premium products. Grab the best deals before they are gone!',
        bbox: { x: 0.05, y: 0.40, width: 0.44, height: 0.22 }
      },
      {
        id: 'footer',
        label: 'Call to Action',
        defaultText: 'Shop Now — Limited Time Only!',
        bbox: { x: 0.05, y: 0.86, width: 0.90, height: 0.06 }
      },
      {
        id: 'website',
        label: 'Website URL',
        defaultText: 'www.yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      },
      {
        id: 'email',
        label: 'Email Address',
        defaultText: 'contact@yourbusiness.com',
        bbox: { x: 0.0, y: 0.0, width: 0.0, height: 0.0 }
      }
    ],
    promptTemplate: 'Flat graphic design marketing poster background for {occasionName}.'
  }
];


async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    const deleted = await ImageTemplate.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing templates`);
    const inserted = await ImageTemplate.insertMany(templates);
    console.log(`Seeded ${inserted.length} templates:`);
    inserted.forEach(t => console.log(`  ✓ ${t.name} (${t.occasion})`));
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
