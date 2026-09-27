const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  subject: { type: String, required: true, trim: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  startTime: { type: String, default: '' },
  endTime: { type: String, default: '' },
  studyType: { 
    type: String, 
    enum: ['Deep Work', 'Reading', 'Lecture', 'Practice', 'Revision', 'Other'],
    default: 'Deep Work'
  },
  notes: { type: String, default: '', trim: true }
}, {
  timestamps: true
});

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ userId: 1, subject: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
