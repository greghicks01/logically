import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * Switch - Toggle input component
 */
export interface Switch {
  id: string;
  position: Point;
  outputPin: Pin;
  state: boolean; // true = HIGH, false = LOW
}

/**
 * Create a new switch
 */
export function createSwitch(id: string, position: Point): Switch {
  return {
    id,
    position,
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + 50, y: position.y + 15 }, // Outside the switch body (40px width + 10px offset)
      state: LogicLevel.LOW,
    },
    state: false,
  };
}

/**
 * Toggle switch state
 */
export function toggleSwitch(sw: Switch): Switch {
  const newState = !sw.state;
  return {
    ...sw,
    state: newState,
    outputPin: {
      ...sw.outputPin,
      state: newState ? LogicLevel.HIGH : LogicLevel.LOW,
    },
  };
}
