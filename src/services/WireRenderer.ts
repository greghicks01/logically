import { Wire } from '../models/Wire';
import { Point } from '../models/Point';
import { LogicLevel } from '../models/LogicLevel';

/**
 * Wire segment for dirty rectangle tracking
 */
interface WireSegment {
  wire: Wire;
  startPoint: Point;
  endPoint: Point;
}

/**
 * Wire renderer using Canvas API
 * Implements dirty rectangle optimization for efficient redraw
 */
export class WireRenderer {
  private ctx: CanvasRenderingContext2D;
  private dirtyWires: Set<string> = new Set();
  private wireSegments: Map<string, WireSegment[]> = new Map();
  private animationFrameId: number | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  /**
   * Mark wire as dirty for next render
   */
  markDirty(wireId: string): void {
    this.dirtyWires.add(wireId);
    this.scheduleRender();
  }

  /**
   * Schedule render using requestAnimationFrame for 60 FPS
   */
  private scheduleRender(): void {
    if (this.animationFrameId !== null) {
      return; // Already scheduled
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.render();
      this.animationFrameId = null;
    });
  }

  /**
   * Render all dirty wires
   */
  private render(): void {
    if (this.dirtyWires.size === 0) {
      return;
    }

    // Render each dirty wire
    this.dirtyWires.forEach((wireId) => {
      const segments = this.wireSegments.get(wireId);
      if (segments) {
        segments.forEach((segment) => {
          this.renderWire(segment.wire);
        });
      }
    });

    this.dirtyWires.clear();
  }

  /**
   * Render a single wire
   */
  renderWire(wire: Wire): void {
    if (wire.path.length < 2) {
      return; // Need at least 2 points
    }

    this.ctx.strokeStyle = wire.color;
    this.ctx.beginPath();
    
    const start = wire.path[0];
    this.ctx.moveTo(start.x, start.y);

    for (let i = 1; i < wire.path.length; i++) {
      const point = wire.path[i];
      this.ctx.lineTo(point.x, point.y);
    }

    this.ctx.stroke();
  }

  /**
   * Render all wires (full redraw)
   */
  renderAll(wires: Wire[]): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    
    wires.forEach((wire) => {
      this.renderWire(wire);
      
      // Build wire segments for dirty tracking
      const segments: WireSegment[] = [];
      for (let i = 0; i < wire.path.length - 1; i++) {
        segments.push({
          wire,
          startPoint: wire.path[i],
          endPoint: wire.path[i + 1],
        });
      }
      this.wireSegments.set(wire.id, segments);
    });
  }

  /**
   * Update wire color (triggers rerender)
   */
  updateWireColor(wireId: string, wire: Wire): void {
    this.markDirty(wireId);
  }

  /**
   * Clear canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.dirtyWires.clear();
    this.wireSegments.clear();
  }

  /**
   * Dispose renderer and cancel pending animations
   */
  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clear();
  }
}
