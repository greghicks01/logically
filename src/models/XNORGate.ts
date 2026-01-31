import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * XNOR Gate - Multi-input logic gate (2-8 inputs)
 */
export interface XNORGate {
  id: string;
  position: Point;
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  name?: string;
}

/**
 * Create a new XNOR gate with configurable number of inputs
 */
export function createXNORGate(id: string, position: Point, numInputs: number = 2, name?: string): XNORGate {
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  const inputPins: Pin[] = [];
  
  // Create input pins vertically spaced
  const spacing = 15;
  const totalHeight = Math.max(40, (inputs - 1) * spacing + 20);
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
      position: { x: position.x + 64, y: position.y }, // After the bubble (52 + 6 radius + 6)
      state: LogicLevel.HIGH, // XNOR defaults to HIGH with even number of HIGH inputs (0 is even)
    },
  };
}

/**
 * Compute XNOR gate output based on all inputs (inverted XOR)
 * Multi-input XNOR: HIGH when even number of inputs are HIGH
 */
export function computeXNOROutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // XNOR logic: HIGH when even number of HIGH inputs (inverted XOR)
  const highCount = inputs.filter(input => input === LogicLevel.HIGH).length;
  return (highCount % 2 === 0) ? LogicLevel.HIGH : LogicLevel.LOW;
}
