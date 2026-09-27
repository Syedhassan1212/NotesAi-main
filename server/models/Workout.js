const mongoose = require('mongoose');

const workoutSetSchema = new mongoose.Schema({
  reps: { type: Number, required: true },
  weight: { type: Number, required: true }
}, { _id: false });

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sets: [workoutSetSchema]
}, { _id: true });

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  workoutType: { 
    type: String, 
    required: true, 
    trim: true,
    enum: ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Cardio', 'Full Body', 'Other'],
    default: 'Full Body'
  },
  duration: { type: Number, default: 45 },
  notes: { type: String, default: '', trim: true },
  exercises: [exerciseSchema]
}, {
  timestamps: true
});

workoutSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Workout', workoutSchema);
