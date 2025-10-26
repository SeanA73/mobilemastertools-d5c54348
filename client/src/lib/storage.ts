// Client-side storage utilities for PWA offline functionality

export interface StorageItem {
  key: string;
  value: any;
  timestamp: number;
  expiresAt?: number;
}

class LocalStorageManager {
  private prefix = 'mobiletoolsbox_';

  set(key: string, value: any, expiresInMinutes?: number): void {
    try {
      const item: StorageItem = {
        key,
        value,
        timestamp: Date.now(),
        expiresAt: expiresInMinutes ? Date.now() + (expiresInMinutes * 60 * 1000) : undefined,
      };
      
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
    } catch (error) {
      console.error('Failed to store item:', error);
    }
  }

  get<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(this.prefix + key);
      if (!stored) return null;

      const item: StorageItem = JSON.parse(stored);
      
      // Check if item has expired
      if (item.expiresAt && Date.now() > item.expiresAt) {
        this.remove(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }

  clear(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  // Get all keys with the prefix
  getAllKeys(): string[] {
    try {
      return Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .map(key => key.replace(this.prefix, ''));
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  // Check if storage is available
  isAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, 'test');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  // Get storage usage info
  getUsageInfo(): { used: number; available: number; percentage: number } {
    try {
      let used = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
          used += localStorage[key].length;
        }
      }

      // Estimate available storage (5MB is typical limit)
      const available = 5 * 1024 * 1024; // 5MB in bytes
      const percentage = (used / available) * 100;

      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to get usage info:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }
}

class CacheManager {
  private prefix = 'mobiletoolsbox_cache_';

  async set(key: string, data: any, expiresInMinutes: number = 60): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + (expiresInMinutes * 60 * 1000),
      };

      localStorage.setItem(this.prefix + key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = localStorage.getItem(this.prefix + key);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Check if cache has expired
      if (Date.now() > cacheItem.expiresAt) {
        this.remove(key);
        return null;
      }

      return cacheItem.data as T;
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (error) {
      console.error('Failed to remove cached data:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // Clean expired cache entries
  async cleanExpired(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      const now = Date.now();

      keys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const cacheItem = JSON.parse(cached);
            if (now > cacheItem.expiresAt) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse it, remove it
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }
}

class OfflineQueueManager {
  private queueKey = 'offline_queue';

  addRequest(request: {
    url: string;
    method: string;
    data?: any;
    timestamp: number;
  }): void {
    try {
      const queue = this.getQueue();
      queue.push(request);
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to add request to offline queue:', error);
    }
  }

  getQueue(): any[] {
    try {
      const stored = localStorage.getItem(this.queueKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get offline queue:', error);
      return [];
    }
  }

  removeRequest(index: number): void {
    try {
      const queue = this.getQueue();
      queue.splice(index, 1);
      localStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to remove request from offline queue:', error);
    }
  }

  clearQueue(): void {
    try {
      localStorage.removeItem(this.queueKey);
    } catch (error) {
      console.error('Failed to clear offline queue:', error);
    }
  }

  async processQueue(): Promise<void> {
    const queue = this.getQueue();
    
    for (let i = queue.length - 1; i >= 0; i--) {
      const request = queue[i];
      
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.data ? { 'Content-Type': 'application/json' } : {},
          body: request.data ? JSON.stringify(request.data) : undefined,
          credentials: 'include',
        });

        if (response.ok) {
          this.removeRequest(i);
        }
      } catch (error) {
        console.error('Failed to process queued request:', error);
        // Keep the request in queue for next attempt
      }
    }
  }
}

// Export singleton instances
export const storage = new LocalStorageManager();
export const cache = new CacheManager();
export const offlineQueue = new OfflineQueueManager();

// Utility functions
export const isOnline = (): boolean => navigator.onLine;

export const waitForOnline = (): Promise<void> => {
  return new Promise((resolve) => {
    if (isOnline()) {
      resolve();
    } else {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    }
  });
};

// Initialize offline queue processing when online
window.addEventListener('online', () => {
  offlineQueue.processQueue();
});

// Clean expired cache on startup
cache.cleanExpired();
