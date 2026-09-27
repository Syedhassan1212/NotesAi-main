const mongoose = require('mongoose');

const completionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  completed: { type: Boolean, default: true }
}, { _id: false });

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  targetDaysPerWeek: { type: Number, default: 7 },
  category: { 
    type: String, 
    enum: ['Study', 'Gym', 'Reading', 'Sleep', 'Coding', 'Journaling', 'Health', 'Other'],
    default: 'Other'
  },
  color: { type: String, default: 'primary' },
  archived: { type: Boolean, default: false },
  completions: [completionSchema]
}, {
  timestamps: true
});

habitSchema.index({ userId: 1, archived: 1 });

module.exports = mongoose.model('Habit', habitSchema);
