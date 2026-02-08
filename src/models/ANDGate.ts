import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * AND Gate - Multi-input logic gate (2-8 inputs)
 */
export interface ANDGate {
  id: string;
  position: Point;
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  name?: string;
}

/**
 * Create a new AND gate with configurable number of inputs
 */
export function createANDGate(id: string, position: Point, numInputs: number = 2, name?: string): ANDGate {
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  const inputPins: Pin[] = [];
  
  // Create input pins vertically spaced
  const spacing = 15;
  const totalHeight = Math.max(40, (inputs - 1) * spacing + 40);
  const startY = position.y - totalHeight / 2;
  
  for (let i = 0; i < inputs; i++) {
    inputPins.push({
      id: `${id}-in${i}`,
      label: String.fromCharCode(65 + i), // A, B, C, D, E, F, G, H
      position: { x: position.x, y: startY + i * spacing },
      state: LogicLevel.LOW,
    });
  }
  
  return {
    id,
    position,
    numInputs: inputs,
    inputPins,
    name,
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + 60, y: position.y },
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Compute AND gate output based on all inputs
 */
export function computeANDOutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // AND logic: all must be HIGH to output HIGH
  if (inputs.every(input => input === LogicLevel.HIGH)) {
    return LogicLevel.HIGH;
  }
  return LogicLevel.LOW;
}
