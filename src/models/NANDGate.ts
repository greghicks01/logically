import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { 
  createParametricInputPins,
  calculatePinPosition,
  calculateGateBoundingBox,
  BoundingBox,
  PinSpec
} from './bases/MultiInputComponent';

/**
 * NAND Gate - Multi-input logic gate (2-8 inputs)
 * Uses parametric pin positioning for automatic adaptation to resizing and future rotation support.
 */
export interface NANDGate {
  id: string;
  position: Point;
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  name?: string;
  /** Bounding box for parametric calculations */
  boundingBox: BoundingBox;
  /** Parametric specifications for pins */
  inputPinSpecs: PinSpec[];
  outputPinSpec: PinSpec;
}

/**
 * Create a new NAND gate with configurable number of inputs.
 * Uses parametric positioning system for pins.
 */
export function createNANDGate(id: string, position: Point, numInputs: number = 2, name?: string): NANDGate {
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  
  // Calculate bounding box
  const boundingBox = calculateGateBoundingBox(inputs);
  
  // Create parametric input pins
  const inputPins = createParametricInputPins(id, position, boundingBox, inputs, 'left', 0);
  
  // Create parametric specs (stored for future updates)
  const inputPinSpecs: PinSpec[] = [];
  for (let i = 0; i < inputs; i++) {
    inputPinSpecs.push({
      edge: 'left',
      t: inputs === 1 ? 0.5 : i / (inputs - 1),
      extension: 0
    });
  }
  
  // Output pin with bubble extension (4px beyond bounding box for inversion bubble)
  const outputPinSpec: PinSpec = { edge: 'right', t: 0.5, extension: 4 };
  
  return {
    id,
    position,
    numInputs: inputs,
    inputPins,
    name,
    boundingBox,
    inputPinSpecs,
    outputPinSpec,
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: calculatePinPosition(position, boundingBox, outputPinSpec),
      state: LogicLevel.HIGH, // NAND defaults to HIGH with any LOW input
    },
  };
}

/**
 * Compute NAND gate output based on all inputs (inverted AND)
 */
export function computeNANDOutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // NAND logic: inverted AND - LOW only when all inputs are HIGH
  if (inputs.every(input => input === LogicLevel.HIGH)) {
    return LogicLevel.LOW;
  }
  return LogicLevel.HIGH;
}
