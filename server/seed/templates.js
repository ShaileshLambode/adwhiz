/**
 * Seed script — 6 festival templates for AdWhiz Promo Creator (Multi-Zone Layout Redesign).
 *
 * Run: node server/seed/templates.js
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
    heroContent: {
      headline: 'Happy Holi!',
      subheading: 'Festival of Colors',
      bodyMessage: 'May this Holi fill your life with vibrant colors of joy, happiness, prosperity and success. Wishing you a safe, color-filled and joyful Holi!',
      closingSlogan: 'Bura na mano, Holi hai! Celebrate with love.',
      rightBoxQuote: 'Let the vibrant colors of Holi spread love, harmony and endless joy in your hearts. Have a splash of happiness!',
    },
    valuesRow: [
      { icon: '🎨', label: 'ENJOY', sublabel: 'every color splash' },
      { icon: '❤️', label: 'SPREAD', sublabel: 'love and harmony' },
      { icon: '✨', label: 'CELEBRATE', sublabel: 'togetherness' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '🎨',
        lines: ['MAY HOLI BRING', 'COLORS OF JOY', 'TO YOUR LIFE.'],
        highlight: 'HAPPY HOLI! 🎨'
      },
      {
        icon: '🎁',
        lines: ['CELEBRATE THE', 'COLORS OF LOVE.', 'GIFT MEMORIES.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LET YOUR LIFE', 'SHINE AS VIBRANT', 'AS HOLI POWDERS.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Joyful Holi festival scene with vibrant color powder explosions, color bowls, and marigold flower decorations. Flat 2D digital illustration. No text, no people.'
  },

  {
    name: 'Happy Bhai Dooj',
    occasion: 'bhai_dooj',
    aspectRatio: '1024x1024',
    colorPalette: ['#8B0000', '#FFD700', '#B8860B', '#FFFACD', '#DC143C'],
    heroContent: {
      headline: 'Happy Bhai Dooj!',
      subheading: 'A Bond of Love',
      bodyMessage: 'On this special day, let us celebrate the beautiful bond of love, trust and lifelong protection. Wishing you both happiness, good health and endless joy!',
      closingSlogan: 'Celebrate the bond of love and protection.',
      rightBoxQuote: 'May this Bhai Dooj strengthen the sibling connection and bring endless blessings to your life. Have a wonderful day!',
    },
    valuesRow: [
      { icon: '❤️', label: 'LOVE', sublabel: 'that never ends' },
      { icon: '🛡️', label: 'PROTECT', sublabel: 'each other always' },
      { icon: '♾️', label: 'BOND', sublabel: 'that grows stronger' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '❤️',
        lines: ['MAY BHAI DOOJ', 'BRING PEACE AND', 'JOY TO SIBLINGS.'],
        highlight: 'HAPPY BHAI DOOJ! ❤️'
      },
      {
        icon: '🎁',
        lines: ['CELEBRATE THE', 'BOND OF TRADITION.', 'GIFT APPRECIATION.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LET YOUR LIFE', 'BE FILLED WITH', 'SWEET MEMORIES.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Warm Bhai Dooj celebration scene with marigold garlands, golden puja thali, tilak items, and traditional motifs. Flat 2D digital illustration. No text, no people, no hands.'
  },

  {
    name: 'Happy Diwali',
    occasion: 'diwali',
    aspectRatio: '1024x1024',
    colorPalette: ['#FFD700', '#4B0082', '#FF6347', '#FFA500', '#800020'],
    heroContent: {
      headline: 'Happy Diwali!',
      subheading: 'Festival of Lights',
      bodyMessage: 'May the festival of lights bring brightness and joy to your life. Wishing you and your family a prosperous and happy Diwali!',
      closingSlogan: 'Light up your world with happiness and prosperity.',
      rightBoxQuote: 'Let the light of Diwali fill your home with joy, peace and endless blessings. Have a wonderful Diwali!',
    },
    valuesRow: [
      { icon: '🪔', label: 'LIGHT', sublabel: 'that guides always' },
      { icon: '💛', label: 'JOY', sublabel: 'that never fades' },
      { icon: '🎆', label: 'CELEBRATE', sublabel: 'every moment' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '🪔',
        lines: ['MAY DIWALI BRING', 'LIGHT AND JOY', 'TO EVERY HOME.'],
        highlight: 'HAPPY DIWALI! 🪔'
      },
      {
        icon: '🎁',
        lines: ['CELEBRATE WITH', 'GIFTS OF LOVE.', 'CREATE MEMORIES.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LET YOUR LIFE', 'SHINE AS BRIGHT', 'AS DIWALI LIGHTS.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Festive Diwali celebration scene with golden diyas, rangoli, sparkles. Flat 2D digital illustration. No text, no people.'
  },

  {
    name: 'Eid Mubarak',
    occasion: 'eid',
    aspectRatio: '1024x1024',
    colorPalette: ['#006400', '#FFD700', '#FFFFFF', '#C0C0C0', '#1B5E20'],
    heroContent: {
      headline: 'Eid Mubarak!',
      subheading: 'Blessed Celebrations',
      bodyMessage: 'May this Eid bring absolute peace, happiness, and prosperity to you and your family. Wishing you all the blessings of this holy and joyful occasion!',
      closingSlogan: 'Spreading joy and blessings this Eid.',
      rightBoxQuote: 'May the light of the crescent moon guide your path to happiness and success. Have a blessed and delightful Eid!',
    },
    valuesRow: [
      { icon: '🌙', label: 'PEACE', sublabel: 'in every heart' },
      { icon: '🕌', label: 'FAITH', sublabel: 'that shines bright' },
      { icon: '🤝', label: 'UNITY', sublabel: 'celebrated together' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '🌙',
        lines: ['MAY EID BRING', 'PROSPERITY AND', 'JOY TO ALL.'],
        highlight: 'EID MUBARAK! 🌙'
      },
      {
        icon: '🎁',
        lines: ['GIFT GENEROSITY', 'AND CELEBRATE THE', 'SPIRIT OF GIVING.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LET YOUR DREAMS', 'BE ILLUMINATED', 'BY DIVINE LIGHT.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Eid Mubarak celebration scene with a glowing crescent moon, stars, mosque silhouette, and hanging lanterns. Flat 2D digital illustration. No text, no people.'
  },

  {
    name: 'Independence Day',
    occasion: 'independence_day',
    aspectRatio: '1024x1024',
    colorPalette: ['#FF9933', '#FFFFFF', '#138808', '#000080', '#FFD700'],
    heroContent: {
      headline: 'Independence Day!',
      subheading: 'Jai Hind — Pride of India',
      bodyMessage: 'Let us celebrate the spirit of freedom, unity and heritage. Together we rise, together we progress. Wishing a happy Independence Day to every proud Indian!',
      closingSlogan: 'Freedom in every stride. Pride in every heart.',
      rightBoxQuote: 'May our nation grow stronger and shine brighter on the global stage. Salute to the flag, pride to the people!',
    },
    valuesRow: [
      { icon: '🕊️', label: 'FREEDOM', sublabel: 'in our minds' },
      { icon: '🇮🇳', label: 'PRIDE', sublabel: 'in our hearts' },
      { icon: '🤝', label: 'UNITY', sublabel: 'in our diversity' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '🇮🇳',
        lines: ['MAY INDIA SHINE', 'WITH FREEDOM AND', 'HARMONY ALWAYS.'],
        highlight: 'JAI HIND! 🇮🇳'
      },
      {
        icon: '🎁',
        lines: ['CELEBRATE INDIAN', 'CRAFTSMANSHIP AND', 'PREMIUM DESIGN.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LET US HONOR', 'THE BRAVE HEARTS', 'WHO GAVE US FREEDOM.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Indian Independence Day scene with a waving tricolor flag, Ashoka Chakra pattern, and marigold flower decorations. Flat 2D digital illustration. No text.'
  },

  {
    name: 'Mega Sale',
    occasion: 'generic_sale',
    aspectRatio: '1024x1024',
    colorPalette: ['#FF4444', '#FFC107', '#212121', '#FFFFFF', '#FF6F00'],
    heroContent: {
      headline: 'Mega Sale!',
      subheading: 'Biggest Offer of Year',
      bodyMessage: 'Do not miss out on our grandest sale of the year! Limited-time offers on all premium bags, wallets, and organizers. Grab yours today before stock runs out!',
      closingSlogan: 'Shop Now — Limited Time Only!',
      rightBoxQuote: 'Upgrade your style with up to 50% discount on entire range. Premium accessories built for everyday utility. Shop the collection!',
    },
    valuesRow: [
      { icon: '🏷️', label: 'OFFER', sublabel: 'up to 50% discount' },
      { icon: '⭐', label: 'QUALITY', sublabel: 'premium materials' },
      { icon: '🚚', label: 'SHIPPING', sublabel: 'free nationwide' }
    ],
    featuresBar: [
      { icon: '🎁', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
      { icon: '🛡', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
      { icon: '❤', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
      { icon: '🇮🇳', text: 'PROUDLY DESIGNED IN INDIA.' },
    ],
    productCategories: [
      { icon: '🎒', name: 'LAPTOP BAG' },
      { icon: '👜', name: 'HAND BAG' },
      { icon: '🎽', name: 'SLING BAG' },
      { icon: '👛', name: 'WALLET' },
      { icon: '⌚', name: 'BELT' },
      { icon: '📁', name: 'ORGANIZER' },
      { icon: '🗂', name: 'PASSPORT ORGANIZER' },
    ],
    footerColumns: [
      {
        icon: '🏷️',
        lines: ['GRAB DEALS NOW', 'WITH EXCLUSIVE', 'FESTIVE DISCOUNTS.'],
        highlight: 'MEGA SALE IS LIVE! 🏷️'
      },
      {
        icon: '🎁',
        lines: ['PERFECT FOR GIFTING.', 'ELEGANT CASINGS.', 'ORDER TODAY.'],
        highlight: null
      },
      {
        icon: '✨',
        lines: ['LIMITED QUANTITIES', 'AVAILABLE. SHOP', 'BEFORE THEY SELL.'],
        highlight: null
      },
      {
        icon: '🛍',
        lines: ['AIMAVEN —', 'WHERE EVERY', 'MOMENT MATTERS.'],
        highlight: 'MADE FOR EVERY MOMENT.'
      }
    ],
    recraftScenePrompt: 'Vibrant celebration sale background scene with abstract geometric shapes, confetti, ribbons, and gift box silhouettes. Flat 2D digital illustration. No text.'
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
