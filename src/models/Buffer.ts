import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * Buffer Gate - Single-input gate that passes through the signal
 */
export interface Buffer {
  id: string;
  position: Point;
  inputPin: Pin;
  outputPin: Pin;
  name?: string;
}

/**
 * Create a new buffer gate
 */
export function createBuffer(id: string, position: Point, name?: string): Buffer {
  return {
    id,
    position,
    name,
    inputPin: {
      id: `${id}-in`,
      label: 'IN',
      position: { x: position.x, y: position.y },
      state: LogicLevel.LOW,
    },
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + 50, y: position.y },
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Compute buffer output based on input
 */
export function computeBufferOutput(input: LogicLevel): LogicLevel {
  // Buffer simply passes through the input
  return input;
}
