require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/notesai';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Models
const User = require('./models/User');
const Note = require('./models/Note');
const Task = require('./models/Task');

// Cached MongoDB Connection for Serverless & Long-running
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};
connectDB();

// Middleware to guarantee DB connection on incoming requests
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState < 1) {
    await connectDB();
  }
  next();
});

// Auth Middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Username taken' });
    
    const user = new User({ username, password });
    console.log('Before save');
    await user.save();
    console.log('After save');
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ username: user.username });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// --- NOTES ROUTES ---
app.get('/api/notes', authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ updatedAt: -1 });
    // Map _id to id for frontend
    res.json(notes.map(n => ({ ...n.toObject(), id: n._id.toString() })));
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/notes', authMiddleware, async (req, res) => {
  try {
    const note = new Note({ ...req.body, userId: req.userId });
    await note.save();
    res.json({ ...note.toObject(), id: note._id.toString() });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.put('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, 
      req.body, 
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Not found' });
    res.json({ ...note.toObject(), id: note._id.toString() });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.delete('/api/notes/:id', authMiddleware, async (req, res) => {
  try {
    await Note.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

// --- TASKS ROUTES ---
app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: 1 });
    res.json(tasks.map(t => ({ ...t.toObject(), id: t._id.toString() })));
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.userId });
    await task.save();
    res.json({ ...task.toObject(), id: task._id.toString() });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId }, 
      req.body, 
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Not found' });
    res.json({ ...task.toObject(), id: task._id.toString() });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});


// --- BULK SYNC ROUTES (For simple array replacement migration) ---
app.post('/api/sync/notes', authMiddleware, async (req, res) => {
  try {
    const notes = req.body;
    await Note.deleteMany({ userId: req.userId });
    const newNotes = notes.map(n => {
      const noteData = { ...n, userId: req.userId };
      if (mongoose.Types.ObjectId.isValid(n.id)) noteData._id = n.id;
      delete noteData.id;
      return noteData;
    });
    await Note.insertMany(newNotes);
    res.json({ success: true });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.post('/api/sync/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = req.body;
    await Task.deleteMany({ userId: req.userId });
    const newTasks = tasks.map(t => {
      const taskData = { ...t, userId: req.userId };
      if (mongoose.Types.ObjectId.isValid(t.id)) taskData._id = t.id;
      delete taskData.id;
      return taskData;
    });
    await Task.insertMany(newTasks);
    res.json({ success: true });
  } catch (err) { console.error('API Error:', err); res.status(500).json({ error: 'Server error: ' + err.message }); }
});

app.use('/api/me', authMiddleware, require('./routes/me'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
module.exports = app;
