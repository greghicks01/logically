import { LogicLevel } from './LogicLevel';

/**
 * Gate types supported by the simulator
 */
export enum GateType {
  NOT = 'NOT',
  BUFFER = 'BUFFER',
  AND = 'AND',
  OR = 'OR',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR'
}

/**
 * Represents a signal propagation event in the simulation queue
 */
export interface PropagationEvent {
  /** Unique identifier for this event */
  id: string;
  
  /** Component receiving the signal change (wire or gate) */
  targetId: string;
  
  /** Type of target component */
  targetType: 'WIRE' | 'GATE';
  
  /** New logic level value */
  newLevel: LogicLevel;
  
  /** Previous logic level value */
  previousLevel: LogicLevel;
  
  /** Scheduled time for this event (milliseconds from simulation start) */
  scheduledTime: number;
  
  /** Duration of visual animation (milliseconds) */
  animationDuration: number;
  
  /** Source component that triggered this event */
  sourceId: string;
  
  /** Gate type (for realistic delay calculation) */
  gateType?: GateType;
  
  /** Whether this event has been processed */
  completed: boolean;
}

/**
 * Priority queue for managing propagation events
 */
export interface PropagationQueue {
  /** Ordered list of pending events (sorted by scheduledTime) */
  events: PropagationEvent[];
  
  /** Current simulation time (milliseconds) */
  currentTime: number;
  
  /** Simulation start timestamp (for synchronization) */
  startTime: number;
  
  /** Events that have completed */
  history: PropagationEvent[];
}
