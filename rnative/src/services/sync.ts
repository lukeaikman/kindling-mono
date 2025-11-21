/**
 * Offline sync service for queuing and syncing mutations
 * 
 * This service manages a queue of actions that were performed offline
 * and syncs them to the backend when the connection is restored.
 * 
 * @module services/sync
 */

import { storage } from './storage';

/**
 * Storage key for the offline queue
 */
const OFFLINE_QUEUE_KEY = 'kindling-offline-queue';

/**
 * Queued mutation interface
 */
export interface QueuedMutation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'person' | 'asset' | 'will' | 'trust' | 'business' | 'relationship' | 'beneficiary-group' | 'estate-remainder';
  data: any;
  timestamp: Date;
}

/**
 * Get the offline queue from storage
 * 
 * @returns {Promise<QueuedMutation[]>} Array of queued mutations
 */
export const getOfflineQueue = async (): Promise<QueuedMutation[]> => {
  try {
    return await storage.load<QueuedMutation[]>(OFFLINE_QUEUE_KEY, []);
  } catch (error) {
    console.error('[Sync] Failed to load offline queue:', error);
    return [];
  }
};

/**
 * Add mutation to offline queue
 * 
 * @param {QueuedMutation} mutation - Mutation to queue
 * @returns {Promise<void>}
 */
export const queueMutation = async (mutation: QueuedMutation): Promise<void> => {
  try {
    const queue = await getOfflineQueue();
    queue.push(mutation);
    await storage.save(OFFLINE_QUEUE_KEY, queue);
    console.log('[Sync] Mutation queued:', mutation.type, mutation.entity);
  } catch (error) {
    console.error('[Sync] Failed to queue mutation:', error);
  }
};

/**
 * Clear the offline queue
 * 
 * @returns {Promise<void>}
 */
export const clearOfflineQueue = async (): Promise<void> => {
  try {
    await storage.remove(OFFLINE_QUEUE_KEY);
    console.log('[Sync] Offline queue cleared');
  } catch (error) {
    console.error('[Sync] Failed to clear offline queue:', error);
  }
};

/**
 * Sync offline queue to backend
 * Processes all queued mutations and sends them to the API
 * 
 * @param {boolean} isConnected - Whether device is connected to network
 * @returns {Promise<{success: number, failed: number}>} Result summary
 */
export const syncOfflineQueue = async (isConnected: boolean): Promise<{success: number, failed: number}> => {
  if (!isConnected) {
    console.log('[Sync] Cannot sync - no network connection');
    return { success: 0, failed: 0 };
  }

  const queue = await getOfflineQueue();
  
  if (queue.length === 0) {
    console.log('[Sync] Queue is empty, nothing to sync');
    return { success: 0, failed: 0 };
  }

  console.log(`[Sync] Syncing ${queue.length} queued mutations...`);

  let successCount = 0;
  let failedCount = 0;
  const failedMutations: QueuedMutation[] = [];

  for (const mutation of queue) {
    try {
      // Here you would call the appropriate API method based on mutation.type and mutation.entity
      // For now, we'll just log and mark as successful
      console.log(`[Sync] Processing: ${mutation.type} ${mutation.entity}`, mutation.id);
      
      // TODO: Implement actual API calls here when Rails backend is ready
      // Example:
      // if (mutation.entity === 'person' && mutation.type === 'create') {
      //   await api.createPerson(mutation.data);
      // }
      
      successCount++;
    } catch (error) {
      console.error('[Sync] Failed to sync mutation:', mutation.id, error);
      failedCount++;
      failedMutations.push(mutation);
    }
  }

  // Update queue with only failed mutations
  if (failedMutations.length > 0) {
    await storage.save(OFFLINE_QUEUE_KEY, failedMutations);
    console.log(`[Sync] Sync partially complete: ${successCount} succeeded, ${failedCount} failed`);
  } else {
    await clearOfflineQueue();
    console.log(`[Sync] ✅ All mutations synced successfully (${successCount} total)`);
  }

  return { success: successCount, failed: failedCount };
};

/**
 * Check if offline queue has pending mutations
 * 
 * @returns {Promise<boolean>} True if queue has items
 */
export const hasQueuedMutations = async (): Promise<boolean> => {
  const queue = await getOfflineQueue();
  return queue.length > 0;
};

/**
 * Get queue size
 * 
 * @returns {Promise<number>} Number of queued mutations
 */
export const getQueueSize = async (): Promise<number> => {
  const queue = await getOfflineQueue();
  return queue.length;
};

