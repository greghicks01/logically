import { CompositeIC } from '../models/CompositeIC';

/**
 * Serialized IC format for storage
 */
export interface SerializedIC {
  id: string;
  name: string;
  version: string;
  data: string; // JSON stringified IC
  timestamp: number;
}

/**
 * Composite IC Library service
 * Manages persistent storage of composite ICs using IndexedDB with LocalStorage fallback
 */
export class CompositeICLibrary {
  private dbName = 'LogicLyDB';
  private storeName = 'compositeICs';
  private db: IDBDatabase | null = null;
  private useLocalStorageFallback = false;

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported, using LocalStorage fallback');
      this.useLocalStorageFallback = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => {
        console.warn('IndexedDB initialization failed, using LocalStorage fallback');
        this.useLocalStorageFallback = true;
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Save composite IC to storage
   */
  async saveIC(ic: CompositeIC): Promise<void> {
    const serialized: SerializedIC = {
      id: ic.id,
      name: ic.name,
      version: '1.0',
      data: JSON.stringify(ic),
      timestamp: Date.now(),
    };

    if (this.useLocalStorageFallback) {
      return this.saveToLocalStorage(serialized);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return this.saveToLocalStorage(serialized).then(resolve).catch(reject);
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(serialized);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.warn('IndexedDB save failed, falling back to LocalStorage');
        this.saveToLocalStorage(serialized).then(resolve).catch(reject);
      };
    });
  }

  /**
   * Load composite IC from storage
   */
  async loadIC(id: string): Promise<CompositeIC | null> {
    if (this.useLocalStorageFallback) {
      return this.loadFromLocalStorage(id);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return this.loadFromLocalStorage(id).then(resolve).catch(reject);
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as SerializedIC | undefined;
        if (result) {
          resolve(JSON.parse(result.data));
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('IndexedDB load failed, trying LocalStorage');
        this.loadFromLocalStorage(id).then(resolve).catch(reject);
      };
    });
  }

  /**
   * Load all composite ICs
   */
  async loadAllICs(): Promise<CompositeIC[]> {
    if (this.useLocalStorageFallback) {
      return this.loadAllFromLocalStorage();
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return this.loadAllFromLocalStorage().then(resolve).catch(reject);
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as SerializedIC[];
        resolve(results.map((r) => JSON.parse(r.data)));
      };

      request.onerror = () => {
        console.warn('IndexedDB loadAll failed, trying LocalStorage');
        this.loadAllFromLocalStorage().then(resolve).catch(reject);
      };
    });
  }

  /**
   * Delete composite IC
   */
  async deleteIC(id: string): Promise<void> {
    if (this.useLocalStorageFallback) {
      return this.deleteFromLocalStorage(id);
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        return this.deleteFromLocalStorage(id).then(resolve).catch(reject);
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // LocalStorage fallback methods
  private async saveToLocalStorage(serialized: SerializedIC): Promise<void> {
    try {
      localStorage.setItem(`ic-${serialized.id}`, JSON.stringify(serialized));
    } catch (e) {
      throw new Error('Failed to save to LocalStorage');
    }
  }

  private async loadFromLocalStorage(id: string): Promise<CompositeIC | null> {
    const data = localStorage.getItem(`ic-${id}`);
    if (!data) return null;
    
    const serialized = JSON.parse(data) as SerializedIC;
    return JSON.parse(serialized.data);
  }

  private async loadAllFromLocalStorage(): Promise<CompositeIC[]> {
    const ics: CompositeIC[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('ic-')) {
        const data = localStorage.getItem(key);
        if (data) {
          const serialized = JSON.parse(data) as SerializedIC;
          ics.push(JSON.parse(serialized.data));
        }
      }
    }
    
    return ics;
  }

  private async deleteFromLocalStorage(id: string): Promise<void> {
    localStorage.removeItem(`ic-${id}`);
  }
}
