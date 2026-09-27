import { useNotes } from "../../contexts/NotesContext";
import { useState } from 'react';
export type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  createdAt: number;
};

type Props = {
  notes: any[];
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onFilterChange: (value: string) => void;
  filter: string;
}

export default function NotesPage({ 
  notes, 
  onNew, 
  onOpen, 
  onDelete,
  onFilterChange, 
  filter
}: Props) {
  const { syncStatus } = useNotes();
  const [viewMode, setViewMode] = useState<'gallery' | 'list' | 'table'>('gallery');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');

    const uniqueTags = Array.from(new Set(notes.flatMap(n => n.tags || [])));
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(filter.toLowerCase()) ||
    note.content.toLowerCase().includes(filter.toLowerCase()) ||
    note.tags.some((tag: string) => tag.toLowerCase().includes(filter.toLowerCase()))
  );
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'updatedAt') return b.updatedAt - a.updatedAt;
    if (sortBy === 'createdAt') return b.createdAt - a.createdAt;
    return a.title.localeCompare(b.title);
  });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(timestamp));
  };

  const getGridClass = () => {
    switch (viewMode) {
      case 'gallery': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg';
      case 'list': return 'grid grid-cols-1 gap-space-sm';
      case 'table': return 'grid grid-cols-1 md:grid-cols-2 gap-space-md';
      default: return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg';
    }
  };

  return (
<div className="flex flex-col w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 py-space-xl">

<div className="relative w-full mb-space-xl">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">

<div>
<div className="flex items-center gap-space-sm mb-space-xs">
<span className="font-code-sm text-code-sm text-primary uppercase tracking-widest font-medium">Cognitive Vault</span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="font-label-sm text-label-sm text-text-tertiary">Indexed via CoreML</span>
</div>
<div className="flex items-baseline gap-space-sm">
<h1 className="font-display-hero text-display-hero text-text-primary tracking-tight font-semibold">All Notes</h1>
<span className="font-body-md text-body-md text-text-tertiary font-normal" id="note-counter">{notes.length + 6} notes</span>
</div>
</div>

<div className="flex items-center gap-space-sm flex-wrap">

<div className="flex items-center p-1 bg-surface-container-high rounded-full shadow-sm">
<button 
  className={`flex items-center gap-1.5 px-space-md py-1 rounded-full text-label-md transition-all ${viewMode==='gallery'?'bg-surface-container-lowest text-text-primary shadow-sm font-semibold':'text-text-secondary hover:text-text-primary'}`} 
  onClick={()=>setViewMode('gallery')} type="button">
<span className="material-symbols-outlined text-[16px]">grid_view</span>
<span>Gallery</span>
</button>
<button 
  className={`flex items-center gap-1.5 px-space-md py-1 rounded-full text-label-md transition-all ${viewMode==='list'?'bg-surface-container-lowest text-text-primary shadow-sm font-semibold':'text-text-secondary hover:text-text-primary'}`} 
  onClick={()=>setViewMode('list')} type="button">
<span className="material-symbols-outlined text-[16px]">view_agenda</span>
<span>Compact</span>
</button>
<button 
  className={`flex items-center gap-1.5 px-space-md py-1 rounded-full text-label-md transition-all ${viewMode==='table'?'bg-surface-container-lowest text-text-primary shadow-sm font-semibold':'text-text-secondary hover:text-text-primary'}`} 
  onClick={()=>setViewMode('table')} type="button">
<span className="material-symbols-outlined text-[16px]">table_rows</span>
<span>Table</span>
</button>
</div>

<button 
  onClick={onNew}
  className="flex items-center gap-1.5 px-space-md py-2 bg-text-primary text-surface hover:opacity-90 rounded-full font-label-md text-label-md shadow-sm transition-opacity" type="button">
<span className="material-symbols-outlined text-[18px]">add</span>
<span>New Note</span>
</button>
</div>
</div>
</div>

<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl pb-space-md">

<div className="flex items-center gap-space-xs overflow-x-auto pb-1 scrollbar-none">
<button 
  onClick={() => onFilterChange('')}
  className={"px-space-md py-1.5 rounded-full font-label-sm text-label-sm font-medium transition-colors whitespace-nowrap " + (!filter ? "bg-text-primary text-surface" : "bg-surface-container-low text-text-secondary hover:bg-surface-container hover:text-text-primary")}
>
  All Documents
</button>
{uniqueTags.map((tag, i) => {
  const colors = ['bg-primary', 'bg-secondary', 'bg-tertiary'];
  return (
    <button 
      key={tag}
      onClick={() => onFilterChange(tag)}
      className={"px-space-md py-1.5 rounded-full font-label-sm text-label-sm transition-colors whitespace-nowrap flex items-center gap-1 " + (filter === tag ? "bg-surface-container-high text-text-primary" : "bg-surface-container-low text-text-secondary hover:bg-surface-container hover:text-text-primary")}
    >
      <span className={"w-1.5 h-1.5 rounded-full " + colors[i % colors.length]}></span>
      {tag}
    </button>
  );
})}
<button className="px-space-sm py-1.5 rounded-full bg-surface-container-low text-text-tertiary hover:text-text-primary font-label-sm text-label-sm flex items-center gap-0.5">
<span className="material-symbols-outlined text-[15px]">filter_list</span>
<span>Filter</span>
</button>
</div>

<div className="flex items-center gap-space-sm self-end lg:self-auto w-full lg:w-auto justify-between lg:justify-end">
<div className="relative flex items-center w-full lg:w-64">
<span className="material-symbols-outlined absolute left-3 text-[16px] text-text-tertiary">search</span>
<input 
  id="global-search-input" className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low hover:bg-surface-container focus:bg-surface-container-lowest text-text-primary font-body-sm text-body-sm placeholder:text-text-tertiary rounded-lg outline-none transition-colors" 
  placeholder="Filter title or keyword..." 
  type="text"
  value={filter}
  onChange={(e) => onFilterChange(e.target.value)}
/>
</div>
<button 
  onClick={() => setSortBy(prev => prev === 'updatedAt' ? 'createdAt' : prev === 'createdAt' ? 'title' : 'updatedAt')}
  className="flex items-center gap-1.5 px-space-sm py-1.5 bg-surface-container-low rounded-lg font-label-sm text-label-sm text-text-secondary cursor-pointer hover:bg-surface-container hover:text-text-primary transition-colors whitespace-nowrap"
>
  <span>Sort:</span>
  <span className="font-medium text-text-primary">
    {sortBy === 'updatedAt' ? 'Last Edited' : sortBy === 'createdAt' ? 'Date Created' : 'Alphabetical'}
  </span>
  <span className="material-symbols-outlined text-[14px]">swap_vert</span>
</button>
</div>
</div>

<div className={getGridClass()} id="notes-container">



{sortedNotes.map(note => (
  <div 
    key={note.id} 
    onClick={() => onOpen(note.id)}
    className="group relative flex flex-col justify-between bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md border border-border-hairline transition-all duration-200 cursor-pointer min-h-[340px]"
  >
    <button
      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-error-container text-error z-10 transition-all"
      onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
      title="Delete note"
    >
      <span className="material-symbols-outlined text-[18px]">delete</span>
    </button>

    <div>
      <div className="flex items-center justify-between mb-space-md">
        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20 font-label-sm text-label-sm font-medium">
          {note.tags && note.tags.length > 0 ? note.tags[0] : 'Note'}
        </span>
        <span className="font-label-sm text-label-sm text-text-tertiary">{formatDate(note.updatedAt || note.createdAt)}</span>
      </div>
      <h2 className="font-title-md text-title-md text-text-primary group-hover:text-primary transition-colors font-semibold tracking-tight mb-space-sm pr-8">
        {note.title?.trim() || 'Untitled'}
      </h2>
      <p className="font-body-sm text-body-sm text-text-secondary line-clamp-3 mb-space-md">
        {note.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || 'No content'}
      </p>
    </div>
    
    <div className="pt-space-md flex items-center justify-between font-label-sm text-label-sm text-text-tertiary">
      <div className="flex items-center gap-1">
        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
        <span>{note.tags?.length || 0} Tags</span>
      </div>
      <span className="font-code-sm text-code-sm">{note.content.replace(/<[^>]*>/g, '').split(' ').length} words</span>
    </div>
  </div>
))}

</div>

<div className="mt-space-xl p-space-lg bg-surface-container-low rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
<div className="flex items-center gap-space-md">
<div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-sm text-primary">
{syncStatus === 'syncing' ? <span className="material-symbols-outlined text-[20px] animate-spin">sync</span> : syncStatus === 'error' ? <span className="material-symbols-outlined text-[20px] text-error">cloud_off</span> : <span className="material-symbols-outlined text-[20px]">cloud_done</span>}
</div>
<div>
<div className="font-label-md text-label-md text-text-primary font-semibold">{syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Offline' : 'Cloud Synced'}</div>
<div className="font-body-sm text-body-sm text-text-tertiary">All {notes.length} notes securely backed up to your MongoDB cluster.</div>
</div>
</div>
<div className="flex items-center gap-space-sm">
<button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-text-primary font-label-sm text-label-sm hover:bg-surface-container transition-colors shadow-sm">
        Export Markdown
      </button>
<button className="px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-text-primary font-label-sm text-label-sm hover:bg-surface-container transition-colors shadow-sm">
        Backup Vault
      </button>
</div>
</div>
</div>

  );
}
