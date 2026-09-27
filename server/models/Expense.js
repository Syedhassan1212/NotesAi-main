const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Food',
      'Transport',
      'Education',
      'Gym',
      'Shopping',
      'Entertainment',
      'Bills',
      'Subscriptions',
      'Software',
      'Other'
    ],
    default: 'Other'
  },
  description: { type: String, required: true, trim: true },
  date: { type: String, required: true, default: () => new Date().toISOString().split('T')[0] },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'UPI', 'Other'],
    default: 'Debit Card'
  },
  account: { type: String, default: 'Primary Account', trim: true },
  notes: { type: String, default: '', trim: true },
  tags: [{ type: String, trim: true }],
}, {
  timestamps: true
});

expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
