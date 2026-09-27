import { useState, useRef, useEffect } from "react";
import { NavLink, Outlet } from "react-router-dom";
import QuickActionModal from "./QuickActionModal";

export default function MeLayout() {
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionTab, setQuickActionTab] = useState<string>("expense");
  const [refreshKey, setRefreshKey] = useState(0);
  const [quickLogDropdownOpen, setQuickLogDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openQuickAction = (tab: string = "expense") => {
    setQuickActionTab(tab);
    setIsQuickActionOpen(true);
    setQuickLogDropdownOpen(false);
  };

  const handleActionSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setQuickLogDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { to: "/me", label: "Overview", exact: true },
    { to: "/me/finance", label: "Finance", exact: false },
    { to: "/me/health", label: "Health", exact: false },
    { to: "/me/learning", label: "Learning", exact: false },
    { to: "/me/life", label: "Life", exact: false },
  ];

  return (
    <div className="w-full min-h-screen bg-surface-container-lowest text-on-surface">
      {/* Subnav Bar (Obsidian Airy 48px Sub-header) */}
      <div className="sticky top-16 z-40 w-full bg-surface-container-lowest/80 backdrop-blur-lg border-b border-hairline-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-12 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg font-label-md text-label-md transition-colors shrink-0 ${
                    isActive
                      ? "bg-surface-container text-primary font-medium"
                      : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="relative flex items-center shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setQuickLogDropdownOpen(!quickLogDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity cursor-pointer shadow-xs active:scale-95"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Quick Log</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {quickLogDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 py-1.5 bg-surface-card border border-hairline-border rounded-xl shadow-2xl z-50">
                <button
                  onClick={() => openQuickAction("expense")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">payments</span>
                  <span>Log Expense</span>
                </button>
                <button
                  onClick={() => openQuickAction("income")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-secondary">arrow_downward</span>
                  <span>Add Income</span>
                </button>
                <button
                  onClick={() => openQuickAction("goal")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">flag</span>
                  <span>New Goal</span>
                </button>
                <div className="my-1 border-t border-hairline-border" />
                <button
                  onClick={() => openQuickAction("task")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">check_circle</span>
                  <span>New Task</span>
                </button>
                <button
                  onClick={() => openQuickAction("habit")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">bolt</span>
                  <span>Log Habit</span>
                </button>
                <button
                  onClick={() => openQuickAction("journal")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">edit_note</span>
                  <span>Write Journal</span>
                </button>
                <div className="my-1 border-t border-hairline-border" />
                <button
                  onClick={() => openQuickAction("workout")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">fitness_center</span>
                  <span>Log Workout</span>
                </button>
                <button
                  onClick={() => openQuickAction("study")}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px] text-text-muted">school</span>
                  <span>Record Study</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Outlet Container */}
      <div className="w-full">
        <Outlet context={{ openQuickAction, refreshKey, onRefresh: handleActionSuccess }} />
      </div>

      {/* Global Quick Action Modal */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onSuccess={handleActionSuccess}
        initialTab={quickActionTab}
      />
    </div>
  );
}
