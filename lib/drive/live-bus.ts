import { DriveLiveEvent, DriveLiveEventType } from './drive-types';

type EventListener = (event: DriveLiveEvent) => void;

class DriveLiveEventBus {
  private subscribers: Map<string, Set<EventListener>> = new Map();

  subscribe(userId: string, listener: EventListener): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    const userSet = this.subscribers.get(userId)!;
    userSet.add(listener);

    return () => {
      userSet.delete(listener);
      if (userSet.size === 0) {
        this.subscribers.delete(userId);
      }
    };
  }

  broadcast(userId: string, type: DriveLiveEventType, payload: Partial<DriveLiveEvent> = {}) {
    const event: DriveLiveEvent = {
      type,
      userId,
      timestamp: Date.now(),
      ...payload,
    };

    const userSet = this.subscribers.get(userId);
    if (userSet) {
      userSet.forEach((listener) => {
        try {
          listener(event);
        } catch (err) {
          console.warn('[DriveLiveBus] Error notifying subscriber:', err);
        }
      });
    }
  }
}

// Global singleton instance across serverless execution contexts
const globalForLiveBus = globalThis as unknown as { driveLiveBus?: DriveLiveEventBus };
export const driveLiveBus = globalForLiveBus.driveLiveBus || new DriveLiveEventBus();
if (process.env.NODE_ENV !== 'production') globalForLiveBus.driveLiveBus = driveLiveBus;
