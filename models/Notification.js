const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  type: { type: String, default: 'custom' },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sentTo: [{ type: String }],
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
