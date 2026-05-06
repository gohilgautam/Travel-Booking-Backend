const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, unique: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true },
        icon: { type: String, default: '📦' },
        description: { type: String },
        parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Category', categorySchema);
