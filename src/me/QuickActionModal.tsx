import React, { useState } from 'react';
import { meApi } from '../utils/meApi';
import { toast } from 'sonner';
import { 
  X, Plus, DollarSign, ArrowDownLeft, CheckSquare, 
  BookOpen, Dumbbell, Scale, Flame, PenTool 
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: string;
}

type TabType = 'expense' | 'income' | 'task' | 'study' | 'workout' | 'weight' | 'habit' | 'journal';

export default function QuickActionModal({ isOpen, onClose, onSuccess, initialTab = 'expense' }: QuickActionModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab as TabType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense form state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expensePayment, setExpensePayment] = useState('Debit Card');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Income form state
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeSource, setIncomeSource] = useState('Salary');
  const [incomeAccount, setIncomeAccount] = useState('Primary Checking');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskCategory, setTaskCategory] = useState('Personal');

  // Study form state
  const [studySubject, setStudySubject] = useState('');
  const [studyDuration, setStudyDuration] = useState('60');
  const [studyType, setStudyType] = useState('Deep Work');
  const [studyDate, setStudyDate] = useState(new Date().toISOString().split('T')[0]);

  // Workout form state
  const [workoutType, setWorkoutType] = useState('Full Body');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [workoutExercise, setWorkoutExercise] = useState('');
  const [workoutSets, setWorkoutSets] = useState('3');
  const [workoutReps, setWorkoutReps] = useState('10');
  const [workoutWeight, setWorkoutWeight] = useState('60');

  // Weight form state
  const [weightVal, setWeightVal] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  // Habit form state
  const [habitName, setHabitName] = useState('');
  const [habitCategory, setHabitCategory] = useState('Study');

  // Journal form state
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalMood, setJournalMood] = useState('Good');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeTab === 'expense') {
        if (!expenseAmount || !expenseDesc) throw new Error('Please fill in amount and description');
        await meApi.createExpense({
          amount: parseFloat(expenseAmount),
          description: expenseDesc,
          category: expenseCategory,
          paymentMethod: expensePayment,
          date: expenseDate
        });
        toast.success(`Expense of Rs ${expenseAmount} logged`);
      } else if (activeTab === 'income') {
        if (!incomeAmount) throw new Error('Please enter income amount');
        await meApi.createIncome({
          amount: parseFloat(incomeAmount),
          source: incomeSource,
          account: incomeAccount,
          date: incomeDate
        });
        toast.success(`Income of Rs ${incomeAmount} logged`);
      } else if (activeTab === 'task') {
        if (!taskTitle) throw new Error('Please enter task title');
        await meApi.createTask({
          title: taskTitle,
          priority: taskPriority,
          dueDate: taskDueDate,
          category: taskCategory
        });
        toast.success('Task created successfully');
      } else if (activeTab === 'study') {
        if (!studySubject || !studyDuration) throw new Error('Please enter subject and duration');
        await meApi.createStudySession({
          subject: studySubject,
          duration: parseInt(studyDuration),
          studyType,
          date: studyDate
        });
        toast.success(`Study session logged: ${studyDuration} mins`);
      } else if (activeTab === 'workout') {
        const exercises = workoutExercise ? [{
          name: workoutExercise,
          sets: Array.from({ length: parseInt(workoutSets) || 1 }).map(() => ({
            reps: parseInt(workoutReps) || 10,
            weight: parseFloat(workoutWeight) || 0
          }))
        }] : [];
        await meApi.createWorkout({
          workoutType,
          duration: parseInt(workoutDuration) || 45,
          exercises
        });
        toast.success(`${workoutType} workout logged`);
      } else if (activeTab === 'weight') {
        if (!weightVal) throw new Error('Please enter your weight');
        await meApi.createWeight({
          weight: parseFloat(weightVal),
          notes: weightNotes
        });
        toast.success(`Weight recorded: ${weightVal} kg`);
      } else if (activeTab === 'habit') {
        if (!habitName) throw new Error('Please enter habit name');
        await meApi.createHabit({
          name: habitName,
          category: habitCategory
        });
        toast.success(`Habit "${habitName}" created`);
      } else if (activeTab === 'journal') {
        if (!journalTitle) throw new Error('Please enter journal title');
        await meApi.createJournal({
          title: journalTitle,
          content: journalContent,
          mood: journalMood
        });
        toast.success('Journal entry saved');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'expense', label: 'Expense', icon: DollarSign },
    { id: 'income', label: 'Income', icon: ArrowDownLeft },
    { id: 'task', label: 'Task', icon: CheckSquare },
    { id: 'study', label: 'Study', icon: BookOpen },
    { id: 'workout', label: 'Workout', icon: Dumbbell },
    { id: 'weight', label: 'Weight', icon: Scale },
    { id: 'habit', label: 'Habit', icon: Flame },
    { id: 'journal', label: 'Journal', icon: PenTool },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg bg-surface-card border border-hairline-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline-border bg-surface-container-low/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Quick Action</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-text-tertiary hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 py-3 border-b border-hairline-border overflow-x-auto bg-surface scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-sm text-label-sm shrink-0 transition-all ${
                  isActive 
                    ? 'bg-primary text-on-primary font-semibold shadow-sm'
                    : 'text-text-secondary hover:text-on-surface hover:bg-surface-container-high'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-on-surface font-body-sm text-body-sm">
          {activeTab === 'expense' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Amount (Rs)*</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 1500"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-headline-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Description*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery restock, Dinner with team"
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={e => setExpenseCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Food', 'Transport', 'Education', 'Gym', 'Shopping', 'Entertainment', 'Bills', 'Subscriptions', 'Software', 'Other'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Payment Method</label>
                  <select
                    value={expensePayment}
                    onChange={e => setExpensePayment(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Debit Card', 'Credit Card', 'Cash', 'Bank Transfer', 'UPI', 'Other'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Date</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={e => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
            </>
          )}

          {activeTab === 'income' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Amount (Rs)*</label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="e.g. 85000"
                  value={incomeAmount}
                  onChange={e => setIncomeAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-headline-sm"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Source</label>
                  <select
                    value={incomeSource}
                    onChange={e => setIncomeSource(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Salary', 'Freelance', 'Allowance', 'Business', 'Gift', 'Other'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Account</label>
                  <input
                    type="text"
                    value={incomeAccount}
                    onChange={e => setIncomeAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Date</label>
                <input
                  type="date"
                  value={incomeDate}
                  onChange={e => setIncomeDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
            </>
          )}

          {activeTab === 'task' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Task Title*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Review pull request, Pay electricity bill"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="Work, Study, Personal"
                    value={taskCategory}
                    onChange={e => setTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={e => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
            </>
          )}

          {activeTab === 'study' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Subject / Topic*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Systems, Neural Networks"
                  value={studySubject}
                  onChange={e => setStudySubject(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Duration (Minutes)*</label>
                  <input
                    type="number"
                    required
                    placeholder="60"
                    value={studyDuration}
                    onChange={e => setStudyDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Study Type</label>
                  <select
                    value={studyType}
                    onChange={e => setStudyType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Deep Work', 'Reading', 'Lecture', 'Practice', 'Revision', 'Other'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Date</label>
                <input
                  type="date"
                  value={studyDate}
                  onChange={e => setStudyDate(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
            </>
          )}

          {activeTab === 'workout' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Workout Type</label>
                  <select
                    value={workoutType}
                    onChange={e => setWorkoutType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  >
                    {['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Cardio', 'Full Body', 'Other'].map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={workoutDuration}
                    onChange={e => setWorkoutDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  />
                </div>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Exercise Highlight</label>
                <input
                  type="text"
                  placeholder="e.g. Bench Press"
                  value={workoutExercise}
                  onChange={e => setWorkoutExercise(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Sets</label>
                  <input
                    type="number"
                    value={workoutSets}
                    onChange={e => setWorkoutSets(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Reps</label>
                  <input
                    type="number"
                    value={workoutReps}
                    onChange={e => setWorkoutReps(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={workoutWeight}
                    onChange={e => setWorkoutWeight(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg text-on-surface"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'weight' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Current Weight (kg)*</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="e.g. 74.5"
                  value={weightVal}
                  onChange={e => setWeightVal(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface font-headline-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Morning weigh-in, fasted"
                  value={weightNotes}
                  onChange={e => setWeightNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                />
              </div>
            </>
          )}

          {activeTab === 'habit' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Habit Name*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 20 pages, Gym session, 8h Sleep"
                  value={habitName}
                  onChange={e => setHabitName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Category</label>
                <select
                  value={habitCategory}
                  onChange={e => setHabitCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                >
                  {['Study', 'Gym', 'Reading', 'Sleep', 'Coding', 'Journaling', 'Health', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === 'journal' && (
            <>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Entry Title*</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reflections on progress, Deep work session"
                  value={journalTitle}
                  onChange={e => setJournalTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Mood</label>
                <select
                  value={journalMood}
                  onChange={e => setJournalMood(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
                >
                  {['Great', 'Good', 'Neutral', 'Tired', 'Stressed', 'Reflective'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-text-secondary font-label-sm text-label-sm mb-1">Thoughts / Content</label>
                <textarea
                  rows={4}
                  placeholder="Write freely..."
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-hairline-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-on-surface resize-none"
                />
              </div>
            </>
          )}

          <div className="pt-3 border-t border-hairline-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-accent-hover text-on-primary rounded-xl font-label-md text-label-md font-semibold transition-all disabled:opacity-50 shadow-sm"
            >
              <Plus size={16} />
              <span>{isSubmitting ? 'Saving...' : 'Save Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
