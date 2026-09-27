import { createContext, useContext, type ReactNode } from 'react';
import { useSimpleStorage, STORAGE_KEYS } from '../utils/simpleStorage';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  createdAt: number;
}

interface NotesContextType {
  notes: Note[];
  setNotes: (notes: Note[]) => boolean;
  isNotesLoading: boolean;
  syncStatus: string;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes, isNotesLoading, syncStatus] = useSimpleStorage<Note[]>(STORAGE_KEYS.NOTES, []);

  return (
    <NotesContext.Provider value={{ notes, setNotes, isNotesLoading, syncStatus }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
