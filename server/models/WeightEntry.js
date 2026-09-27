const mongoose = require('mongoose');

const weightEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  weight: { type: Number, required: true },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  notes: { type: String, default: '', trim: true }
}, {
  timestamps: true
});

weightEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WeightEntry', weightEntrySchema);
