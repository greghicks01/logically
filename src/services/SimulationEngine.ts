import { Circuit } from '../models/Circuit';
import { Wire, createWire } from '../models/Wire';
import { LogicLevel } from '../models/LogicLevel';
import { OutputPin } from '../models/Pin';
import { PinConnection } from '../models/PinConnection';
import { WireStateCalculator } from '../lib/WireStateCalculator';
import { Point } from '../models/Point';

/**
 * Wire state change event
 */
export interface WireStateChangedEvent {
  wireId: string;
  oldState: LogicLevel;
  newState: LogicLevel;
}

/**
 * Wire conflict detected event
 */
export interface WireConflictEvent {
  wireId: string;
  drivers: OutputPin[];
}

type EventCallback = (event: any) => void;

/**
 * Simulation engine for logic propagation
 */
export class SimulationEngine {
  private circuit: Circuit;
  private propagationQueue: Wire[] = [];
  private wireMap: Map<string, Wire> = new Map();
  private eventListeners: Map<string, EventCallback[]> = new Map();

  constructor(circuit: Circuit) {
    this.circuit = circuit;
    this.initializeWireMap();
  }

  private initializeWireMap(): void {
    this.circuit.wires.forEach((wire) => {
      this.wireMap.set(wire.id, wire);
    });
  }

  /**
   * Create a new wire
   */
  createWire(config: {
    id: string;
    source: PinConnection | null;
    destinations: PinConnection[];
    path: Point[];
  }): Wire {
    const wire = createWire(config.id, config.source, config.destinations, config.path);
    this.circuit.wires.push(wire);
    this.wireMap.set(wire.id, wire);
    return wire;
  }

  /**
   * Update wire state (must complete in <100ms per SC-002)
   */
  updateWireState(wireId: string, newState: LogicLevel): void {
    const wire = this.wireMap.get(wireId);
    if (!wire) {
      console.warn(`Wire ${wireId} not found`);
      return;
    }

    const oldState = wire.logicLevel;
    if (oldState === newState) {
      return; // No change needed
    }

    wire.setState(newState);

    // Emit state change event
    this.emit('wire-state-changed', {
      wireId,
      oldState,
      newState,
    });

    // Check for conflicts
    if (WireStateCalculator.detectConflict(wire.getDrivers())) {
      wire.setState(LogicLevel.CONFLICT);
      this.emit('wire-conflict-detected', {
        wireId,
        drivers: wire.getDrivers(),
      });
    }
  }

  /**
   * Bulk update multiple wire states for performance
   * Must handle 100 wires in <100ms per SC-002
   */
  bulkUpdateWireStates(updates: Array<{ wireId: string; newState: LogicLevel }>): void {
    const startTime = performance.now();

    updates.forEach(({ wireId, newState }) => {
      this.updateWireState(wireId, newState);
    });

    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Bulk update took ${duration}ms (target: <100ms)`);
    }
  }

  /**
   * Detect wire conflict
   */
  detectWireConflict(wireId: string): boolean {
    const wire = this.wireMap.get(wireId);
    if (!wire) return false;

    return WireStateCalculator.detectConflict(wire.getDrivers());
  }

  /**
   * Propagate signal through the circuit
   */
  propagate(): void {
    const startTime = performance.now();

    while (this.propagationQueue.length > 0) {
      const wire = this.propagationQueue.shift()!;
      const newState = WireStateCalculator.calculateState(wire.getDrivers());
      
      if (newState !== wire.logicLevel) {
        this.updateWireState(wire.id, newState);
        this.enqueueAffectedGates(wire);
      }
    }

    const duration = performance.now() - startTime;
    if (duration > 100) {
      console.warn(`Propagation took ${duration}ms (target: <100ms for 50 gates)`);
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => callback(data));
    }
  }

  /**
   * Add affected gates to propagation queue
   */
  private enqueueAffectedGates(wire: Wire): void {
    // Find all wires connected to destinations of this wire
    wire.destinations.forEach((dest) => {
      const affectedWires = this.circuit.wires.filter((w) => 
        w.source?.componentId === dest.componentId
      );
      affectedWires.forEach((w) => {
        if (!this.propagationQueue.includes(w)) {
          this.propagationQueue.push(w);
        }
      });
    });
  }
}
