// src/lib/storage.ts
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'mediaDB';
const STORE_NAME = 'mediaStore';
const DB_VERSION = 1;

// Helper to initialize the database
export const initDB = async (): Promise<IDBPDatabase> => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
};

// Placeholder for a cleanup function
export const cleanupOldFilesIfNeeded = async () => {
  // In a real app, you might implement logic to delete old files
  // if the storage quota is exceeded.
  console.log('Cleanup check: No old files removed in this basic implementation.');
};

// Function to save a media file to IndexedDB
export const saveMediaFile = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  try {
    const db = await initDB();
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    if (file.size > MAX_FILE_SIZE) {
      // Reject the promise if the file is too large
      return Promise.reject(`O arquivo é muito grande. O tamanho máximo é ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }

    // For audio files, you might want to compress, but here we'll just log
    if (file.type.startsWith('audio/') && file.size > 5 * 1024 * 1024) { // 5MB
      console.warn('Audio file is large, consider compressing it before upload');
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      
      // This doesn't give granular progress, so we simulate it in the component
      // and call onProgress(100) at the end.
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });

    // Store in IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const request = store.put({
        id: fileId,
        data: arrayBuffer,
        type: file.type,
        name: file.name,
        size: file.size,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        onProgress?.(100); // Notify that the save is 100% complete
        resolve();
      };

      request.onerror = (e) => {
        console.error('Error saving file to IndexedDB:', e);
        reject('Error saving file');
      };
    });

    // Clean up old files if storage is getting full
    await cleanupOldFilesIfNeeded();

    return fileId;
  } catch (error) {
    console.error('Error in saveMediaFile:', error);
    throw error;
  }
};

// Function to retrieve a media file from IndexedDB
export const getMediaFile = async (fileId: string): Promise<File | null> => {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const fileData = await store.get(fileId);

    if (fileData) {
        const blob = new Blob([fileData.data], { type: fileData.type });
        return new File([blob], fileData.name, { type: fileData.type });
    }
    return null;
};
