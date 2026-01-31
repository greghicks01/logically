import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * NOR Gate - Multi-input logic gate (2-8 inputs)
 */
export interface NORGate {
  id: string;
  position: Point;
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  name?: string;
}

/**
 * Create a new NOR gate with configurable number of inputs
 */
export function createNORGate(id: string, position: Point, numInputs: number = 2, name?: string): NORGate {
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  const inputPins: Pin[] = [];
  
  // Create input pins vertically spaced
  const spacing = 15;
  const totalHeight = (inputs - 1) * spacing;
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
      state: LogicLevel.HIGH, // NOR defaults to HIGH with all LOW inputs
    },
  };
}

/**
 * Compute NOR gate output based on all inputs (inverted OR)
 */
export function computeNOROutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // NOR logic: inverted OR - HIGH only when all inputs are LOW
  if (inputs.some(input => input === LogicLevel.HIGH)) {
    return LogicLevel.LOW;
  }
  return LogicLevel.HIGH;
}
