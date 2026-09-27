/**
 * OPFS (Origin Private File System) Storage Utilities
 * 
 * This module provides a complete replacement for localStorage using OPFS,
 * offering better performance, larger storage capacity, and more reliable persistence.
 */

import React from 'react'

// Storage keys mapping
export const STORAGE_KEYS = {
  NOTES: 'notes',
  TASKS: 'tasks', 
  AI_MESSAGES: 'aiMessages'
} as const

type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]

// OPFS file system instance
let opfsRoot: FileSystemDirectoryHandle | null = null

/**
 * Initialize OPFS and create the root directory if it doesn't exist
 */
async function initOPFS(): Promise<FileSystemDirectoryHandle> {
  if (opfsRoot) return opfsRoot
  
  try {
    // Request access to OPFS
    opfsRoot = await navigator.storage.getDirectory()
    console.log('✅ OPFS initialized successfully')
    return opfsRoot
  } catch (error) {
    console.error('❌ Failed to initialize OPFS:', error)
    throw new Error('OPFS not supported or access denied')
  }
}

/**
 * Get a file handle for the given storage key
 */
async function getFileHandle(key: StorageKey): Promise<FileSystemFileHandle> {
  const root = await initOPFS()
  
  try {
    // Try to get existing file
    return await root.getFileHandle(`${key}.json`, { create: false })
  } catch {
    // Create new file if it doesn't exist
    return await root.getFileHandle(`${key}.json`, { create: true })
  }
}

/**
 * Read data from OPFS storage
 */
export async function readFromOPFS<T>(key: StorageKey): Promise<T | null> {
  try {
    const fileHandle = await getFileHandle(key)
    const file = await fileHandle.getFile()
    
    if (file.size === 0) {
      console.log(`📁 OPFS: Empty file for key '${key}', returning null`)
      return null
    }
    
    const text = await file.text()
    const data = JSON.parse(text)
    
    console.log(`📖 OPFS: Successfully read data for key '${key}' (${file.size} bytes)`)
    return data as T
  } catch (error) {
    console.error(`❌ OPFS: Failed to read data for key '${key}':`, error)
    return null
  }
}

/**
 * Write data to OPFS storage
 */
export async function writeToOPFS<T>(key: StorageKey, data: T): Promise<boolean> {
  try {
    const fileHandle = await getFileHandle(key)
    const writable = await fileHandle.createWritable()
    
    const jsonString = JSON.stringify(data, null, 2)
    await writable.write(jsonString)
    await writable.close()
    
    console.log(`💾 OPFS: Successfully wrote data for key '${key}' (${jsonString.length} chars)`)
    return true
  } catch (error) {
    console.error(`❌ OPFS: Failed to write data for key '${key}':`, error)
    return false
  }
}

/**
 * Delete data from OPFS storage
 */
export async function deleteFromOPFS(key: StorageKey): Promise<boolean> {
  try {
    const root = await initOPFS()
    await root.removeEntry(`${key}.json`)
    console.log(`🗑️ OPFS: Successfully deleted data for key '${key}'`)
    return true
  } catch (error) {
    console.error(`❌ OPFS: Failed to delete data for key '${key}':`, error)
    return false
  }
}

/**
 * Check if OPFS is supported in the current browser
 */
export function isOPFSSupported(): boolean {
  return 'storage' in navigator && 'getDirectory' in navigator.storage
}

/**
 * Get storage usage information
 */
export async function getStorageInfo(): Promise<{
  quota: number
  usage: number
  available: number
  percentage: number
}> {
  try {
    if (!navigator.storage || !navigator.storage.estimate) {
      throw new Error('Storage API not supported')
    }
    
    const estimate = await navigator.storage.estimate()
    const quota = estimate.quota || 0
    const usage = estimate.usage || 0
    const available = quota - usage
    const percentage = quota > 0 ? (usage / quota) * 100 : 0
    
    return { quota, usage, available, percentage }
  } catch (error) {
    console.error('❌ Failed to get storage info:', error)
    return { quota: 0, usage: 0, available: 0, percentage: 0 }
  }
}

/**
 * Migrate data from localStorage to OPFS
 * This function should be called once during app initialization
 */
export async function migrateFromLocalStorage(): Promise<{
  migrated: string[]
  failed: string[]
}> {
  if (!isOPFSSupported()) {
    console.warn('⚠️ OPFS not supported, skipping migration')
    return { migrated: [], failed: [] }
  }
  
  const migrated: string[] = []
  const failed: string[] = []
  
  // Migrate each storage key
  for (const key of Object.values(STORAGE_KEYS)) {
    try {
      const localData = localStorage.getItem(key)
      if (localData) {
        const parsed = JSON.parse(localData)
        const success = await writeToOPFS(key, parsed)
        
        if (success) {
          migrated.push(key)
          console.log(`✅ Migrated '${key}' from localStorage to OPFS`)
        } else {
          failed.push(key)
          console.error(`❌ Failed to migrate '${key}' to OPFS`)
        }
      } else {
        console.log(`ℹ️ No data found in localStorage for '${key}'`)
      }
    } catch (error) {
      console.error(`❌ Error migrating '${key}':`, error)
      failed.push(key)
    }
  }
  
  return { migrated, failed }
}

/**
 * Clear all OPFS data (useful for testing or reset)
 */
export async function clearAllOPFS(): Promise<boolean> {
  try {
    const root = await initOPFS()
    
    // List all files and delete them
    const entries = []
    for await (const [name, handle] of (root as any).entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        entries.push(name)
      }
    }
    
    for (const name of entries) {
      await root.removeEntry(name)
    }
    
    console.log(`🧹 OPFS: Cleared ${entries.length} files`)
    return true
  } catch (error) {
    console.error('❌ OPFS: Failed to clear all data:', error)
    return false
  }
}

/**
 * List all files in OPFS (useful for debugging)
 */
export async function listOPFSFiles(): Promise<string[]> {
  try {
    const root = await initOPFS()
    const files: string[] = []
    
    for await (const [name, handle] of (root as any).entries()) {
      if (handle.kind === 'file' && name.endsWith('.json')) {
        files.push(name)
      }
    }
    
    console.log('📁 OPFS Files:', files)
    return files
  } catch (error) {
    console.error('❌ OPFS: Failed to list files:', error)
    return []
  }
}

/**
 * Get file size for a specific storage key
 */
export async function getFileSize(key: StorageKey): Promise<number> {
  try {
    const fileHandle = await getFileHandle(key)
    const file = await fileHandle.getFile()
    return file.size
  } catch (error) {
    console.error(`❌ OPFS: Failed to get file size for '${key}':`, error)
    return 0
  }
}

/**
 * React hook for OPFS storage with automatic migration
 */
export function useOPFSStorage<T>(
  key: StorageKey,
  defaultValue: T,
  options: {
    autoMigrate?: boolean
    onError?: (error: Error) => void
  } = {}
): [T, (value: T) => Promise<boolean>, boolean] {
  const [data, setData] = React.useState<T>(defaultValue)
  const [isLoading, setIsLoading] = React.useState(true)
  const [migrationDone, setMigrationDone] = React.useState(false)
  
  const { autoMigrate = true, onError } = options
  
  // Load data on mount
  React.useEffect(() => {
    let isMounted = true
    console.log(`🔄 OPFS Hook loading data for key: ${key}`)
    
    const loadData = async () => {
      try {
        console.log(`📥 Starting to load data for key: ${key}`)
        setIsLoading(true)
        
        // Check if OPFS is supported
        if (!isOPFSSupported()) {
          console.warn('⚠️ OPFS not supported, falling back to localStorage')
          const localData = localStorage.getItem(key)
          if (localData) {
            const parsed = JSON.parse(localData)
            if (isMounted) setData(parsed)
          }
          return
        }
        
        // Try to read from OPFS first
        const opfsData = await readFromOPFS<T>(key)
        if (opfsData !== null) {
          if (isMounted) setData(opfsData)
          return
        }
        
        // If no OPFS data and autoMigrate is enabled, try localStorage
        if (autoMigrate && !migrationDone) {
          const localData = localStorage.getItem(key)
          if (localData) {
            const parsed = JSON.parse(localData)
            const success = await writeToOPFS(key, parsed)
            if (success) {
              if (isMounted) {
                setData(parsed)
                setMigrationDone(true)
              }
              console.log(`✅ Auto-migrated '${key}' from localStorage to OPFS`)
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error loading data for '${key}':`, error)
        onError?.(error as Error)
      } finally {
        console.log(`✅ Finished loading data for key: ${key}`)
        if (isMounted) setIsLoading(false)
      }
    }
    
    loadData()
    
    return () => {
      isMounted = false
    }
  }, [key, autoMigrate, onError])
  
  // Save data function
  const saveData = React.useCallback(async (value: T): Promise<boolean> => {
    try {
      if (!isOPFSSupported()) {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value))
        setData(value)
        return true
      }
      
      const success = await writeToOPFS(key, value)
      if (success) {
        setData(value)
      }
      return success
    } catch (error) {
      console.error(`❌ Error saving data for '${key}':`, error)
      onError?.(error as Error)
      return false
    }
  }, [key, onError])
  
  return [data, saveData, isLoading]
}
