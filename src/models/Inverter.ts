import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * Inverter Gate - Single-input gate that inverts the signal
 */
export interface Inverter {
  id: string;
  position: Point;
  inputPin: Pin;
  outputPin: Pin;
  name?: string;
}

/**
 * Create a new inverter gate
 */
export function createInverter(id: string, position: Point, name?: string): Inverter {
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
      state: LogicLevel.HIGH, // Inverted initial state
    },
  };
}

/**
 * Compute inverter output based on input
 */
export function computeInverterOutput(input: LogicLevel): LogicLevel {
  // Check for special states first
  if (input === LogicLevel.CONFLICT) {
    return LogicLevel.CONFLICT;
  }
  if (input === LogicLevel.HI_Z) {
    return LogicLevel.HI_Z;
  }
  // Invert logic: HIGH -> LOW, LOW -> HIGH
  return input === LogicLevel.HIGH ? LogicLevel.LOW : LogicLevel.HIGH;
}
