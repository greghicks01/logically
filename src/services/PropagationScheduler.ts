import { PropagationEvent, PropagationQueue } from '../models/PropagationEvent';
import { LogicLevel } from '../models/LogicLevel';

/**
 * Manages the queue of propagation events during slow-motion simulation
 * Events are ordered by scheduled time for processing
 */
export class PropagationScheduler {
  private queue: PropagationQueue;
  
  constructor() {
    this.queue = {
      events: [],
      currentTime: 0,
      startTime: 0,
      history: []
    };
  }
  
  /**
   * Schedule a new propagation event
   * 
   * @param event Event to schedule
   * @throws Error if event ID already exists
   */
  scheduleEvent(event: PropagationEvent): void {
    // Validate event
    const validation = this.validateEvent(event);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Insert in sorted order by scheduledTime
    const insertIndex = this.queue.events.findIndex(
      e => e.scheduledTime > event.scheduledTime
    );
    
    if (insertIndex === -1) {
      this.queue.events.push(event);
    } else {
      this.queue.events.splice(insertIndex, 0, event);
    }
  }
  
  /**
   * Process all events scheduled up to current time
   * 
   * @param currentTime Current simulation time (ms)
   * @returns Array of processed events
   */
  processEvents(currentTime: number): PropagationEvent[] {
    this.queue.currentTime = currentTime;
    const processed: PropagationEvent[] = [];
    
    // Process events in order while they're due
    while (
      this.queue.events.length > 0 &&
      this.queue.events[0].scheduledTime <= currentTime
    ) {
      const event = this.queue.events.shift()!;
      event.completed = true;
      processed.push(event);
      this.queue.history.push(event);
    }
    
    return processed;
  }
  
  /**
   * Clear all pending events (reset simulation)
   */
  clearQueue(): void {
    this.queue.events = [];
    this.queue.history = [];
    this.queue.currentTime = 0;
  }
  
  /**
   * Get upcoming events without processing
   * 
   * @param count Number of events to retrieve
   * @returns Array of upcoming events (not removed from queue)
   */
  getUpcomingEvents(count: number): PropagationEvent[] {
    return this.queue.events.slice(0, Math.max(0, count));
  }
  
  /**
   * Get event history
   */
  getHistory(): PropagationEvent[] {
    return [...this.queue.history];
  }
  
  /**
   * Check if there are pending events
   */
  hasPendingEvents(): boolean {
    return this.queue.events.length > 0;
  }
  
  /**
   * Check if there is history (for step backward)
   */
  hasHistory(): boolean {
    return this.queue.history.length > 0;
  }
  
  /**
   * Get current simulation time
   */
  getCurrentTime(): number {
    return this.queue.currentTime;
  }
  
  /**
   * Set simulation start time
   */
  setStartTime(time: number): void {
    this.queue.startTime = time;
  }
  
  /**
   * Reset to start state
   */
  reset(): void {
    this.queue = {
      events: [],
      currentTime: 0,
      startTime: performance.now(),
      history: []
    };
  }
  
  /**
   * Remove a specific event from queue (e.g., if input changes)
   * 
   * @param eventId Event ID to remove
   * @returns True if event was removed
   */
  cancelEvent(eventId: string): boolean {
    const index = this.queue.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.queue.events.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Validate a propagation event
   */
  private validateEvent(event: PropagationEvent): { valid: boolean; error?: string } {
    // Event ID must be unique
    const existingIds = new Set([
      ...this.queue.events.map(e => e.id),
      ...this.queue.history.map(e => e.id)
    ]);
    
    if (existingIds.has(event.id)) {
      return { valid: false, error: `Event with ID ${event.id} already exists` };
    }
    
    // Scheduled time must be in the future
    if (event.scheduledTime < this.queue.currentTime) {
      return { valid: false, error: 'Cannot schedule event in the past' };
    }
    
    // Must represent an actual state change
    if (event.newLevel === event.previousLevel) {
      return { valid: false, error: 'Event must change logic level' };
    }
    
    // Animation duration must be positive
    if (event.animationDuration <= 0) {
      return { valid: false, error: 'Animation duration must be positive' };
    }
    
    return { valid: true };
  }
  
  /**
   * Get queue snapshot for debugging
   */
  getQueueSnapshot(): {
    pendingCount: number;
    historyCount: number;
    currentTime: number;
    nextEventTime: number | null;
  } {
    return {
      pendingCount: this.queue.events.length,
      historyCount: this.queue.history.length,
      currentTime: this.queue.currentTime,
      nextEventTime: this.queue.events[0]?.scheduledTime ?? null
    };
  }
}
