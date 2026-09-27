const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  source: { 
    type: String, 
    required: true,
    enum: ['Salary', 'Freelance', 'Allowance', 'Business', 'Gift', 'Other'],
    default: 'Salary'
  },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  account: { type: String, default: 'Primary Account', trim: true },
  recurring: { type: Boolean, default: false },
  notes: { type: String, default: '', trim: true },
}, {
  timestamps: true
});

incomeSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Income', incomeSchema);
