const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  mood: { 
    type: String, 
    enum: ['Great', 'Good', 'Neutral', 'Tired', 'Stressed', 'Reflective'],
    default: 'Good'
  },
  tags: [{ type: String, trim: true }]
}, {
  timestamps: true
});

journalEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
