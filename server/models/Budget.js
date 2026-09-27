const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
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
    ]
  },
  monthlyLimit: { type: Number, required: true },
  month: { type: String, required: true }, // Format: 'YYYY-MM'
}, {
  timestamps: true
});

budgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
