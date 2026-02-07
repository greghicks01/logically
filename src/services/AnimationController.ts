import { clampSpeed } from '../lib/timingUtils';

/**
 * Controls visual animation timing using requestAnimationFrame
 * Provides start/stop, pause/resume, and speed control
 */
export class AnimationController {
  private rafId: number | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private pausedDuration: number = 0;
  private speed: number = 1.0;
  private isPaused: boolean = false;
  private onFrameCallback: ((elapsed: number) => void) | null = null;
  
  /**
   * Start the animation loop
   * 
   * @param onFrame Callback invoked each frame with elapsed time (ms)
   * @throws Error if already running
   */
  start(onFrame: (elapsed: number) => void): void {
    if (this.rafId !== null) {
      throw new Error('Animation already running');
    }
    
    this.onFrameCallback = onFrame;
    this.startTime = performance.now();
    this.pausedDuration = 0;
    this.isPaused = false;
    
    this.animate(this.startTime);
  }
  
  /**
   * Internal animation loop
   */
  private animate = (timestamp: number): void => {
    if (this.isPaused || !this.onFrameCallback) {
      return;
    }
    
    // Calculate elapsed time accounting for pauses and speed
    const realElapsed = timestamp - this.startTime - this.pausedDuration;
    const elapsed = realElapsed * this.speed;
    
    this.onFrameCallback(elapsed);
    
    this.rafId = requestAnimationFrame(this.animate);
  };
  
  /**
   * Stop the animation loop completely
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.onFrameCallback = null;
    this.isPaused = false;
    this.pausedDuration = 0;
  }
  
  /**
   * Pause animation without stopping
   */
  pause(): void {
    if (!this.isPaused && this.rafId !== null) {
      this.isPaused = true;
      this.pausedAt = performance.now();
    }
  }
  
  /**
   * Resume paused animation
   */
  resume(): void {
    if (this.isPaused && this.rafId !== null) {
      this.pausedDuration += performance.now() - this.pausedAt;
      this.isPaused = false;
      
      // Restart rAF loop
      this.rafId = requestAnimationFrame(this.animate);
    }
  }
  
  /**
   * Set playback speed multiplier
   * 
   * @param multiplier Speed multiplier (0.1 - 10.0)
   */
  setSpeed(multiplier: number): void {
    this.speed = clampSpeed(multiplier);
  }
  
  /**
   * Get current speed multiplier
   */
  getSpeed(): number {
    return this.speed;
  }
  
  /**
   * Check if animation is currently running
   */
  isRunning(): boolean {
    return this.rafId !== null && !this.isPaused;
  }
  
  /**
   * Check if animation is paused
   */
  isPausedState(): boolean {
    return this.isPaused;
  }
}
