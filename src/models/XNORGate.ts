import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { 
  createParametricInputPins, 
  calculateGateBoundingBox, 
  calculatePinPosition,
  PinSpec,
  BoundingBox
} from './bases/MultiInputComponent';

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
  boundingBox: BoundingBox;
  inputPinSpecs: PinSpec[];
  outputPinSpec: PinSpec;
}

/**
 * Create a new XNOR gate with configurable number of inputs
 */
export function createXNORGate(id: string, position: Point, numInputs: number = 2, name?: string): XNORGate {
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  
  // Calculate bounding box
  const boundingBox = calculateGateBoundingBox(inputs, 60, 40);
  
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
  
  const outputPinSpec: PinSpec = { edge: 'right', t: 0.5, extension: 4 }; // 4px extension for bubble
  
  // Create output pin
  const outputPosition = calculatePinPosition(position, boundingBox, outputPinSpec);
  
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
      position: outputPosition,
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
