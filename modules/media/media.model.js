const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
    folder: { type: String, default: 'travel_planner/gallery' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Media', mediaSchema);
