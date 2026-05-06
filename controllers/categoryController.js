const Category = require('../models/Category');
const ApiError = require('../utils/helpers').ApiError;

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().populate('parentCategory', 'name slug').sort('name');
    res.json({ success: true, data: categories });
  } catch (error) { next(error); }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, icon, description, parentCategory } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const category = await Category.create({ name, slug, icon, description, parentCategory: parentCategory || null });
    res.status(201).json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!category) throw new ApiError('Category not found', 404);
    res.json({ success: true, data: category });
  } catch (error) { next(error); }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) throw new ApiError('Category not found', 404);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) { next(error); }
};
