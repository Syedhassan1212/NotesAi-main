import React, { useState, useEffect } from 'react';
import { useSimpleStorage, STORAGE_KEYS } from '../utils/simpleStorage';
import { useNotes } from '../contexts/NotesContext';

export interface Task { id: number; text: string; completed: boolean; }

type Props = {
  onOpen?: (id: string) => void;
};

export default function Home({ onOpen }: Props) {
  const { notes, syncStatus } = useNotes();
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'split'>('list');
  const [tasks, setTasks] = useSimpleStorage<Task[]>(STORAGE_KEYS.TASKS, []);

  const addTask = (text: string) => {
    const newTask: Task = { id: Date.now(), text, completed: false };
    setTasks([...tasks, newTask]);
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(t => t.id !== id));
  };
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    setCurrentDate(date.toLocaleDateString('en-US', options).toUpperCase());
  }, []);

  const handleCapture = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
      addTask(e.currentTarget.value.trim());
      e.currentTarget.value = '';
    }
  };

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] pb-24 relative overflow-hidden bg-surface text-on-surface pt-margin">
      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-text-tertiary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
              
              <span className="font-code-sm text-code-sm tracking-widest uppercase">/{currentDate}</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              Good morning, Syed Hassan.
            </h1>
          </div>
          <div className="flex items-center gap-space-md bg-surface-container-low px-space-md py-space-sm rounded-xl">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-surface-container-high" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3"></path>
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray={`${progressPercent}, 100`} strokeLinecap="round" strokeWidth="3"></path>
              </svg>
              <span className="absolute font-label-sm text-label-sm font-semibold text-primary">{progressPercent}%</span>
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Weekly Deep Work</span>
              <span className="font-code-sm text-code-sm text-text-tertiary">{completedCount} / {totalCount} tasks completed</span>
            </div>
          </div>
        </div>

        

        <div className="flex flex-wrap items-center justify-between gap-space-md mb-space-lg">
          <div className="flex items-center gap-space-md font-label-md text-label-md">
            <button className="text-on-surface font-semibold flex items-center gap-1">All Entries <span className="font-code-sm text-code-sm text-text-tertiary font-normal">{notes.length}</span></button>
          </div>
          <div className="flex items-center gap-space-xs">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-surface-container-high text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined text-[18px]">checklist</span></button>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-surface-container-high text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined text-[18px]">grid_view</span></button>
            <button onClick={() => setViewMode('split')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'split' ? 'bg-surface-container-high text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined text-[18px]">splitscreen</span></button>
          </div>

          
        </div>

        <div className="grid lg:grid-cols-12 gap-space-xl">
          <div className={`lg:col-span-8 ${viewMode === 'list' ? 'flex flex-col gap-space-lg' : viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-space-md content-start' : 'columns-1 md:columns-2 gap-space-md space-y-space-md'}`}>
            
            {notes.map(note => (
              <div key={note.id} onClick={() => onOpen && onOpen(note.id)} className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-hairline hover:shadow-md transition-shadow cursor-pointer break-inside-avoid inline-block w-full">
                <div className="flex items-center justify-between text-text-tertiary mb-space-sm">
                  <span className="font-code-sm text-code-sm">{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
                <h3 className="font-title-md text-title-md text-on-surface mb-space-xs font-semibold">
                  {note.title || 'Untitled'}
                </h3>
                <p className="font-body-sm text-body-sm text-secondary line-clamp-3">
                  {note.content.replace(/<[^>]*>?/gm, '') || 'No content...'}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-space-xs pt-space-md text-text-tertiary">
                    {note.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/15 font-code-sm text-[11px]">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {notes.length === 0 && <div className="text-text-tertiary py-space-xl text-center">No notes yet. Create one!</div>}
  
          </div>

          <aside className="lg:col-span-4 flex flex-col gap-space-md transition-all duration-300">
            <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm border border-border-hairline">
              <div className="flex items-center justify-between mb-space-md">
                <div className="flex items-center gap-space-xs">
                  <span className="material-symbols-outlined text-[18px] text-primary">target</span>
                  <h2 className="font-title-md text-title-md text-on-surface font-semibold">Daily Anchor</h2>
                </div>
                <span className="font-code-sm text-code-sm text-text-tertiary">{tasks.filter(t=>!t.completed).length} Remaining</span>
              </div>
              
              <div className="space-y-space-sm mb-space-lg">
                {tasks.map(task => (
                  <label key={task.id} className="flex items-start gap-space-sm p-space-sm rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      className="mt-1 rounded text-primary focus:ring-0 cursor-pointer accent-primary" 
                    />
                    <div className="flex-1">
                      <span className={`font-body-md text-body-md transition-colors ${task.completed ? 'text-text-tertiary line-through' : 'text-on-surface group-hover:text-primary'}`}>
                        {task.text}
                      </span>
                    </div>
                    <button 
                      className="opacity-0 group-hover:opacity-100 text-error hover:bg-error-container p-1 rounded transition-all"
                      onClick={(e) => { e.preventDefault(); deleteTask(task.id); }}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </label>
                ))}
              </div>
              <div className="flex items-center gap-space-xs pt-space-xs border-t border-surface-container-low">
                <input 
                  className="flex-1 bg-transparent font-body-sm text-body-sm text-on-surface placeholder:text-text-tertiary focus:outline-none" 
                  placeholder="+ New anchor task..." 
                  type="text"
                  onKeyDown={handleCapture}
                />
                <kbd className="font-code-sm text-[10px] text-text-tertiary bg-surface-container px-1 py-0.5 rounded">⏎</kbd>
              </div>
            </div>
            
            <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between border border-border-hairline">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[18px]">cloud_done</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface">Cloud Vault</span>
                  <span className="font-code-sm text-code-sm text-text-tertiary">End-to-End Encrypted Cloud Sync</span>
                </div>
              </div>
              <span className="font-code-sm text-code-sm text-primary font-medium">{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync Error' : '100% Synced'}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}