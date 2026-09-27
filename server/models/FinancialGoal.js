const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  note: { type: String, default: '', trim: true }
}, { _id: true });

const financialGoalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  targetAmount: { type: Number, required: true },
  currentAmount: { type: Number, default: 0 },
  deadline: { type: String, required: true },
  monthlyTarget: { type: Number, default: 0 },
  notes: { type: String, default: '', trim: true },
  contributions: [contributionSchema]
}, {
  timestamps: true
});

financialGoalSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('FinancialGoal', financialGoalSchema);
