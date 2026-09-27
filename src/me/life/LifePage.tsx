import React, { useState, useEffect, useRef, useMemo } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function LifePage() {
  const { refreshKey, onRefresh } = useOutletContext<OutletContextType>();

  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Task state
  const [taskTab, setTaskTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [rapidTaskInput, setRapidTaskInput] = useState('');
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tPriority, setTPriority] = useState('Medium');
  const [tCategory, setTCategory] = useState('General');
  const [tDueDate, setTDueDate] = useState('Today');

  // Habit state
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [hName, setHName] = useState('');
  const [hCategory, setHCategory] = useState('General');
  const [hTargetDays, setHTargetDays] = useState(7);

  // Journal state
  const [journalText, setJournalText] = useState('');
  const [journalMood, setJournalMood] = useState('Deep Calm / Focused');
  const [journalTag, setJournalTag] = useState('Mindset');
  const [searchOpen, setSearchOpen] = useState(false);
  const [journalSearchQuery, setJournalSearchQuery] = useState('');

  const taskInputRef = useRef<HTMLInputElement>(null);
  const journalInputRef = useRef<HTMLTextAreaElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, hRes, jRes] = await Promise.all([
        meApi.getTasks(),
        meApi.getHabits(),
        meApi.getJournal()
      ]);
      setTasks(tRes || []);
      setHabits(hRes || []);
      setJournalEntries(jRes || []);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load life dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Task actions
  const handleToggleTask = async (task: any) => {
    const isCompleted = task.completed || task.status === 'Completed';
    const newStatus = isCompleted ? 'Todo' : 'Completed';
    try {
      const updated = await meApi.updateTask(task.id || task._id, { 
        status: newStatus,
        completed: !isCompleted
      });
      setTasks(prev => prev.map(t => (t.id === task.id || t._id === task._id) ? updated : t));
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await meApi.deleteTask(taskId);
      setTasks(prev => prev.filter(t => (t.id || t._id) !== taskId));
      toast.success('Task removed');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete task');
    }
  };

  const handleCreateRapidTask = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && rapidTaskInput.trim()) {
      try {
        const newTask = await meApi.createTask({
          title: rapidTaskInput.trim(),
          priority: 'High',
          category: 'General',
          dueDate: 'Today'
        });
        setTasks(prev => [newTask, ...prev]);
        setRapidTaskInput('');
        toast.success('Task recorded');
        onRefresh();
      } catch (err: any) {
        toast.error('Failed to create task');
      }
    }
  };

  const handleSaveTaskModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    try {
      const newTask = await meApi.createTask({
        title: tTitle.trim(),
        priority: tPriority,
        category: tCategory,
        dueDate: tDueDate
      });
      setTasks(prev => [newTask, ...prev]);
      setTaskModalOpen(false);
      setTTitle('');
      toast.success('Task created');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create task');
    }
  };

  // Habit actions
  const handleToggleHabitDay = async (habit: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const updated = await meApi.toggleHabit(habit.id || habit._id, todayStr);
      setHabits(prev => prev.map(h => (h.id === habit.id || h._id === habit._id) ? updated : h));
      toast.success('Habit status toggled');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to update habit');
    }
  };

  const handleDeleteHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      await meApi.deleteHabit(habitId);
      setHabits(prev => prev.filter(h => (h.id || h._id) !== habitId));
      toast.success('Habit deleted');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete habit');
    }
  };

  const handleSaveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hName.trim()) return;
    try {
      const newHabit = await meApi.createHabit({
        name: hName.trim(),
        category: hCategory,
        frequency: 'daily',
        targetDaysPerWeek: Number(hTargetDays) || 7
      });
      setHabits(prev => [...prev, newHabit]);
      setHabitModalOpen(false);
      setHName('');
      toast.success('Habit registered');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to create habit');
    }
  };

  // Journal actions
  const handleRecordJournal = async () => {
    if (!journalText.trim()) {
      toast.error('Reflection content cannot be empty');
      return;
    }
    try {
      const newEntry = await meApi.createJournal({
        title: `Reflection: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        content: journalText.trim(),
        mood: journalMood,
        tags: [journalTag]
      });
      setJournalEntries(prev => [newEntry, ...prev]);
      setJournalText('');
      toast.success('Reflection recorded');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to record journal');
    }
  };

  const handleDeleteJournal = async (journalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this reflection entry?')) return;
    try {
      await meApi.deleteJournal(journalId);
      setJournalEntries(prev => prev.filter(j => (j.id || j._id) !== journalId));
      toast.success('Reflection removed');
      onRefresh();
    } catch (err: any) {
      toast.error('Failed to delete reflection');
    }
  };

  // Real calculations
  const todayStr = new Date().toISOString().split('T')[0];

  // Past 7 calendar days
  const past7Days = useMemo(() => {
    const dates = [];
    const dayLetters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        dateStr: d.toISOString().split('T')[0],
        dayLetter: dayLetters[d.getDay()],
        isToday: i === 0
      });
    }
    return dates;
  }, []);

  // Filter tasks based on real database state
  const pendingTasksCount = tasks.filter(t => !t.completed && t.status !== 'Completed').length;

  const filteredTasks = tasks.filter(t => {
    const isDone = t.completed || t.status === 'Completed';
    if (taskTab === 'completed') return isDone;
    if (isDone) return false;

    if (taskTab === 'today') {
      return !t.dueDate || t.dueDate === 'Today' || t.dueDate === todayStr || t.dueDate < todayStr;
    }
    if (taskTab === 'upcoming') {
      return t.dueDate && t.dueDate > todayStr && t.dueDate !== 'Today';
    }
    if (taskTab === 'overdue') {
      return t.dueDate && t.dueDate < todayStr && t.dueDate !== 'Today';
    }
    return true;
  });

  // Calculate real habit metrics
  const totalHabitSlots = habits.length * 7;
  const totalCompletionsIn7 = habits.reduce((acc, h) => {
    const compDates = new Set((h.completions || []).filter((c: any) => c.completed).map((c: any) => c.date));
    const hits = past7Days.filter(d => compDates.has(d.dateStr)).length;
    return acc + hits;
  }, 0);
  const overallConsistencyPct = totalHabitSlots > 0 ? Math.round((totalCompletionsIn7 / totalHabitSlots) * 100) : 0;

  // Filter journal entries
  const filteredJournalEntries = journalEntries.filter(entry => {
    if (!journalSearchQuery.trim()) return true;
    const q = journalSearchQuery.toLowerCase();
    const inTitle = (entry.title || '').toLowerCase().includes(q);
    const inContent = (entry.content || '').toLowerCase().includes(q);
    const inTags = (entry.tags || []).some((t: string) => t.toLowerCase().includes(q));
    const inMood = (entry.mood || '').toLowerCase().includes(q);
    return inTitle || inContent || inTags || inMood;
  });

  const featuredJournal = filteredJournalEntries[0] || null;
  const archivalEntries = filteredJournalEntries.slice(1, 4);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-8">
        
        {/* Top Context & Action Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-hairline-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-code text-code text-text-muted">
              <span>/me</span>
              <span className="text-text-secondary">/</span>
              <span className="text-primary font-label-md text-label-md">life</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse ml-2"></span>
              <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase">Live Stream</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-semibold">Life, Habits & Mind</h1>
            <p className="font-body-md text-body-md text-text-muted">
              Daily execution, consistent streaks, and distraction-free reflections.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setTaskModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-elevated text-primary font-label-md text-label-md transition-all shadow-sm active:scale-95 cursor-pointer border border-hairline-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted">check_circle</span>
              <span>New Task</span>
            </button>
            <button
              onClick={() => setHabitModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-high hover:bg-surface-elevated text-primary font-label-md text-label-md transition-all shadow-sm active:scale-95 cursor-pointer border border-hairline-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted">bolt</span>
              <span>Log Habit</span>
            </button>
            <button
              onClick={() => {
                if (journalInputRef.current) {
                  journalInputRef.current.focus();
                  journalInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-on-primary font-label-md text-label-md transition-all shadow-sm active:scale-95 cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Write Journal</span>
            </button>
          </div>
        </div>

        {/* 3-Column Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMN 1: TASKS & PRIORITIES (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card rounded-xl p-5 shadow-xl border border-hairline-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">checklist</span>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">Tasks & Priorities</h2>
              </div>
              <span className="font-code text-label-sm text-text-muted px-2 py-0.5 rounded-full bg-surface-container">
                {pendingTasksCount} pending
              </span>
            </div>

            {/* Filter Segmented Tabs */}
            <div className="flex items-center p-1 rounded-lg bg-surface-container-lowest gap-1 border border-hairline-border">
              {(['today', 'upcoming', 'overdue', 'completed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setTaskTab(tab)}
                  className={`flex-1 py-1 px-2.5 rounded-md text-center font-label-sm text-label-sm capitalize transition-all cursor-pointer ${
                    taskTab === tab
                      ? 'bg-surface-container-high text-primary font-medium'
                      : 'text-text-muted hover:text-primary'
                  }`}
                  type="button"
                >
                  {tab === 'completed' ? 'Done' : tab}
                </button>
              ))}
            </div>

            {/* Task List Stack */}
            <div className="space-y-2.5 pt-1 min-h-[160px]">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => {
                  const isDone = task.completed || task.status === 'Completed';
                  const priority = task.priority || 'Medium';

                  return (
                    <div
                      key={task._id || task.id}
                      className="group relative p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-elevated transition-all flex items-start gap-3 border border-hairline-border"
                    >
                      <button
                        onClick={() => handleToggleTask(task)}
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isDone 
                            ? 'bg-primary' 
                            : 'bg-surface-container-highest hover:bg-primary'
                        }`}
                        type="button"
                      >
                        <span className={`material-symbols-outlined text-[12px] text-canvas-base transition-opacity ${
                          isDone ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
                        }`}>
                          check
                        </span>
                      </button>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className={`font-body-md text-body-md transition-colors line-clamp-2 ${
                          isDone ? 'line-through text-text-muted' : 'text-text-primary group-hover:text-primary'
                        }`}>
                          {task.title || task.text}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap font-label-sm text-label-sm">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            priority === 'Critical'
                              ? 'bg-surface-container-highest text-error'
                              : priority === 'High'
                              ? 'bg-surface-container-highest text-secondary'
                              : priority === 'Medium'
                              ? 'bg-surface-container-highest text-text-secondary'
                              : 'bg-surface-container-highest text-text-muted'
                          }`}>
                            {priority}
                          </span>
                          <span className="text-text-muted font-code">#{task.category || 'General'}</span>
                          <span className="text-text-muted flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {task.dueDate || 'Today'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteTask(task._id || task.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-all"
                        title="Delete task"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center space-y-2 border border-dashed border-hairline-border rounded-xl">
                  <span className="material-symbols-outlined text-[28px] text-text-muted">task_alt</span>
                  <p className="font-body-sm text-text-secondary">
                    {taskTab === 'completed' ? 'No completed tasks yet' : `No ${taskTab} tasks`}
                  </p>
                  <p className="font-label-sm text-text-muted">
                    {taskTab === 'completed' ? 'Tasks you complete will appear here.' : 'Use rapid input below to create one.'}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Add Bottom Input */}
            <div className="mt-auto pt-2">
              <div className="relative flex items-center bg-surface-container-lowest rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-primary/40 border border-hairline-border">
                <span className="material-symbols-outlined text-[16px] text-text-muted mr-2">add</span>
                <input
                  ref={taskInputRef}
                  value={rapidTaskInput}
                  onChange={e => setRapidTaskInput(e.target.value)}
                  onKeyDown={handleCreateRapidTask}
                  className="w-full bg-transparent text-text-primary placeholder:text-text-muted font-body-sm text-body-sm outline-none"
                  placeholder="Add rapid task... [Press Enter]"
                  type="text"
                />
                <kbd className="font-code text-label-sm text-text-muted bg-surface-container px-1.5 py-0.5 rounded">↵</kbd>
              </div>
            </div>
          </section>

          {/* COLUMN 2: HABIT STREAK & CALENDAR MATRIX (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card rounded-xl p-5 shadow-xl border border-hairline-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">grid_view</span>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">Habit Streaks</h2>
              </div>
              <span className="font-code text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                {overallConsistencyPct}% Consistency
              </span>
            </div>

            {/* Metric Highlight Banner */}
            <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-hairline-border">
              <div className="space-y-0.5">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Active Run</span>
                <p className="font-headline-md text-headline-md text-primary tracking-tight font-semibold">
                  {habits.length > 0 ? `${habits.length} Habits in Flow` : 'No Habits Established'}
                </p>
              </div>
              {/* Sparkline Mini Trend */}
              <svg className="w-20 h-8 text-secondary overflow-visible" fill="none" viewBox="0 0 80 28">
                <path d="M 2 24 L 14 18 L 28 20 L 42 10 L 56 12 L 70 4 L 78 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <circle cx="78" cy="6" fill="currentColor" r="2.5"></circle>
              </svg>
            </div>

            {/* 7-Day Header Marker */}
            <div className="flex items-center justify-between text-text-muted font-code text-label-sm px-1 pt-1">
              <span className="text-text-secondary">Track</span>
              <div className="flex items-center gap-1.5">
                {past7Days.map((d) => (
                  <span 
                    key={d.dateStr} 
                    className={`w-4 text-center ${d.isToday ? 'text-primary font-bold' : ''}`}
                  >
                    {d.dayLetter}
                  </span>
                ))}
              </div>
            </div>

            {/* Habits Matrix Rows */}
            <div className="space-y-2.5 min-h-[160px]">
              {habits.length > 0 ? (
                habits.map((habit: any, hIdx: number) => {
                  const compMap = new Set((habit.completions || []).filter((c: any) => c.completed).map((c: any) => c.date));
                  const streak = habit.streak || 0;
                  const targetDays = habit.targetDaysPerWeek || 7;
                  
                  // Compute hits in last 7 days
                  const hitsIn7 = past7Days.filter(d => compMap.has(d.dateStr)).length;
                  const progressPct = Math.round((hitsIn7 / 7) * 100);
                  const isHit = hitsIn7 >= targetDays;
                  const isTodayDone = compMap.has(todayStr);

                  const emojis = ['⚡', '🏋️', '📖', '🛌', '💻', '🧘', '💧'];
                  const emoji = emojis[hIdx % emojis.length];

                  return (
                    <div key={habit._id || habit.id} className="group p-3 rounded-xl bg-surface-container-low hover:bg-surface-elevated transition-colors space-y-2.5 border border-hairline-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px]">{emoji}</span>
                          <div>
                            <p className="font-label-md text-label-md text-primary leading-none font-medium">{habit.name}</p>
                            <span className={`font-body-sm text-body-sm ${isHit ? 'text-secondary' : 'text-text-muted'}`}>
                              Target {targetDays}d/wk ({hitsIn7}/{targetDays} hit)
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 font-code text-label-sm text-text-secondary">
                            <span className="text-primary font-bold">{streak}d</span>
                            {streak >= 3 && <span>🔥</span>}
                          </div>
                          <button
                            onClick={(e) => handleDeleteHabit(habit._id || habit.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-error transition-all"
                            title="Delete habit"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        </div>
                      </div>

                      {/* Progress Bar & 7-Day Dots */}
                      <div className="flex items-center justify-between">
                        <div className="w-28 h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${isHit ? 'bg-secondary-container' : 'bg-primary'}`} 
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {past7Days.slice(0, 6).map((d) => {
                            const completed = compMap.has(d.dateStr);
                            return completed ? (
                              <span key={d.dateStr} className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[10px] text-canvas-base">check</span>
                              </span>
                            ) : (
                              <span key={d.dateStr} className="w-4 h-4 rounded-full bg-surface-container-highest"></span>
                            );
                          })}
                          {/* 7th dot: Today interactive toggle */}
                          <button
                            onClick={() => handleToggleHabitDay(habit)}
                            className={`w-4 h-4 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                              isTodayDone
                                ? 'bg-primary'
                                : 'bg-surface-container-highest hover:bg-primary/50'
                            }`}
                            title={isTodayDone ? 'Completed today (click to undo)' : 'Click to complete for today'}
                            type="button"
                          >
                            <span className={`material-symbols-outlined text-[10px] text-canvas-base transition-opacity ${
                              isTodayDone ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                            }`}>
                              check
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-10 text-center space-y-2 border border-dashed border-hairline-border rounded-xl">
                  <span className="material-symbols-outlined text-[28px] text-text-muted">bolt</span>
                  <p className="font-body-sm text-text-secondary">No habits established yet</p>
                  <button 
                    onClick={() => setHabitModalOpen(true)}
                    className="text-primary hover:underline font-label-sm font-semibold cursor-pointer"
                  >
                    + Create your first habit
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* COLUMN 3: PERSONAL JOURNAL & REFLECTION (4 cols) */}
          <section className="lg:col-span-4 flex flex-col gap-4 bg-surface-card rounded-xl p-5 shadow-xl border border-hairline-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-text-muted">book_2</span>
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-semibold">Journal & Mind</h2>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setSearchOpen(!searchOpen)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer border border-hairline-border ${
                    searchOpen ? 'bg-primary text-on-primary' : 'bg-surface-container text-text-muted hover:text-primary'
                  }`}
                  title="Search reflections"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">search</span>
                </button>
              </div>
            </div>

            {searchOpen && (
              <div className="pt-1">
                <input
                  value={journalSearchQuery}
                  onChange={e => setJournalSearchQuery(e.target.value)}
                  placeholder="Filter reflections by title, text, mood, tag..."
                  className="w-full bg-surface-container-low px-3 py-1.5 text-body-sm text-text-primary rounded-lg border border-hairline-border outline-none focus:border-primary"
                  autoFocus
                />
              </div>
            )}

            {/* Featured / Latest Reflection Card */}
            {featuredJournal ? (
              <div className="p-4 rounded-xl bg-surface-container-low space-y-3 relative overflow-hidden group border border-hairline-border">
                <div className="flex items-center justify-between">
                  <span className="font-code text-label-sm text-text-muted">
                    {featuredJournal.date || (featuredJournal.createdAt ? new Date(featuredJournal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm">
                      {featuredJournal.mood || 'Reflection'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteJournal(featuredJournal._id || featuredJournal.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-text-muted hover:text-error transition-all"
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-primary leading-snug font-semibold">
                  {featuredJournal.title || 'Untitled Reflection'}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-4">
                  {(featuredJournal.content || '').replace(/<[^>]*>?/gm, '')}
                </p>
                {featuredJournal.tags && featuredJournal.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 font-code text-label-sm text-text-muted">
                    {featuredJournal.tags.map((tag: string, tIdx: number) => (
                      <React.Fragment key={tag}>
                        <span className="hover:text-primary cursor-pointer transition-colors">#{tag}</span>
                        {tIdx < (featuredJournal.tags || []).length - 1 && <span>•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center space-y-2 border border-dashed border-hairline-border rounded-xl">
                <span className="material-symbols-outlined text-[28px] text-text-muted">edit_note</span>
                <p className="font-body-sm text-text-secondary">No reflections logged yet</p>
                <p className="font-label-sm text-text-muted">Capture insights and mindset shifts below</p>
              </div>
            )}

            {/* Archival Journal Entries */}
            {archivalEntries.length > 0 && (
              <div className="space-y-2">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider block px-1">
                  Previous Reflections
                </span>
                {archivalEntries.map((entry: any) => (
                  <div 
                    key={entry._id || entry.id}
                    className="p-3 rounded-lg bg-surface-container-lowest hover:bg-surface-elevated transition-colors cursor-pointer group border border-hairline-border flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-label-md text-label-md text-text-primary group-hover:text-primary transition-colors font-medium truncate">
                          {entry.title}
                        </h4>
                        <span className="font-code text-label-sm text-text-muted shrink-0 ml-2">
                          {entry.date || (entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '')}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-muted line-clamp-1">
                        {(entry.content || '').replace(/<[^>]*>?/gm, '')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteJournal(entry._id || entry.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-all"
                      title="Delete entry"
                    >
                      <span className="material-symbols-outlined text-[15px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Write Composer Box */}
            <div className="mt-auto pt-2">
              <div className="p-3 rounded-xl bg-surface-container-lowest space-y-2 focus-within:bg-surface-container transition-colors border border-hairline-border">
                <textarea
                  ref={journalInputRef}
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  className="w-full bg-transparent text-text-primary placeholder:text-text-muted font-body-sm text-body-sm outline-none resize-none"
                  placeholder="Jot a spontaneous reflection or thought..."
                  rows={2}
                ></textarea>
                <div className="flex items-center justify-between pt-1 border-t border-hairline-border">
                  <div className="flex items-center gap-1.5 text-text-muted">
                    <button
                      onClick={() => {
                        const moods = ['Deep Calm / Focused', 'Energetic', 'Reflective', 'Productive', 'Grateful'];
                        const next = moods[(moods.indexOf(journalMood) + 1) % moods.length];
                        setJournalMood(next);
                        toast.info(`Mood selected: ${next}`);
                      }}
                      className="hover:text-primary transition-colors p-1 cursor-pointer"
                      title={`Current mood: ${journalMood} (click to cycle)`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">sentiment_satisfied</span>
                    </button>
                    <button
                      onClick={() => {
                        const tags = ['Mindset', 'Architecture', 'Productivity', 'Reflections', 'Health', 'Learning'];
                        const next = tags[(tags.indexOf(journalTag) + 1) % tags.length];
                        setJournalTag(next);
                        toast.info(`Tag selected: #${next}`);
                      }}
                      className="hover:text-primary transition-colors p-1 cursor-pointer"
                      title={`Current tag: #${journalTag} (click to cycle)`}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">tag</span>
                    </button>
                    <span className="font-code text-[11px] text-text-muted">
                      #{journalTag}
                    </span>
                  </div>
                  <button
                    onClick={handleRecordJournal}
                    className="px-3 py-1 rounded-full bg-surface-container-high hover:bg-primary hover:text-on-primary text-text-primary font-label-sm text-label-sm transition-all cursor-pointer font-medium"
                    type="button"
                  >
                    Record
                  </button>
                </div>
              </div>
            </div>

          </section>

        </div>

      </div>

      {/* Task Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Create Task</h3>
              <button onClick={() => setTaskModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveTaskModal} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Task Title</label>
                <input
                  value={tTitle}
                  onChange={e => setTTitle(e.target.value)}
                  placeholder="e.g. Raft consensus log RFC"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Priority</label>
                  <select
                    value={tPriority}
                    onChange={e => setTPriority(e.target.value)}
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none text-body-sm"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                  <input
                    value={tCategory}
                    onChange={e => setTCategory(e.target.value)}
                    placeholder="e.g. Engineering"
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none text-body-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Due Date</label>
                <input
                  value={tDueDate}
                  onChange={e => setTDueDate(e.target.value)}
                  placeholder="e.g. Today, Tomorrow, YYYY-MM-DD"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none text-body-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-medium hover:opacity-95"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Habit Modal */}
      {habitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">New Habit</h3>
              <button onClick={() => setHabitModalOpen(false)} className="text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveHabit} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Habit Name</label>
                <input
                  value={hName}
                  onChange={e => setHName(e.target.value)}
                  placeholder="e.g. Morning Hydration & Sunlight"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                  <select
                    value={hCategory}
                    onChange={e => setHCategory(e.target.value)}
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none text-body-sm"
                  >
                    <option value="Study">Study</option>
                    <option value="Gym">Gym</option>
                    <option value="Reading">Reading</option>
                    <option value="Sleep">Sleep</option>
                    <option value="Coding">Coding</option>
                    <option value="Journaling">Journaling</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Days / Wk</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={hTargetDays}
                    onChange={e => setHTargetDays(parseInt(e.target.value) || 7)}
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none text-body-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-on-primary font-medium hover:opacity-95"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
