/**
 * Offline Queue Helper
 * 
 * Stores failed API requests locally and retries them when network reconnects.
 * Uses IndexedDB for persistence (with localStorage fallback).
 * 
 * Usage:
 * ```typescript
 * import { offlineQueue } from '@/delivery/utils/offlineQueue';
 * 
 * // Queue a failed request
 * await offlineQueue.queueRequest({
 *   url: '/api/delivery/orders/123/status',
 *   method: 'PATCH',
 *   body: { status: 'delivered' },
 *   headers: { 'Authorization': 'Bearer token' }
 * });
 * 
 * // Check pending requests
 * const pending = await offlineQueue.getPendingCount();
 * 
 * // Manually retry
 * await offlineQueue.retryAll();
 * ```
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = 'delivery_offline_queue';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000; // 1 second between retries

class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isRetrying = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadQueue();
    this.setupNetworkListener();
  }

  /**
   * Load queue from storage
   */
  private async loadQueue(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      // Try IndexedDB first, fallback to localStorage
      if (this.isIndexedDBAvailable()) {
        const db = await this.openIndexedDB();
        const transaction = db.transaction([QUEUE_STORAGE_KEY], 'readonly');
        const store = transaction.objectStore(QUEUE_STORAGE_KEY);
        const request = store.getAll();
        
        this.queue = await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      } else {
        // Fallback to localStorage
        const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
        this.queue = stored ? JSON.parse(stored) : [];
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      // Try IndexedDB first, fallback to localStorage
      if (this.isIndexedDBAvailable()) {
        try {
          const db = await this.openIndexedDB();
          const transaction = db.transaction([QUEUE_STORAGE_KEY], 'readwrite');
          const store = transaction.objectStore(QUEUE_STORAGE_KEY);
          
          // Clear and repopulate
          await store.clear();
          for (const request of this.queue) {
            await store.add(request);
          }
        } catch (error) {
          // IndexedDB failed, fallback to localStorage
          localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
        }
      } else {
        // Fallback to localStorage
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
      }

      this.notifyListeners();
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Check if IndexedDB is available
   */
  private isIndexedDBAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window;
  }

  /**
   * Open IndexedDB database
   */
  private async openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('DeliveryOfflineQueue', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(QUEUE_STORAGE_KEY)) {
          const store = db.createObjectStore(QUEUE_STORAGE_KEY, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Setup network listener for auto-retry
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('Network reconnected, retrying queued requests...');
      this.retryAll();
    });

    // Also check if we're already online and have pending requests
    if (navigator.onLine && this.queue.length > 0) {
      this.retryAll();
    }
  }

  /**
   * Queue a failed request for retry
   */
  async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...request,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedRequest);
    await this.saveQueue();

    console.log('Request queued for retry:', queuedRequest);
  }

  /**
   * Retry a single queued request
   */
  private async retryRequest(request: QueuedRequest): Promise<boolean> {
    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      if (response.ok) {
        // Request succeeded, remove from queue
        this.queue = this.queue.filter((r) => r.id !== request.id);
        await this.saveQueue();
        return true;
      } else {
        // Request failed, increment retry count
        request.retryCount++;
        if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
          // Max retries reached, remove from queue
          console.error('Request failed after max retries:', request);
          this.queue = this.queue.filter((r) => r.id !== request.id);
          await this.saveQueue();
          return false;
        } else {
          await this.saveQueue();
          return false;
        }
      }
    } catch (error) {
      // Network error, increment retry count
      request.retryCount++;
      if (request.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error('Request failed after max retries:', request, error);
        this.queue = this.queue.filter((r) => r.id !== request.id);
        await this.saveQueue();
        return false;
      } else {
        await this.saveQueue();
        return false;
      }
    }
  }

  /**
   * Retry all queued requests
   */
  async retryAll(): Promise<void> {
    if (this.isRetrying || this.queue.length === 0) return;
    if (!navigator.onLine) {
      console.log('Network offline, skipping retry');
      return;
    }

    this.isRetrying = true;
    console.log(`Retrying ${this.queue.length} queued requests...`);

    // Sort by timestamp (oldest first)
    const sortedQueue = [...this.queue].sort((a, b) => a.timestamp - b.timestamp);

    for (const request of sortedQueue) {
      // Add delay between retries
      if (request.retryCount > 0) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }

      const success = await this.retryRequest(request);
      if (success) {
        console.log('Successfully retried request:', request.id);
      }
    }

    this.isRetrying = false;
    console.log('Finished retrying queued requests');
  }

  /**
   * Retry a specific request by ID
   */
  async retryRequestById(id: string): Promise<boolean> {
    const request = this.queue.find((r) => r.id === id);
    if (!request) return false;

    if (!navigator.onLine) {
      console.log('Network offline, cannot retry');
      return false;
    }

    return await this.retryRequest(request);
  }

  /**
   * Get pending request count
   */
  async getPendingCount(): Promise<number> {
    await this.loadQueue(); // Refresh queue
    return this.queue.length;
  }

  /**
   * Get all pending requests
   */
  async getPendingRequests(): Promise<QueuedRequest[]> {
    await this.loadQueue(); // Refresh queue
    return [...this.queue];
  }

  /**
   * Remove a request from queue
   */
  async removeRequest(id: string): Promise<void> {
    this.queue = this.queue.filter((r) => r.id !== id);
    await this.saveQueue();
  }

  /**
   * Clear all queued requests
   */
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of queue changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback());
  }

  /**
   * Check if network is online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();

// Export types
export type { QueuedRequest };

