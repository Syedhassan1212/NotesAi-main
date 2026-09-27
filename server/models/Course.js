const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false }
}, { _id: true });

const courseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  provider: { type: String, default: '', trim: true },
  startDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  targetDate: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  status: { 
    type: String, 
    enum: ['Not Started', 'In Progress', 'Completed', 'Paused'],
    default: 'In Progress'
  },
  notes: { type: String, default: '', trim: true },
  modules: [moduleSchema]
}, {
  timestamps: true
});

courseSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Course', courseSchema);
