import React, { useState, useEffect, useMemo } from 'react';
import { meApi } from '../../utils/meApi';
import { toast } from 'sonner';
import { useOutletContext } from 'react-router-dom';

interface OutletContextType {
  openQuickAction: (tab?: string) => void;
  refreshKey: number;
  onRefresh: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Food: 'local_mall',
  Transport: 'directions_car',
  Education: 'menu_book',
  Gym: 'fitness_center',
  Shopping: 'shopping_cart',
  Entertainment: 'confirmation_number',
  Bills: 'receipt',
  Subscriptions: 'subscriptions',
  Software: 'cloud',
  Other: 'payments',
  Salary: 'work',
  Freelance: 'laptop_mac',
  Investment: 'trending_up',
  Gift: 'featured_seasonal_and_gifts'
};

export default function FinancePage() {
  const { openQuickAction, refreshKey } = useOutletContext<OutletContextType>();

  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMethod, setSelectedMethod] = useState('All Methods');
  const [selectedDateRange, setSelectedDateRange] = useState('This Month');

  // New Goal modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalCurrent, setGoalCurrent] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('2028');

  // New Budget modal
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('Food');
  const [budgetLimit, setBudgetLimit] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [expRes, incRes, budRes, goalRes] = await Promise.all([
        meApi.getExpenses(),
        meApi.getIncome(),
        meApi.getBudgets(),
        meApi.getGoals()
      ]);
      setExpenses(expRes || []);
      setIncome(incRes || []);
      setBudgets(budRes || []);
      setGoals(goalRes || []);
    } catch (err: any) {
      console.error('Failed to load finance data:', err);
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Calculations on REAL user data
  const totalExpense = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalIncome = income.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const balance = totalIncome - totalExpense;
  const netSaved = balance;
  const savingsRate = totalIncome > 0 ? Math.round((netSaved / totalIncome) * 100) : 0;

  // Real income source categories breakdown
  const incomeSources = useMemo(() => {
    const map: Record<string, number> = {};
    income.forEach(i => {
      const src = i.source || 'Other';
      map[src] = (map[src] || 0) + (Number(i.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [income]);

  // Days left in current month cycle
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - now.getDate());

  // Real user budgets with real category expense sums
  const calculatedBudgets = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(e => (e.category || '').toLowerCase() === (b.category || '').toLowerCase())
        .reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const limit = Number(b.monthlyLimit) || 1;
      const pct = Math.min(100, Math.round((spent / limit) * 100));
      return {
        _id: b._id,
        category: b.category,
        spent,
        limit,
        pct,
        left: Math.max(0, limit - spent),
        isNearLimit: pct >= 90
      };
    });
  }, [budgets, expenses]);

  // Combined real transactions for ledger
  const transactions = useMemo(() => {
    const expTx = expenses.map(e => ({
      id: `exp-${e._id}`,
      type: 'expense',
      date: e.date || (e.createdAt ? new Date(e.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      description: e.description || `${e.category} purchase`,
      category: e.category || 'Other',
      method: e.paymentMethod || 'Debit Card',
      account: e.account || 'Wallet',
      amount: -Math.abs(Number(e.amount)),
      rawId: e._id
    }));

    const incTx = income.map(i => ({
      id: `inc-${i._id}`,
      type: 'income',
      date: i.date || (i.createdAt ? new Date(i.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
      description: i.notes || `${i.source || 'Income'} received`,
      category: 'Income',
      method: i.recurring ? 'Recurring' : 'One-time',
      account: i.account || 'Checking',
      amount: Math.abs(Number(i.amount)),
      rawId: i._id
    }));

    return [...incTx, ...expTx].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, income]);

  // Filtered transactions
  const filteredTransactions = transactions.filter(t => {
    if (selectedCategory !== 'All' && t.category.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchCat = t.category.toLowerCase().includes(q);
      const matchAcc = (t.account || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchAcc) return false;
    }
    return true;
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.info('No transactions to export');
      return;
    }
    const headers = ['Date', 'Description', 'Category', 'Method', 'Account', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.method,
      t.account,
      t.amount
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Ledger exported to CSV');
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) {
      toast.error('Title and target amount are required');
      return;
    }
    try {
      await meApi.createGoal({
        title: goalTitle,
        targetAmount: Number(goalTarget),
        currentAmount: Number(goalCurrent) || 0,
        deadline: goalDeadline,
      });
      toast.success('Goal created');
      setGoalModalOpen(false);
      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create goal');
    }
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLimit) {
      toast.error('Limit is required');
      return;
    }
    try {
      await meApi.saveBudget({
        category: budgetCategory,
        monthlyLimit: Number(budgetLimit)
      });
      toast.success('Budget saved');
      setBudgetModalOpen(false);
      setBudgetLimit('');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save budget');
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-12 py-8 space-y-10">
        
        {/* Top Sub-header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-text-muted font-code text-code tracking-wide">
              <span className="hover:text-primary transition-colors cursor-pointer">/me</span>
              <span>/</span>
              <span className="text-primary font-medium">finance</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block ml-1"></span>
            </div>
            <h1 className="font-display text-display text-text-primary tracking-tight">Finance & Wealth Engine</h1>
            <p className="font-body-md text-body-md text-text-muted max-w-xl">
              Cashflow, categorical budgets, transactions, and long-term targets.
            </p>
          </div>

          {/* Action Cluster */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setGoalModalOpen(true)}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-elevated text-text-primary font-label-md text-label-md shadow-sm transition-all cursor-pointer border border-hairline-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-text-muted group-hover:text-primary transition-colors">flag</span>
              <span>New Goal</span>
            </button>
            <button
              onClick={() => openQuickAction('income')}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-high hover:bg-surface-elevated text-text-primary font-label-md text-label-md shadow-sm transition-all cursor-pointer border border-hairline-border"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary transition-transform group-hover:scale-110">arrow_downward</span>
              <span>Add Income</span>
            </button>
            <button
              onClick={() => openQuickAction('expense')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary-container hover:opacity-90 text-on-secondary-container font-label-md text-label-md shadow-md transition-all active:scale-95 cursor-pointer font-semibold"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* 4 High-Density Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <div className="bg-surface-card rounded-xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between group hover:bg-surface-card-hover transition-colors border border-hairline-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Current Balance</span>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Rs {balance.toLocaleString()}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-text-primary">
                <span className="material-symbols-outlined text-[18px]">account_balance</span>
              </div>
            </div>
            <div className="pt-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>
                {savingsRate}% saved
              </span>
              <span className="font-body-sm text-body-sm text-text-muted">Net cash position</span>
            </div>
          </div>

          {/* Monthly Income */}
          <div className="bg-surface-card rounded-xl p-5 shadow-sm flex flex-col justify-between group hover:bg-surface-card-hover transition-colors border border-hairline-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Monthly Inflow</span>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Rs {totalIncome.toLocaleString()}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[18px]">payments</span>
              </div>
            </div>
            <div className="pt-4 space-y-1.5">
              {incomeSources.length > 0 ? (
                incomeSources.slice(0, 2).map(([src, amt]) => (
                  <div key={src} className="flex justify-between items-center font-body-sm text-body-sm">
                    <span className="text-text-muted">{src}</span>
                    <span className="text-text-secondary font-code">Rs {amt.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <div className="font-body-sm text-body-sm text-text-muted">No income logged this month</div>
              )}
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-surface-card rounded-xl p-5 shadow-sm flex flex-col justify-between group hover:bg-surface-card-hover transition-colors border border-hairline-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Monthly Outflow</span>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  Rs {totalExpense.toLocaleString()}
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-text-primary">
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-text-muted">
                <span className="material-symbols-outlined text-[15px] text-text-secondary">timelapse</span>
                <span>{daysLeft} days left in cycle</span>
              </div>
              <span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-text-secondary">
                {expenses.length} logs
              </span>
            </div>
          </div>

          {/* Net Savings Rate */}
          <div className="bg-surface-card rounded-xl p-5 shadow-sm flex flex-col justify-between group hover:bg-surface-card-hover transition-colors border border-hairline-border">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">Net Savings Rate</span>
                <div className="font-headline-lg text-headline-lg text-text-primary tracking-tight">
                  {savingsRate}%
                </div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[18px]">savings</span>
              </div>
            </div>
            <div className="pt-4 flex items-center justify-between">
              <span className="font-body-sm text-body-sm text-text-muted">Net Saved</span>
              <span className="font-code text-code text-text-primary font-medium">
                Rs {netSaved.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Middle Section: Budgets & Long-term Targets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Category Budgets Column (7 cols) */}
          <div className="lg:col-span-7 bg-surface-card rounded-xl p-6 shadow-sm space-y-6 border border-hairline-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                <h2 className="font-label-sm text-label-sm text-text-secondary uppercase tracking-widest font-semibold">Category Budgets</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm text-text-muted">Monthly Cap Allocation</span>
                <button 
                  onClick={() => setBudgetModalOpen(true)}
                  className="w-6 h-6 rounded-md bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  title="Add Budget"
                >
                  <span className="material-symbols-outlined text-[14px]">add</span>
                </button>
              </div>
            </div>

            {calculatedBudgets.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                No monthly budgets set yet. Click "+" above to allocate category limits.
              </div>
            ) : (
              <div className="space-y-5">
                {calculatedBudgets.map((b) => {
                  const icon = CATEGORY_ICONS[b.category] || 'local_mall';
                  return (
                    <div key={b._id || b.category} className={`space-y-2 p-3 rounded-lg transition-colors ${b.isNearLimit ? 'bg-surface-container-low' : 'hover:bg-surface-container-low'}`}>
                      <div className="flex items-center justify-between font-label-md text-label-md">
                        <div className="flex items-center gap-2">
                          <span className={`material-symbols-outlined text-[16px] ${b.isNearLimit ? 'text-error' : 'text-text-secondary'}`}>
                            {b.isNearLimit ? 'cloud' : icon}
                          </span>
                          <span className="text-text-primary font-medium">{b.category}</span>
                          {b.isNearLimit && (
                            <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm inline-flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">warning</span>
                              Near Limit
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 font-code text-code">
                          <span className={b.isNearLimit ? 'text-error font-semibold' : 'text-text-primary'}>
                            Rs {b.spent.toLocaleString()}
                          </span>
                          <span className="text-text-muted">/ Rs {b.limit.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${b.isNearLimit ? 'bg-error' : 'bg-text-primary'}`} 
                          style={{ width: `${b.pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center font-body-sm text-body-sm text-text-muted pt-0.5">
                        <span className={b.isNearLimit ? 'text-error' : ''}>{b.pct}% consumed</span>
                        <span className={`font-code ${b.isNearLimit ? 'text-error' : ''}`}>Rs {b.left.toLocaleString()} left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Goals Column (5 cols) */}
          <div className="lg:col-span-5 bg-surface-card rounded-xl p-6 shadow-sm space-y-6 border border-hairline-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <h2 className="font-label-sm text-label-sm text-text-secondary uppercase tracking-widest font-semibold">Financial Goals</h2>
              </div>
              <span className="font-label-sm text-label-sm text-text-muted">Long-Term Milestones</span>
            </div>

            {goals.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-surface-container-low border border-hairline-border text-text-muted font-body-sm">
                No goals created yet. Click "New Goal" above to start tracking milestones.
              </div>
            ) : (
              <div className="space-y-4">
                {goals.map((g: any, idx: number) => {
                  const target = Number(g.targetAmount) || 1;
                  const current = Number(g.currentAmount) || 0;
                  const pct = Math.min(100, Math.round((current / target) * 100));
                  const isSecondary = idx === 0;

                  return (
                    <div key={g._id || idx} className="bg-surface-elevated rounded-xl p-5 shadow-sm space-y-4 hover:bg-surface-container-high transition-colors border border-hairline-border">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-headline-sm text-headline-sm text-text-primary font-semibold">{g.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container text-text-muted font-label-sm text-label-sm">
                              {g.deadline || 'Target'}
                            </span>
                          </div>
                          <p className="font-body-sm text-body-sm text-text-muted mt-0.5">
                            {g.notes || (g.monthlyContribution ? `Monthly allocation: Rs ${Number(g.monthlyContribution).toLocaleString()}/mo` : 'Milestone target')}
                          </p>
                        </div>
                        <span className="font-headline-sm text-headline-sm text-text-primary font-code">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${isSecondary ? 'bg-secondary-container' : 'bg-text-primary'}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center font-code text-code">
                        <div>
                          <span className="text-text-muted text-[11px] block uppercase">CURRENT</span>
                          <span className="text-text-primary">Rs {current.toLocaleString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-text-muted text-[11px] block uppercase">TARGET</span>
                          <span className="text-text-secondary">Rs {target.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Section: Ledger */}
        <div className="bg-surface-card rounded-xl shadow-sm p-6 space-y-6 border border-hairline-border">
          {/* Ledger Header & Controls */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-text-primary font-semibold">Expenses & Cash Flow Ledger</h2>
                <p className="font-body-sm text-body-sm text-text-muted">Comprehensive transaction audit trail with category telemetry.</p>
              </div>
              {/* Secondary quick actions */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-elevated text-text-muted hover:text-text-primary font-label-md text-label-md transition-colors cursor-pointer border border-hairline-border" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
                {['All', 'Food', 'Transport', 'Education', 'Gym', 'Shopping', 'Entertainment', 'Bills', 'Software'].map(cat => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-full font-label-sm text-label-sm shrink-0 transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-text-primary text-surface-container-lowest font-medium'
                          : 'bg-surface-container hover:bg-surface-container-high text-text-secondary hover:text-text-primary'
                      }`}
                      type="button"
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Search & Select Dropdowns */}
              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined text-[16px] text-text-muted absolute left-3 pointer-events-none">search</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-surface-container-low text-text-primary font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-lg outline-none focus:bg-surface-container-high placeholder:text-text-muted transition-colors w-44 sm:w-56 border border-hairline-border"
                    placeholder="Search entries..."
                    type="text"
                  />
                </div>

                {/* Date Range Filter Pill */}
                <button 
                  onClick={() => setSelectedDateRange(prev => prev === 'This Month' ? 'All Time' : 'This Month')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-text-secondary font-label-md text-label-md transition-colors cursor-pointer border border-hairline-border" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  <span>{selectedDateRange}</span>
                </button>

                {/* Payment Method Filter Pill */}
                <button 
                  onClick={() => setSelectedMethod(prev => prev === 'All Methods' ? 'Cards Only' : 'All Methods')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-text-secondary font-label-md text-label-md transition-colors cursor-pointer border border-hairline-border" 
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                  <span>{selectedMethod}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-md text-body-md border-collapse">
              <thead>
                <tr className="text-text-muted font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low">
                  <th className="py-3 px-4 rounded-l-lg">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 rounded-r-lg text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-high/40">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-text-muted font-body-sm">
                      No transactions recorded yet. Click "Log Expense" or "Add Income" above to start your ledger.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx: any) => {
                    const isIncome = tx.amount > 0;
                    const icon = isIncome 
                      ? 'work' 
                      : (CATEGORY_ICONS[tx.category] || 'receipt');

                    return (
                      <tr key={tx.id} className="hover:bg-surface-card-hover transition-colors group">
                        <td className="py-3.5 px-4 font-code text-code text-text-muted whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-text-primary whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-6 h-6 rounded-full bg-surface-container flex items-center justify-center ${isIncome ? 'text-secondary' : 'text-text-muted'}`}>
                              <span className="material-symbols-outlined text-[14px]">{icon}</span>
                            </div>
                            <span>{tx.description}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full font-label-sm text-label-sm ${
                            isIncome 
                              ? 'bg-surface-container text-secondary' 
                              : 'bg-surface-container text-text-secondary'
                          }`}>
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                          {tx.method}
                        </td>
                        <td className="py-3.5 px-4 font-code text-code text-text-muted whitespace-nowrap">
                          {tx.account}
                        </td>
                        <td className={`py-3.5 px-4 text-right font-code text-code font-medium whitespace-nowrap ${
                          isIncome ? 'text-secondary' : 'text-error'
                        }`}>
                          {isIncome ? `+Rs ${tx.amount.toLocaleString()}` : `-Rs ${Math.abs(tx.amount).toLocaleString()}`}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button 
                            onClick={async () => {
                              if (tx.rawId) {
                                try {
                                  if (tx.type === 'expense') await meApi.deleteExpense(tx.rawId);
                                  else await meApi.deleteIncome(tx.rawId);
                                  toast.success('Transaction removed');
                                  loadData();
                                } catch (e: any) {
                                  toast.error('Failed to delete transaction');
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-opacity cursor-pointer" 
                            type="button"
                            title="Delete entry"
                          >
                            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 text-text-muted font-body-sm text-body-sm">
            <div>
              Showing <span className="text-text-primary font-medium">{filteredTransactions.length > 0 ? 1 : 0}-{Math.min(filteredTransactions.length, 10)}</span> of <span className="text-text-primary font-medium">{filteredTransactions.length}</span> transactions
            </div>
            <div className="flex items-center gap-1.5 self-center">
              <button className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-text-primary flex items-center justify-center transition-colors disabled:opacity-40" disabled type="button">
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="px-3 py-1 rounded-lg bg-surface-container-high text-text-primary font-code text-code">1</span>
              <button className="w-8 h-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-text-muted hover:text-text-primary flex items-center justify-center transition-colors disabled:opacity-40" disabled={filteredTransactions.length <= 10} type="button">
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Goal Modal */}
      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Create Financial Goal</h3>
              <button onClick={() => setGoalModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Goal Name</label>
                <input
                  value={goalTitle}
                  onChange={e => setGoalTitle(e.target.value)}
                  placeholder="e.g. Master's Fund"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Amount (Rs)</label>
                  <input
                    type="number"
                    value={goalTarget}
                    onChange={e => setGoalTarget(e.target.value)}
                    placeholder="1500000"
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                    required
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-text-muted mb-1">Current Amount (Rs)</label>
                  <input
                    type="number"
                    value={goalCurrent}
                    onChange={e => setGoalCurrent(e.target.value)}
                    placeholder="420000"
                    className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Target Year / Deadline</label>
                <input
                  value={goalDeadline}
                  onChange={e => setGoalDeadline(e.target.value)}
                  placeholder="2028"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGoalModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container text-text-secondary hover:text-text-primary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-surface-card border border-hairline-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Set Monthly Budget</h3>
              <button onClick={() => setBudgetModalOpen(false)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Category</label>
                <select
                  value={budgetCategory}
                  onChange={e => setBudgetCategory(e.target.value)}
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                >
                  {['Food', 'Transport', 'Education', 'Gym', 'Shopping', 'Entertainment', 'Bills', 'Subscriptions', 'Software', 'Other'].map(c => (
                    <option key={c} value={c} className="bg-surface-card">{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-text-muted mb-1">Monthly Spending Limit (Rs)</label>
                <input
                  type="number"
                  value={budgetLimit}
                  onChange={e => setBudgetLimit(e.target.value)}
                  placeholder="15000"
                  className="w-full bg-surface-container-low text-text-primary px-3 py-2 rounded-lg border border-hairline-border outline-none focus:border-primary text-body-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="px-4 py-1.5 rounded-full bg-surface-container text-text-secondary hover:text-text-primary font-label-md text-label-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-semibold cursor-pointer"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
