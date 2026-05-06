const Category = require('../models/Category');

const defaultCategories = [
  { name: 'Beach', slug: 'beach', icon: '🏖️', description: 'Relax by the ocean' },
  { name: 'Mountains', slug: 'mountains', icon: '⛰️', description: 'Explore high peaks' },
  { name: 'Adventure', slug: 'adventure', icon: '🧗', description: 'Thrill and excitement' },
  { name: 'Heritage', slug: 'heritage', icon: '🏛️', description: 'Historical places' },
  { name: 'City', slug: 'city', icon: '🏙️', description: 'Urban exploration' },
  { name: 'Wildlife', slug: 'wildlife', icon: '🐘', description: 'Nature and animals' },
  { name: 'Luxury', slug: 'luxury', icon: '💎', description: 'Premium experiences' },
];

const ensureDefaultCategories = async () => {
  try {
    const count = await Category.countDocuments();
    if (count === 0) {
      await Category.insertMany(defaultCategories);
      console.log(`Default categories initialized: ${defaultCategories.length} inserted.`);
    }
  } catch (error) {
    console.error('Error initializing default categories:', error);
  }
};

module.exports = { ensureDefaultCategories };
