import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { 
  createParametricInputPins, 
  calculateGateBoundingBox, 
  calculatePinPosition,
  PinSpec,
  BoundingBox,
  PinEdge
} from './bases/MultiInputComponent';

/**
 * XOR Gate - Multi-input logic gate (2-8 inputs)
 */
export interface XORGate {
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
 * Create a new XOR gate with configurable number of inputs
 */
export function createXORGate(id: string, position: Point, numInputs: number = 2, name?: string): XORGate {
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
  
  const outputPinSpec: PinSpec = { edge: 'right', t: 0.5, extension: 0 };
  
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
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Compute XOR gate output based on all inputs
 * Multi-input XOR: HIGH when odd number of inputs are HIGH
 */
export function computeXOROutput(...inputs: LogicLevel[]): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  // XOR logic: HIGH when odd number of HIGH inputs
  const highCount = inputs.filter(input => input === LogicLevel.HIGH).length;
  return (highCount % 2 === 1) ? LogicLevel.HIGH : LogicLevel.LOW;
}
