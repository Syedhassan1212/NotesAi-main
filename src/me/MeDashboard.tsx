import { useEffect, useState, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { meApi } from "../utils/meApi";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

export default function MeDashboard() {
  const { openQuickAction, refreshKey, onRefresh } = useOutletContext<OutletContextType>();
  const { username } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [currentDateStr, setCurrentDateStr] = useState("");

  useEffect(() => {
    const d = new Date();
    const formatted = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
    setCurrentDateStr(formatted);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await meApi.getOverview();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load overview:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const toggleTask = async (task: any) => {
    const taskId = task._id || task.id;
    const isCompleted = task.completed || task.status === "Completed";
    try {
      await meApi.updateTask(taskId, {
        completed: !isCompleted,
        status: isCompleted ? "Todo" : "Completed"
      });
      loadData();
      onRefresh();
    } catch (err: any) {
      toast.error("Failed to update task");
    }
  };

  // Last 7 days date strings for habit matrix
  const past7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-text-muted">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="font-label-md text-label-md">Loading real-time command center...</span>
      </div>
    );
  }

  const { today, finance, health, learning, recentActivity } = data || {
    today: {},
    finance: {},
    health: {},
    learning: {},
    
    recentActivity: []
  };

  // Real data calculations
  const todaySpent = Number(today?.spent) || 0;
  const tasksRemaining = Number(today?.tasksRemaining) || 0;
  const studyMinutes = Number(today?.studyMinutes) || 0;
  const studyHours = Math.floor(studyMinutes / 60);
  const studyMins = studyMinutes % 60;
  const habitsCompleted = Number(today?.habitsCompleted) || 0;
  const totalHabits = Number(today?.totalHabits) || 0;
  const habitPercent = totalHabits > 0 ? Math.round((habitsCompleted / totalHabits) * 100) : 0;

  const currentBalance = Number(finance?.currentBalance) || 0;
  const monthlyInflow = Number(finance?.monthlyIncome) || 0;
  const monthlyOutflow = Number(finance?.monthlyExpenses) || 0;
  const netSavingsRate = Number(finance?.savingsRate) || 0;

  const currentWeight = health?.currentWeight;
  const weightChange = health?.weightChange;
  const startingWeight = health?.startingWeight;

  const criticalTasks = data?.criticalTasks || [];
  const activeCourses = data?.activeCourses || [];
  const activeProjects = data?.activeProjects || [];
  const topBudget = data?.topBudget;
  const topGoal = data?.topGoal;
  const habitsList = data?.habits || [];
  const recentJournal = data?.recentJournal;
  const timelineItems = recentActivity || [];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-12 py-8 space-y-10">
        
        {/* HEADER / COMMAND GREETING */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-code text-label-sm text-text-muted tracking-wider uppercase">Personal OS // Command Center</span>
              <span className="w-1 h-1 rounded-full bg-surface-variant"></span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-low text-text-secondary font-code text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>MongoDB Sync • User {username || "Personal OS"}</span>
              </div>
            </div>
            <h1 className="font-display text-display text-text-primary tracking-tight">
              Good morning, {username ? username.charAt(0).toUpperCase() + username.slice(1) : "Welcome"}.
            </h1>
            <p className="font-body-md text-text-secondary max-w-xl">
              Overview of your four operational pillars: Finance, Health, Learning, and Daily Routine.
            </p>
          </div>

          {/* Quick Action Pill Dock */}
          <div className="flex items-center flex-wrap gap-2 p-1.5 rounded-full bg-surface-card shadow-sm self-start lg:self-auto border border-hairline-border">
            <button 
              onClick={() => openQuickAction("expense")} 
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">payments</span>
              <span>Expense</span>
            </button>
            <button 
              onClick={() => openQuickAction("task")} 
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">check_circle</span>
              <span>Task</span>
            </button>
            <button 
              onClick={() => openQuickAction("study")} 
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">school</span>
              <span>Study</span>
            </button>
            <button 
              onClick={() => openQuickAction("workout")} 
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container-high transition-colors font-label-md text-label-md text-text-primary cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">fitness_center</span>
              <span>Workout</span>
            </button>
            <button 
              onClick={() => openQuickAction("journal")} 
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md shadow-sm font-semibold cursor-pointer" 
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Journal</span>
            </button>
          </div>
        </header>

        {/* SECTION 1: TODAY AT A GLANCE (5 Balanced Metric Strips) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Today at a Glance</span>
            <span className="font-code text-body-sm text-text-muted">{currentDateStr}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Metric 1: Finance Spent */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Daily Spend</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">wallet</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-text-primary tracking-tight">
                  ₹{todaySpent.toLocaleString()}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  <span className="truncate">
                    {topBudget 
                      ? `₹${Math.max(0, topBudget.monthlyLimit - topBudget.spent).toLocaleString()} left of budget` 
                      : "Logged today"}
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${topBudget ? topBudget.pct : (todaySpent > 0 ? 100 : 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 2: Tasks */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Critical Tasks</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">task_alt</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-text-primary tracking-tight">
                  {tasksRemaining} open
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container shrink-0"></span>
                  <span className="truncate">
                    {criticalTasks.filter((t: any) => t.priority === "Critical" || t.priority === "High").length} high priority
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${tasksRemaining === 0 ? 100 : 40}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 3: Study Time */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Deep Focus</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">timer</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-text-primary tracking-tight">
                  {studyHours}h {studyMins}m
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  <span className="truncate">{learning?.weeklyStudyHours || 0}h this week</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.round((studyMinutes / 180) * 100))}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 4: Workout */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Workout</span>
                <span className="material-symbols-outlined text-[18px] text-primary">
                  {today?.workedOutToday ? "done" : "fitness_center"}
                </span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-text-primary tracking-tight">
                  {today?.workedOutToday ? "Completed" : "Pending"}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary truncate mt-0.5">
                  {health?.recentWorkout 
                    ? `${health.recentWorkout.workoutType} • ${health.recentWorkout.duration}m`
                    : "No workout today"}
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${today?.workedOutToday ? 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Metric 5: Habits */}
            <div className="p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors flex flex-col justify-between space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted">Habits</span>
                <span className="material-symbols-outlined text-[18px] text-text-secondary">checklist_rtl</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-text-primary tracking-tight">
                  {habitsCompleted} of {totalHabits}
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                  <span>{habitPercent}% day score</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-secondary h-full rounded-full transition-all duration-500" 
                  style={{ width: `${habitPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* MAIN TWO-COLUMN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Life, Learning, and Activity Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* CARD: Critical Tasks */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-5 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Critical Tasks</h2>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-code text-label-sm text-text-muted">
                    {criticalTasks.length} open
                  </span>
                </div>
                <Link to="/me/life" className="font-label-md text-label-md text-text-muted hover:text-text-primary transition-colors flex items-center gap-1">
                  <span>View all</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>

              {criticalTasks.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                  No open tasks right now. Click "+ Task" above to add one.
                </div>
              ) : (
                <div className="space-y-2">
                  {criticalTasks.map((task: any) => {
                    const isDone = task.completed || task.status === "Completed";
                    const priority = task.priority || "Medium";
                    return (
                      <div 
                        key={task._id || task.id}
                        className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
                          isDone ? "bg-surface-container-low/50 opacity-60" : "bg-surface-container-low hover:bg-surface-container"
                        } border border-hairline-border`}
                      >
                        <button 
                          onClick={() => toggleTask(task)}
                          className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            isDone 
                              ? "bg-primary text-on-primary" 
                              : "bg-surface-container-high text-transparent hover:text-text-primary"
                          }`}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[13px]">check</span>
                        </button>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-body-md text-text-primary font-medium truncate ${isDone ? "line-through text-text-muted" : ""}`}>
                              {task.title || task.text}
                            </span>
                            <span className={`shrink-0 px-2 py-0.5 rounded font-code text-label-sm font-semibold ${
                              priority === "Critical" || priority === "High"
                                ? "bg-surface-variant text-text-primary"
                                : priority === "Medium"
                                ? "bg-surface-container text-text-secondary"
                                : "bg-surface-container text-text-muted"
                            }`}>
                              {priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 font-code text-label-sm text-text-muted">
                            <span className="text-secondary font-medium">#{task.category || "General"}</span>
                            <span>•</span>
                            <span>Due {task.dueDate || "Today"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CARD: Learning & Active Projects */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-5 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">terminal</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Active Projects & Curricula</h2>
                </div>
                <span className="font-code text-label-sm text-text-muted">
                  {activeCourses.length + activeProjects.length} Active
                </span>
              </div>

              {activeCourses.length === 0 && activeProjects.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                  No active courses or projects. Track study sessions and projects under <Link to="/me/learning" className="text-primary underline">Learning</Link>.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeCourses.map((c: any) => (
                    <div key={c._id || c.id} className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-4 border border-hairline-border">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full font-code text-label-sm bg-surface-container text-secondary">Coursework</span>
                          <span className="font-code text-label-sm text-text-muted">{c.status || "In Progress"}</span>
                        </div>
                        <h3 className="font-body-lg text-body-lg font-semibold text-text-primary line-clamp-1">
                          {c.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                          {c.notes || c.provider || "Course tracking in progress"}
                        </p>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between font-code text-label-sm">
                          <span className="text-text-muted">Completion</span>
                          <span className="text-text-primary font-semibold">{c.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-secondary h-full rounded-full" style={{ width: `${c.progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {activeProjects.map((p: any) => (
                    <div key={p._id || p.id} className="p-4 rounded-xl bg-surface-container-low flex flex-col justify-between space-y-4 border border-hairline-border">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded-full font-code text-label-sm bg-surface-container text-primary">Project</span>
                          <span className="font-code text-label-sm text-text-muted">{p.status || "In Progress"}</span>
                        </div>
                        <h3 className="font-body-lg text-body-lg font-semibold text-text-primary line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="font-body-sm text-body-sm text-text-secondary line-clamp-2">
                          {p.description || "Active project lab"}
                        </p>
                      </div>
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between font-code text-label-sm">
                          <span className="text-text-muted">Progress</span>
                          <span className="text-text-primary font-semibold">{p.progress || 0}%</span>
                        </div>
                        <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${p.progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CARD: Unified Activity Timeline */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-5 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">history</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Activity Timeline</h2>
                </div>
                <span className="font-code text-label-sm text-text-muted">Realtime stream</span>
              </div>

              {timelineItems.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                  No activity recorded yet. As you log expenses, tasks, habits, and sessions, your timeline updates automatically.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-surface-variant">
                  {timelineItems.map((item: any, idx: number) => {
                    const title = item.action || item.title;
                    const subtitle = item.detail ? `· ${item.detail}` : "";
                    const time = item.time || (item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Today");
                    const dotColor = idx === 0 ? "bg-secondary" : idx === 1 ? "bg-primary" : "bg-surface-variant";

                    return (
                      <div key={item.id || idx} className="relative group">
                        <span className={`absolute -left-6 top-1 w-2 h-2 rounded-full ${dotColor} group-hover:scale-125 transition-transform`}></span>
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="font-body-md text-text-primary">
                            <span className="font-medium">{title}</span>
                            <span className="text-text-secondary"> {subtitle}</span>
                          </div>
                          <span className="font-code text-label-sm text-text-muted shrink-0">{time}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: Finance, Health, Habits, Journal (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* CARD: Finance Snapshot */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-6 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">account_balance</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Finance Pillar</h2>
                </div>
                <Link to="/me/finance" className="font-label-md text-label-md text-text-muted hover:text-text-primary transition-colors flex items-center gap-0.5">
                  <span>Ledger</span>
                  <span className="material-symbols-outlined text-[14px]">north_east</span>
                </Link>
              </div>

              {/* Total Balance Hero Block */}
              <div className="p-4 rounded-xl bg-surface-container-low space-y-3 border border-hairline-border">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Net Liquid Balance</span>
                <div className="flex items-baseline justify-between">
                  <div className="font-display text-headline-lg text-text-primary tracking-tight">
                    ₹{currentBalance.toLocaleString()}
                  </div>
                  <span className="font-code text-body-sm text-secondary font-medium">{netSavingsRate}% saved</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2.5 rounded-lg bg-surface-card border border-hairline-border">
                    <span className="font-code text-label-sm text-text-muted block">Income</span>
                    <span className="font-headline-sm text-headline-sm text-text-primary mt-0.5 block">
                      ₹{monthlyInflow.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-card border border-hairline-border">
                    <span className="font-code text-label-sm text-text-muted block">Outflow</span>
                    <span className="font-headline-sm text-headline-sm text-text-primary mt-0.5 block">
                      ₹{monthlyOutflow.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Budget Warning Component */}
              {topBudget ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline font-body-sm">
                    <span className="text-text-secondary">{topBudget.category} (Monthly)</span>
                    <span className="font-code text-label-sm text-text-primary">
                      ₹{topBudget.spent.toLocaleString()} / ₹{topBudget.monthlyLimit.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${topBudget.pct >= 90 ? 'bg-error' : 'bg-secondary-container'}`} 
                      style={{ width: `${topBudget.pct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between font-code text-label-sm text-text-muted">
                    <span>{topBudget.pct}% consumed</span>
                    <span>₹{Math.max(0, topBudget.monthlyLimit - topBudget.spent).toLocaleString()} left</span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-surface-container-low border border-hairline-border text-text-muted font-body-sm text-center">
                  No monthly budget set. Configure one in <Link to="/me/finance" className="text-primary underline">Finance</Link>.
                </div>
              )}

              {/* Active Goal Subcard */}
              {topGoal ? (
                <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between border border-hairline-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-text-secondary">flag</span>
                      <span className="font-label-md text-label-md text-text-primary font-medium">{topGoal.title}</span>
                    </div>
                    <span className="font-code text-label-sm text-text-muted">
                      ₹{(topGoal.currentAmount || 0).toLocaleString()} of ₹{(topGoal.targetAmount || 0).toLocaleString()} target
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-code text-label-md text-text-primary font-semibold block">
                      {topGoal.targetAmount > 0 ? Math.min(100, Math.round(((topGoal.currentAmount || 0) / topGoal.targetAmount) * 100)) : 0}%
                    </span>
                    <span className="font-code text-label-sm text-text-muted block">Target: {topGoal.deadline || "2028"}</span>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm text-center">
                  No financial goals set.
                </div>
              )}
            </div>

            {/* CARD: Health & Body Metric with SVG Sparkline */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-5 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">monitor_weight</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Health & Recovery</h2>
                </div>
                <span className="font-code text-label-sm text-secondary">
                  {health?.weeklyWorkoutsCount ? `${health.weeklyWorkoutsCount} workouts this wk` : "Tracked"}
                </span>
              </div>

              {currentWeight ? (
                <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4 border border-hairline-border">
                  <div>
                    <span className="font-label-sm text-label-sm text-text-muted block">Morning Weight</span>
                    <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight mt-0.5">
                      {currentWeight} <span className="text-headline-sm font-normal text-text-secondary">kg</span>
                    </div>
                    {startingWeight && (
                      <span className="font-code text-label-sm text-text-secondary block mt-1">
                        {weightChange > 0 ? `+${weightChange}` : weightChange} kg from {startingWeight} kg start
                      </span>
                    )}
                  </div>

                  <div className="w-28 h-10 flex flex-col justify-end">
                    <svg className="w-full h-8 text-secondary" fill="none" preserveAspectRatio="none" viewBox="0 0 100 30">
                      <path d="M 0,25 Q 30,20 60,15 T 100,5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.5"></path>
                      <circle className="fill-primary" cx="100" cy="5" r="3.5"></circle>
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm text-center">
                  No morning weight logged yet. Log in <Link to="/me/health" className="text-primary underline">Health</Link>.
                </div>
              )}

              {health?.recentWorkout ? (
                <div className="p-3.5 rounded-xl bg-surface-container-low flex items-center justify-between text-body-sm border border-hairline-border">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">fitness_center</span>
                    <span className="text-text-primary font-medium">Recent: {health.recentWorkout.workoutType}</span>
                  </div>
                  <span className="font-code text-label-sm text-text-secondary">
                    {health.recentWorkout.duration} mins
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm text-center">
                  No workout recorded yet.
                </div>
              )}
            </div>

            {/* CARD: Habit Matrix & Streaks */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-4 border border-hairline-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-text-secondary">event_available</span>
                  <h2 className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-semibold">Habit Matrix</h2>
                </div>
                <span className="font-code text-label-sm text-text-muted">Last 7 Days</span>
              </div>

              {habitsList.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                  No habits configured yet. Create habits in <Link to="/me/life" className="text-primary underline">Life</Link>.
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {habitsList.map((h: any) => {
                    const comps = h.completions || [];
                    const streak = h.streak || 0;
                    return (
                      <div key={h._id || h.id} className="flex items-center justify-between gap-2">
                        <div className="w-28 truncate font-body-sm text-text-primary flex items-center gap-1.5">
                          <span className="truncate">{h.name}</span>
                          <span className="font-code text-[11px] text-secondary font-medium shrink-0">{streak}d</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {past7Days.map((dateStr, dIdx) => {
                            const isDone = comps.some((c: any) => c.date === dateStr && c.completed);
                            const isToday = dIdx === 6;
                            return (
                              <span 
                                key={dateStr}
                                className={`w-4 h-4 rounded transition-colors ${
                                  isDone 
                                    ? "bg-primary" 
                                    : "bg-surface-container"
                                } ${isToday ? "ring-1 ring-primary/40" : ""}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CARD: Latest Journal Excerpt */}
            <div className="p-6 rounded-2xl bg-surface-card space-y-3 border border-hairline-border">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Morning Reflection</span>
                <span className="px-2 py-0.5 rounded-full font-code text-label-sm bg-surface-container text-secondary">
                  {recentJournal?.mood || "Reflection"}
                </span>
              </div>
              {recentJournal ? (
                <>
                  <blockquote className="font-body-md text-text-secondary italic border-l-2 border-surface-variant pl-3 py-0.5">
                    "{(recentJournal.content || "").replace(/<[^>]*>?/gm, "").slice(0, 160)}..."
                  </blockquote>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-code text-label-sm text-text-muted">
                      {recentJournal.title} • {recentJournal.date}
                    </span>
                    <Link to="/me/life" className="font-label-md text-label-md text-text-primary hover:underline">
                      Full entry →
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                  No reflections logged yet. Click "Journal" above to write an entry.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* QUIET SYSTEM FOOTER */}
        <footer className="pt-8 pb-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-text-muted font-code text-label-sm">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Private & Local Scope • Scoped to authenticated user</span>
          </div>
          <div>
            <span>All personal OS documents isolated and verified</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
