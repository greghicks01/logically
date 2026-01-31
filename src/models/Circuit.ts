import { LogicLevel } from './LogicLevel';
import { Point } from './Point';
import { PinConnection } from './PinConnection';
import { OutputPin } from './Pin';

/**
 * Wire entity representing a connection carrying a logic signal
 */
export interface Wire {
  /** Unique identifier */
  id: string;
  /** Output pin driving this wire (null if undriven) */
  source: PinConnection | null;
  /** Input pins receiving signal */
  destinations: PinConnection[];
  /** Current logic level */
  logicLevel: LogicLevel;
  /** Visual routing path */
  path: Point[];
  /** Computed color from logicLevel */
  color: string;
  /** All sources attempting to drive this wire */
  drivers: OutputPin[];
}

/**
 * Base Component interface
 */
export interface Component {
  id: string;
  type: string;
  position: Point;
}

/**
 * Circuit containing components and wires
 */
export interface Circuit {
  id: string;
  components: Component[];
  wires: Wire[];
  metadata: {
    name: string;
    createdAt: Date;
    modifiedAt: Date;
  };
}

/**
 * Create a new empty circuit
 */
export function createCircuit(name: string): Circuit {
  const now = new Date();
  return {
    id: generateId(),
    components: [],
    wires: [],
    metadata: {
      name,
      createdAt: now,
      modifiedAt: now,
    },
  };
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
