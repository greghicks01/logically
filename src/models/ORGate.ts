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
 * OR Gate - Multi-input logic gate (2-8 inputs)
 * Uses parametric pin positioning for automatic adaptation to resizing and future rotation support.
 */
export interface ORGate {
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
 * Create a new OR gate with configurable number of inputs.
 * Uses parametric positioning system for pins.
 */
export function createORGate(id: string, position: Point, numInputs: number = 2, name?: string): ORGate {
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
  
  const outputPinSpec: PinSpec = { edge: 'right', t: 0.5, extension: 0 };
  
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
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Compute OR gate output based on all inputs
 */
export function computeOROutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // OR logic: any HIGH input produces HIGH output
  if (inputs.some(input => input === LogicLevel.HIGH)) {
    return LogicLevel.HIGH;
  }
  return LogicLevel.LOW;
}
