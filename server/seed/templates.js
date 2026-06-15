/**
 * Seed script — Single Universal Default Template for AdWhiz Promo Creator.
 *
 * Run: node server/seed/templates.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const ImageTemplate = require('../models/ImageTemplate');

const templates = [{
  name: 'Default',
  occasion: 'default',
  aspectRatio: '1024x1024',
  colorPalette: ['#FFD700', '#4B0082', '#FF6347', '#FFA500', '#FFFFFF'],
  heroContent: {
    headline: 'Festival Greetings!',
    subheading: 'Special Celebration',
    bodyMessage: 'Wishing you joy and prosperity on this special occasion.',
    closingSlogan: 'Celebrate every moment.',
    rightBoxQuote: 'May this festive season bring endless joy and blessings.',
  },
  valuesRow: [
    { icon: '★', label: 'LOVE',      sublabel: 'that never ends' },
    { icon: '◆', label: 'JOY',       sublabel: 'every moment' },
    { icon: '●', label: 'CELEBRATE', sublabel: 'together' },
  ],
  featuresBar: [
    { icon: '★', text: 'THOUGHTFUL GIFTS THAT BRING SMILES.' },
    { icon: '◆', text: 'PREMIUM QUALITY. BUILT TO LAST.' },
    { icon: '♥', text: 'MADE TO DELIGHT. MADE FOR YOU.' },
    { icon: '●', text: 'PROUDLY DESIGNED IN INDIA.' },
  ],
  productCategories: [
    { icon: '🎒', name: 'LAPTOP BAG' },
    { icon: '👜', name: 'HAND BAG' },
    { icon: '🎽', name: 'SLING BAG' },
  ],
  footerColumns: [
    { icon: '★', lines: ['CELEBRATE THIS', 'FESTIVE SEASON', 'WITH US.'], highlight: 'HAPPY CELEBRATIONS!' },
    { icon: '◆', lines: ['GIFT THE', 'BEST TO YOUR', 'LOVED ONES.'], highlight: null },
    { icon: '♥', lines: ['SPREAD LOVE', 'AND JOY', 'EVERYWHERE.'], highlight: null },
    { icon: '●', lines: ['YOUR BRAND -', 'WHERE EVERY', 'MOMENT MATTERS.'], highlight: 'MADE FOR EVERY MOMENT.' },
  ],
  recraftScenePrompt: 'Generic festive celebration scene. Flat 2D digital illustration. No text, no people.',
  active: true,
}];

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
