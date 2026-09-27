import { useEffect, useState } from 'react';
import { useSimpleStorage, STORAGE_KEYS } from '../utils/simpleStorage';
import { isOPFSSupported } from '../utils/opfsStorage';

export function StorageDebugger() {
  const [notes, setNotes] = useSimpleStorage<any[]>(STORAGE_KEYS.NOTES, []);
  const [tasks, setTasks] = useSimpleStorage<any[]>(STORAGE_KEYS.TASKS, []);
  const [messages, setMessages] = useSimpleStorage<any[]>(STORAGE_KEYS.AI_MESSAGES, []);
  const [storageType, setStorageType] = useState<'localStorage' | 'OPFS'>('localStorage');

  useEffect(() => {
    // Detect which storage method is being used
    const isOPFS = isOPFSSupported();
    setStorageType(isOPFS ? 'OPFS' : 'localStorage');
    
    console.log(`Storage Debugger loaded - using ${isOPFS ? 'OPFS' : 'localStorage'}`);
    console.log('Current localStorage contents:');
    console.log('Notes:', localStorage.getItem('notes'));
    console.log('Tasks:', localStorage.getItem('tasks'));
    console.log('AI Messages:', localStorage.getItem('aiMessages'));
  }, []);

  const clearAllData = () => {
    setNotes([]);
    setTasks([]);
    setMessages([]);
    console.log('All data cleared');
  };

  const testSaveData = () => {
    const testNote = {
      id: 'test-' + Date.now(),
      title: 'Test Note',
      content: 'This is a test note',
      tags: ['test'],
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    
    const testTask = {
      id: Date.now(),
      text: 'Test Task',
      completed: false
    };
    
    const testMessage = {
      id: Date.now(),
      text: 'Test message',
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    console.log('Testing data save...');
    setNotes([...notes, testNote]);
    setTasks([...tasks, testTask]);
    setMessages([...messages, testMessage]);
    console.log('Test data saved!');
  };

  return (
    <div className="p-4 bg-card border border-border rounded-lg m-4">
      <h3 className="text-lg font-semibold mb-4">Storage Debugger</h3>
      
      <div className="mb-4">
        <div className={`text-sm font-medium ${storageType === 'OPFS' ? 'text-blue-600' : 'text-green-600'}`}>
          {storageType === 'OPFS' ? (
            <>✅ Using OPFS (Origin Private File System) - Advanced storage</>
          ) : (
            <>✅ Using localStorage (reliable fallback storage)</>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {storageType === 'OPFS' 
            ? 'OPFS provides better performance and larger storage capacity'
            : 'localStorage is used when OPFS is not supported by the browser'
          }
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <h4 className="font-medium mb-2">Notes Count:</h4>
          <div className="text-2xl font-bold text-primary">{notes.length}</div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Tasks Count:</h4>
          <div className="text-2xl font-bold text-primary">{tasks.length}</div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Messages Count:</h4>
          <div className="text-2xl font-bold text-primary">{messages.length}</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={testSaveData}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Test Save Data
        </button>
        <button
          onClick={clearAllData}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
        >
          Clear All Data
        </button>
        <button
          onClick={() => {
            console.log('Refreshing storage debugger...');
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
