const mongoose = require('mongoose');

const personalProjectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  status: { 
    type: String, 
    enum: ['Idea', 'Planning', 'In Progress', 'Completed', 'Archived'],
    default: 'In Progress'
  },
  startDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  deadline: { type: String, default: '' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  techStack: [{ type: String, trim: true }],
  repoUrl: { type: String, default: '', trim: true },
  deployUrl: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true }
}, {
  timestamps: true
});

personalProjectSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('PersonalProject', personalProjectSchema);
