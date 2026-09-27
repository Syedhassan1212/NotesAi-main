const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String },
  title: { type: String, trim: true },
  description: { type: String, default: '', trim: true },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dueDate: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['Todo', 'In Progress', 'Completed'],
    default: 'Todo'
  },
  completed: { type: Boolean, default: false },
  category: { type: String, default: 'General', trim: true },
  project: { type: String, default: '', trim: true },
  recurring: { type: String, default: '', trim: true },
  createdAt: { type: Number, default: () => Date.now() },
  updatedAt: { type: Number, default: () => Date.now() }
});

taskSchema.pre('save', function(next) {
  if (this.title && !this.text) {
    this.text = this.title;
  } else if (this.text && !this.title) {
    this.title = this.text;
  }
  if (this.status === 'Completed') {
    this.completed = true;
  } else if (this.completed) {
    this.status = 'Completed';
  } else if (!this.status) {
    this.status = 'Todo';
  }
  this.updatedAt = Date.now();
  if (typeof next === 'function') next();
});

taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
