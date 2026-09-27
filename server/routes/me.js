const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const FinancialGoal = require('../models/FinancialGoal');
const WeightEntry = require('../models/WeightEntry');
const Workout = require('../models/Workout');
const StudySession = require('../models/StudySession');
const Course = require('../models/Course');
const PersonalProject = require('../models/PersonalProject');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const JournalEntry = require('../models/JournalEntry');

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getCurrentMonthStr = () => getTodayStr().slice(0, 7);

// ==========================================
// 1. OVERVIEW / COMMAND CENTER
// ==========================================
router.get('/overview', async (req, res) => {
  try {
    const userId = req.userId;
    const today = getTodayStr();
    const currentMonth = getCurrentMonthStr();

    const d7 = new Date();
    d7.setDate(d7.getDate() - 7);
    const date7DaysAgo = d7.toISOString().split('T')[0];

    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const date30DaysAgo = d30.toISOString().split('T')[0];

    const [
      todayExpenses,
      monthlyExpenses,
      monthlyIncome,
      budgets,
      goals,
      weightEntries,
      recentWorkouts,
      weeklyWorkouts,
      todayStudy,
      weeklyStudy,
      monthlyStudy,
      activeCourses,
      activeProjects,
      tasks,
      habits,
      recentJournal
    ] = await Promise.all([
      Expense.find({ userId, date: today }),
      Expense.find({ userId, date: { $regex: `^${currentMonth}` } }),
      Income.find({ userId, date: { $regex: `^${currentMonth}` } }),
      Budget.find({ userId, month: currentMonth }),
      FinancialGoal.find({ userId }).sort({ createdAt: -1 }),
      WeightEntry.find({ userId }).sort({ date: -1 }).limit(15),
      Workout.find({ userId }).sort({ date: -1 }).limit(5),
      Workout.find({ userId, date: { $gte: date7DaysAgo } }),
      StudySession.find({ userId, date: today }),
      StudySession.find({ userId, date: { $gte: date7DaysAgo } }),
      StudySession.find({ userId, date: { $gte: date30DaysAgo } }),
      Course.find({ userId, status: { $in: ['In Progress', 'Not Started'] } }).sort({ updatedAt: -1 }).limit(4),
      PersonalProject.find({ userId, status: { $in: ['In Progress', 'Planning', 'Idea'] } }).sort({ updatedAt: -1 }).limit(4),
      Task.find({ userId }),
      Habit.find({ userId, archived: false }),
      JournalEntry.findOne({ userId }).sort({ date: -1, createdAt: -1 })
    ]);

    const todaySpent = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalMonthlyExpense = monthlyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalMonthlyIncome = monthlyIncome.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const netSavings = totalMonthlyIncome - totalMonthlyExpense;
    const savingsRate = totalMonthlyIncome > 0 ? Math.round((netSavings / totalMonthlyIncome) * 100) : 0;

    const catTotals = {};
    monthlyExpenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.amount) || 0);
    });
    let largestCategory = { category: 'None', amount: 0 };
    Object.entries(catTotals).forEach(([cat, amt]) => {
      if (amt > largestCategory.amount) {
        largestCategory = { category: cat, amount: amt };
      }
    });

    const currentWeight = weightEntries.length > 0 ? weightEntries[0].weight : null;
    const oldestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : null;
    const weightChange = (currentWeight !== null && oldestWeight !== null) ? Number((currentWeight - oldestWeight).toFixed(1)) : 0;

    const todayStudyMinutes = todayStudy.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const weeklyStudyMinutes = weeklyStudy.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);
    const monthlyStudyMinutes = monthlyStudy.reduce((sum, s) => sum + (Number(s.duration) || 0), 0);

    const pendingTasks = tasks.filter(t => !t.completed && t.status !== 'Completed');

    const habitsCompletedToday = habits.filter(h => 
      h.completions && h.completions.some(c => c.date === today && c.completed)
    ).length;

    // Timeline
    const timeline = [];
    const recentExpenses = await Expense.find({ userId }).sort({ createdAt: -1 }).limit(6);
    recentExpenses.forEach(e => {
      timeline.push({
        id: `exp-${e._id}`,
        type: 'finance',
        action: `Logged expense of Rs ${e.amount.toLocaleString()} · ${e.category}`,
        detail: e.description,
        timestamp: e.createdAt ? new Date(e.createdAt).getTime() : new Date(e.date).getTime(),
        date: e.date
      });
    });

    recentWorkouts.forEach(w => {
      timeline.push({
        id: `wkt-${w._id}`,
        type: 'health',
        action: `Logged ${w.workoutType} workout`,
        detail: `${w.duration} mins · ${w.exercises ? w.exercises.length : 0} exercises`,
        timestamp: w.createdAt ? new Date(w.createdAt).getTime() : new Date(w.date).getTime(),
        date: w.date
      });
    });

    const recentStudy = await StudySession.find({ userId }).sort({ createdAt: -1 }).limit(5);
    recentStudy.forEach(s => {
      timeline.push({
        id: `sty-${s._id}`,
        type: 'learning',
        action: `Completed ${s.subject} study session`,
        detail: `${s.duration} mins · ${s.studyType}`,
        timestamp: s.createdAt ? new Date(s.createdAt).getTime() : new Date(s.date).getTime(),
        date: s.date
      });
    });

    const completedTasks = tasks.filter(t => t.completed || t.status === 'Completed').slice(0, 5);
    completedTasks.forEach(t => {
      timeline.push({
        id: `tsk-${t._id}`,
        type: 'life',
        action: `Completed task: ${t.title || t.text}`,
        detail: t.category || 'General',
        timestamp: t.updatedAt || t.createdAt || Date.now(),
        date: t.dueDate || today
      });
    });

    if (recentJournal) {
      timeline.push({
        id: `jnl-${recentJournal._id}`,
        type: 'journal',
        action: `Wrote journal entry: "${recentJournal.title}"`,
        detail: `Mood: ${recentJournal.mood}`,
        timestamp: recentJournal.createdAt ? new Date(recentJournal.createdAt).getTime() : new Date(recentJournal.date).getTime(),
        date: recentJournal.date
      });
    }

    timeline.sort((a, b) => b.timestamp - a.timestamp);
    const recentActivity = timeline.slice(0, 10);

    let topBudget = null;
    if (budgets.length > 0) {
      const b = budgets[0];
      const spent = catTotals[b.category] || 0;
      topBudget = {
        _id: b._id,
        category: b.category,
        monthlyLimit: b.monthlyLimit,
        spent,
        pct: b.monthlyLimit > 0 ? Math.min(100, Math.round((spent / b.monthlyLimit) * 100)) : 0
      };
    }

    res.json({
      today: {
        date: today,
        spent: todaySpent,
        tasksRemaining: pendingTasks.length,
        studyMinutes: todayStudyMinutes,
        workedOutToday: recentWorkouts.some(w => w.date === today),
        habitsCompleted: habitsCompletedToday,
        totalHabits: habits.length
      },
      finance: {
        currentBalance: totalMonthlyIncome - totalMonthlyExpense,
        monthlyIncome: totalMonthlyIncome,
        monthlyExpenses: totalMonthlyExpense,
        netSavings,
        savingsRate,
        largestCategory,
        budgetsCount: budgets.length,
        activeGoalsCount: goals.length
      },
      health: {
        currentWeight,
        startingWeight: oldestWeight,
        weightChange,
        recentWorkout: recentWorkouts[0] || null,
        weeklyWorkoutsCount: weeklyWorkouts.length
      },
      learning: {
        weeklyStudyHours: Number((weeklyStudyMinutes / 60).toFixed(1)),
        monthlyStudyHours: Number((monthlyStudyMinutes / 60).toFixed(1)),
        activeCoursesCount: activeCourses.length,
        activeProjectsCount: activeProjects.length
      },
      life: {
        pendingTasksCount: pendingTasks.length,
        habitsCount: habits.length,
        habitsCompletedToday,
        recentJournalTitle: recentJournal ? recentJournal.title : null,
        recentJournalDate: recentJournal ? recentJournal.date : null
      },
      criticalTasks: tasks.filter(t => !t.completed && t.status !== 'Completed').slice(0, 6),
      activeCourses: activeCourses.slice(0, 4),
      activeProjects: activeProjects.slice(0, 4),
      recentJournal: recentJournal || null,
      topBudget,
      topGoal: goals[0] || null,
      habits: habits.slice(0, 6),
      weightEntries: weightEntries.slice(0, 7),
      recentActivity
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// ==========================================
// 2. FINANCE ROUTES
// ==========================================
router.get('/finance/expenses', async (req, res) => {
  try {
    const { category, paymentMethod, startDate, endDate, sort } = req.query;
    const filter = { userId: req.userId };
    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    let sortOption = { date: -1, createdAt: -1 };
    if (sort === 'amount_asc') sortOption = { amount: 1 };
    if (sort === 'amount_desc') sortOption = { amount: -1 };
    if (sort === 'date_asc') sortOption = { date: 1 };

    const expenses = await Expense.find(filter).sort(sortOption);
    res.json(expenses.map(e => ({ ...e.toObject(), id: e._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance/expenses', async (req, res) => {
  try {
    const { amount, category, description, date, paymentMethod, account, notes, tags } = req.body;
    if (!amount || !description) return res.status(400).json({ error: 'Amount and description are required' });
    
    const expense = new Expense({
      userId: req.userId,
      amount: Number(amount),
      category: category || 'Other',
      description,
      date: date || getTodayStr(),
      paymentMethod: paymentMethod || 'Debit Card',
      account: account || 'Primary Account',
      notes: notes || '',
      tags: Array.isArray(tags) ? tags : []
    });
    await expense.save();
    res.json({ ...expense.toObject(), id: expense._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/finance/expenses/:id', async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ ...expense.toObject(), id: expense._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance/expenses/:id', async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Income
router.get('/finance/income', async (req, res) => {
  try {
    const income = await Income.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
    res.json(income.map(i => ({ ...i.toObject(), id: i._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance/income', async (req, res) => {
  try {
    const { amount, source, date, account, recurring, notes } = req.body;
    if (!amount || !source) return res.status(400).json({ error: 'Amount and source are required' });

    const income = new Income({
      userId: req.userId,
      amount: Number(amount),
      source,
      date: date || getTodayStr(),
      account: account || 'Primary Account',
      recurring: !!recurring,
      notes: notes || ''
    });
    await income.save();
    res.json({ ...income.toObject(), id: income._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/finance/income/:id', async (req, res) => {
  try {
    const income = await Income.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!income) return res.status(404).json({ error: 'Income not found' });
    res.json({ ...income.toObject(), id: income._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance/income/:id', async (req, res) => {
  try {
    await Income.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Budgets
router.get('/finance/budgets', async (req, res) => {
  try {
    const month = req.query.month || getCurrentMonthStr();
    const budgets = await Budget.find({ userId: req.userId, month });
    const expenses = await Expense.find({ userId: req.userId, date: { $regex: `^${month}` } });

    const categorySpend = {};
    expenses.forEach(e => {
      categorySpend[e.category] = (categorySpend[e.category] || 0) + (Number(e.amount) || 0);
    });

    const enrichedBudgets = budgets.map(b => {
      const spent = categorySpend[b.category] || 0;
      return {
        ...b.toObject(),
        id: b._id.toString(),
        spent,
        remaining: Math.max(0, b.monthlyLimit - spent),
        percentUsed: b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0
      };
    });

    res.json(enrichedBudgets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance/budgets', async (req, res) => {
  try {
    const { category, monthlyLimit, month } = req.body;
    if (!category || monthlyLimit === undefined) {
      return res.status(400).json({ error: 'Category and monthlyLimit are required' });
    }
    const targetMonth = month || getCurrentMonthStr();

    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, category, month: targetMonth },
      { monthlyLimit: Number(monthlyLimit) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ ...budget.toObject(), id: budget._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance/budgets/:id', async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Goals
router.get('/finance/goals', async (req, res) => {
  try {
    const goals = await FinancialGoal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(goals.map(g => ({
      ...g.toObject(),
      id: g._id.toString(),
      progress: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance/goals', async (req, res) => {
  try {
    const { title, targetAmount, currentAmount, deadline, monthlyTarget, notes } = req.body;
    if (!title || !targetAmount || !deadline) {
      return res.status(400).json({ error: 'Title, targetAmount and deadline are required' });
    }

    const goal = new FinancialGoal({
      userId: req.userId,
      title,
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline,
      monthlyTarget: Number(monthlyTarget) || 0,
      notes: notes || ''
    });
    await goal.save();
    res.json({ ...goal.toObject(), id: goal._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/finance/goals/:id/contribute', async (req, res) => {
  try {
    const { amount, note, date } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Valid amount required' });

    const goal = await FinancialGoal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    goal.currentAmount += Number(amount);
    goal.contributions.push({
      amount: Number(amount),
      date: date || getTodayStr(),
      note: note || ''
    });
    await goal.save();
    res.json({ ...goal.toObject(), id: goal._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/finance/goals/:id', async (req, res) => {
  try {
    await FinancialGoal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. HEALTH ROUTES
// ==========================================
router.get('/health/weight', async (req, res) => {
  try {
    const entries = await WeightEntry.find({ userId: req.userId }).sort({ date: -1 });
    res.json(entries.map(w => ({ ...w.toObject(), id: w._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/health/weight', async (req, res) => {
  try {
    const { weight, date, notes } = req.body;
    if (!weight) return res.status(400).json({ error: 'Weight is required' });

    const entry = new WeightEntry({
      userId: req.userId,
      weight: Number(weight),
      date: date || getTodayStr(),
      notes: notes || ''
    });
    await entry.save();
    res.json({ ...entry.toObject(), id: entry._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/health/weight/:id', async (req, res) => {
  try {
    await WeightEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/health/workouts', async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId }).sort({ date: -1 });
    res.json(workouts.map(w => ({ ...w.toObject(), id: w._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/health/workouts', async (req, res) => {
  try {
    const { date, workoutType, duration, notes, exercises } = req.body;
    const workout = new Workout({
      userId: req.userId,
      date: date || getTodayStr(),
      workoutType: workoutType || 'Full Body',
      duration: Number(duration) || 45,
      notes: notes || '',
      exercises: Array.isArray(exercises) ? exercises : []
    });
    await workout.save();
    res.json({ ...workout.toObject(), id: workout._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/health/workouts/:id', async (req, res) => {
  try {
    await Workout.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. LEARNING ROUTES
// ==========================================
router.get('/learning/study', async (req, res) => {
  try {
    const sessions = await StudySession.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
    res.json(sessions.map(s => ({ ...s.toObject(), id: s._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/learning/study', async (req, res) => {
  try {
    const { subject, duration, date, startTime, endTime, studyType, notes } = req.body;
    if (!subject || !duration) return res.status(400).json({ error: 'Subject and duration are required' });

    const session = new StudySession({
      userId: req.userId,
      subject,
      duration: Number(duration),
      date: date || getTodayStr(),
      startTime: startTime || '',
      endTime: endTime || '',
      studyType: studyType || 'Deep Work',
      notes: notes || ''
    });
    await session.save();
    res.json({ ...session.toObject(), id: session._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/learning/study/:id', async (req, res) => {
  try {
    await StudySession.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/learning/courses', async (req, res) => {
  try {
    const courses = await Course.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(courses.map(c => ({ ...c.toObject(), id: c._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/learning/courses', async (req, res) => {
  try {
    const { name, provider, startDate, targetDate, progress, status, notes, modules } = req.body;
    if (!name) return res.status(400).json({ error: 'Course name is required' });

    const course = new Course({
      userId: req.userId,
      name,
      provider: provider || '',
      startDate: startDate || getTodayStr(),
      targetDate: targetDate || '',
      progress: Number(progress) || 0,
      status: status || 'In Progress',
      notes: notes || '',
      modules: Array.isArray(modules) ? modules : []
    });
    await course.save();
    res.json({ ...course.toObject(), id: course._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/learning/courses/:id', async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ ...course.toObject(), id: course._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/learning/courses/:id', async (req, res) => {
  try {
    await Course.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/learning/projects', async (req, res) => {
  try {
    const projects = await PersonalProject.find({ userId: req.userId }).sort({ updatedAt: -1 });
    res.json(projects.map(p => ({ ...p.toObject(), id: p._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/learning/projects', async (req, res) => {
  try {
    const { name, description, status, startDate, deadline, progress, techStack, repoUrl, deployUrl, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    const project = new PersonalProject({
      userId: req.userId,
      name,
      description: description || '',
      status: status || 'In Progress',
      startDate: startDate || getTodayStr(),
      deadline: deadline || '',
      progress: Number(progress) || 0,
      techStack: Array.isArray(techStack) ? techStack : [],
      repoUrl: repoUrl || '',
      deployUrl: deployUrl || '',
      notes: notes || ''
    });
    await project.save();
    res.json({ ...project.toObject(), id: project._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/learning/projects/:id', async (req, res) => {
  try {
    await PersonalProject.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. LIFE ROUTES
// ==========================================
router.get('/life/tasks', async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks.map(t => ({
      ...t.toObject(),
      id: t._id.toString(),
      title: t.title || t.text || 'Untitled Task'
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/life/tasks', async (req, res) => {
  try {
    const { title, text, description, priority, dueDate, status, category, project, recurring } = req.body;
    const taskName = title || text;
    if (!taskName) return res.status(400).json({ error: 'Task title is required' });

    const task = new Task({
      userId: req.userId,
      title: taskName,
      text: taskName,
      description: description || '',
      priority: priority || 'Medium',
      dueDate: dueDate || '',
      status: status || 'Todo',
      completed: status === 'Completed',
      category: category || 'General',
      project: project || '',
      recurring: recurring || ''
    });
    await task.save();
    res.json({ ...task.toObject(), id: task._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/life/tasks/:id', async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.title && !update.text) update.text = update.title;
    if (update.text && !update.title) update.title = update.text;
    if (update.completed !== undefined) {
      update.status = update.completed ? 'Completed' : 'Todo';
    } else if (update.status) {
      update.completed = update.status === 'Completed';
    }
    update.updatedAt = Date.now();

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ ...task.toObject(), id: task._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/life/tasks/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/life/habits', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId, archived: false }).sort({ createdAt: 1 });
    const today = getTodayStr();

    const enriched = habits.map(h => {
      const hObj = h.toObject();
      const compMap = new Set((h.completions || []).filter(c => c.completed).map(c => c.date));
      
      let streak = 0;
      let checkDate = new Date();
      if (!compMap.has(today)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      while (true) {
        const dStr = checkDate.toISOString().split('T')[0];
        if (compMap.has(dStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        ...hObj,
        id: h._id.toString(),
        streak,
        isCompletedToday: compMap.has(today)
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/life/habits', async (req, res) => {
  try {
    const { name, description, frequency, targetDaysPerWeek, category, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Habit name is required' });

    const habit = new Habit({
      userId: req.userId,
      name,
      description: description || '',
      frequency: frequency || 'daily',
      targetDaysPerWeek: Number(targetDaysPerWeek) || 7,
      category: category || 'Other',
      color: color || 'primary',
      completions: []
    });
    await habit.save();
    res.json({ ...habit.toObject(), id: habit._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/life/habits/:id/toggle', async (req, res) => {
  try {
    const targetDate = req.body.date || getTodayStr();
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const existingIdx = habit.completions.findIndex(c => c.date === targetDate);
    if (existingIdx >= 0) {
      habit.completions[existingIdx].completed = !habit.completions[existingIdx].completed;
    } else {
      habit.completions.push({ date: targetDate, completed: true });
    }
    await habit.save();
    res.json({ ...habit.toObject(), id: habit._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/life/habits/:id', async (req, res) => {
  try {
    await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/life/journal', async (req, res) => {
  try {
    const { search, tag, mood } = req.query;
    const filter = { userId: req.userId };
    if (mood) filter.mood = mood;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const entries = await JournalEntry.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(entries.map(e => ({ ...e.toObject(), id: e._id.toString() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/life/journal', async (req, res) => {
  try {
    const { title, content, mood, tags, date } = req.body;
    if (!title) return res.status(400).json({ error: 'Journal title is required' });

    const entry = new JournalEntry({
      userId: req.userId,
      date: date || getTodayStr(),
      title,
      content: content || '',
      mood: mood || 'Good',
      tags: Array.isArray(tags) ? tags : []
    });
    await entry.save();
    res.json({ ...entry.toObject(), id: entry._id.toString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/life/journal/:id', async (req, res) => {
  try {
    await JournalEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
