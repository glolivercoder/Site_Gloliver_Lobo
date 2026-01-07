// Utility functions for handling media file storage with IndexedDB

const DB_NAME = 'mediaStorageDB';
const STORE_NAME = 'mediaFiles';
const DB_VERSION = 1;

// Initialize IndexedDB
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening IndexedDB');
      reject('Error opening database');
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Save file to IndexedDB and return a unique ID (with optional progress callback)
export const saveMediaFile = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  try {
    const db = await initDB();
    const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // For audio files, compress if needed
    let fileToStore = file;
    if (file.type.startsWith('audio/') && file.size > 5 * 1024 * 1024) { // 5MB
      console.warn('Audio file is large, consider compressing it before upload');
    }

    // Read file as ArrayBuffer
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.min(90, Math.floor((e.loaded / fileToStore.size) * 90));
          onProgress?.(progress);
        }
      };
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(fileToStore);
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
        onProgress?.(100);
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

// Get file data by ID
export const getMediaFile = async (fileId: string): Promise<Blob | null> => {
  try {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(fileId);

      request.onsuccess = () => {
        if (request.result) {
          const { data, type } = request.result;
          resolve(new Blob([data], { type }));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Error getting file from IndexedDB');
        resolve(null);
      };
    });
  } catch (error) {
    console.error('Error in getMediaFile:', error);
    return null;
  }
};

// Get file URL for use in media elements
export const getMediaUrl = async (fileId: string): Promise<string | null> => {
  const blob = await getMediaFile(fileId);
  return blob ? URL.createObjectURL(blob) : null;
};

// Check storage usage and clean up if needed
const cleanupOldFilesIfNeeded = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
      const files = request.result || [];
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      let totalSize = 0;

      // Calculate total size and find old files
      const oldFiles = [];
      for (const file of files) {
        totalSize += file.size || 0;
        if (now - file.timestamp > maxAge) {
          oldFiles.push(file.id);
        }
      }

      // If storage is getting full (over 256MB) or we have old files, clean up
      const MAX_STORAGE = 256 * 1024 * 1024; // 256MB
      if (totalSize > MAX_STORAGE || oldFiles.length > 0) {
        await cleanupOldFiles(oldFiles, totalSize - MAX_STORAGE);
      }
    };
  } catch (error) {
    console.error('Error in cleanup check:', error);
  }
};

// Clean up old files to free up space
const cleanupOldFiles = async (fileIds: string[], targetSize: number): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // First delete explicitly old files
    for (const id of fileIds) {
      store.delete(id);
    }

    // If we still need more space, delete oldest files
    if (targetSize > 0) {
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const files = getAllRequest.result || [];
        // Sort by timestamp (oldest first)
        files.sort((a, b) => a.timestamp - b.timestamp);

        let freedSize = 0;
        for (const file of files) {
          if (freedSize >= targetSize) break;
          store.delete(file.id);
          freedSize += file.size || 0;
        }

        console.log(`Freed ${freedSize} bytes of storage space`);
      };
    }
  } catch (error) {
    console.error('Error in cleanupOldFiles:', error);
  }
};

// Clean up files older than specified days
export const cleanupOldFilesByAge = async (maxAgeDays = 7): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const files = request.result || [];
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        if (now - file.timestamp > maxAge) {
          store.delete(file.id);
        }
      }
    };
  } catch (error) {
    console.error('Error in cleanupOldFilesByAge:', error);
  }
};

// Get storage usage information
export const getStorageInfo = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise<{ totalSize: number; fileCount: number }>((resolve) => {
      request.onsuccess = () => {
        const files = request.result || [];
        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        resolve({
          totalSize,
          fileCount: files.length
        });
      };

      request.onerror = () => {
        resolve({ totalSize: 0, fileCount: 0 });
      };
    });
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { totalSize: 0, fileCount: 0 };
  }
};

// List all media metadata stored in IndexedDB (without reading full blobs)
export const listMediaFilesMeta = async (): Promise<Array<{ id: string; type: string; name: string; size: number; timestamp: number }>> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const files = (request.result || []).map((f: any) => ({
          id: f.id,
          type: f.type,
          name: f.name,
          size: f.size || 0,
          timestamp: f.timestamp || 0,
        }));
        resolve(files);
      };
      request.onerror = () => resolve([]);
    });
  } catch (error) {
    console.error('Error listing media files meta:', error);
    return [];
  }
};

// Delete a single media file by ID
export const deleteMediaFile = async (fileId: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(fileId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error deleting file');
    });
  } catch (error) {
    console.error('Error deleting media file:', error);
    throw error;
  }
};

// Get storage usage (returns used bytes and estimated total)
export const getStorageUsage = async (): Promise<{ used: number; total: number }> => {
  try {
    const files = await listMediaFilesMeta();
    const used = files.reduce((acc, f) => acc + (f.size || 0), 0);

    // Try to get quota if available
    let total = 50 * 1024 * 1024; // Default 50MB estimate
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      total = estimate.quota || total;
    }

    return { used, total };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    return { used: 0, total: 50 * 1024 * 1024 };
  }
};

// Clear all files from storage
export const clearAllStorage = async (): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject('Error clearing storage');
    });
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};
