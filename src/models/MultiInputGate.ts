import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { createParametricInputPins, calculateGateBoundingBox, calculatePinPosition } from './bases/MultiInputComponent';

/**
 * Base interface for all multi-input logic gates
 */
export interface MultiInputGate {
  id: string;
  type: 'and' | 'or' | 'nand' | 'nor' | 'xor' | 'xnor';
  position: Point;
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  name?: string;
}

/**
 * Configuration for gate-specific properties
 */
export interface GateConfig {
  type: 'and' | 'or' | 'nand' | 'nor' | 'xor' | 'xnor';
  hasInversionBubble: boolean;
  defaultOutputState: LogicLevel;
  outputOffsetX: number;
}

/**
 * Gate type configurations
 */
export const GATE_CONFIGS: Record<string, GateConfig> = {
  'and': { type: 'and', hasInversionBubble: false, defaultOutputState: LogicLevel.LOW, outputOffsetX: 0 },
  'or': { type: 'or', hasInversionBubble: false, defaultOutputState: LogicLevel.LOW, outputOffsetX: 0 },
  'nand': { type: 'nand', hasInversionBubble: true, defaultOutputState: LogicLevel.HIGH, outputOffsetX: 4 },
  'nor': { type: 'nor', hasInversionBubble: true, defaultOutputState: LogicLevel.HIGH, outputOffsetX: 4 },
  'xor': { type: 'xor', hasInversionBubble: false, defaultOutputState: LogicLevel.LOW, outputOffsetX: 0 },
  'xnor': { type: 'xnor', hasInversionBubble: true, defaultOutputState: LogicLevel.HIGH, outputOffsetX: 4 },
};

/**
 * Create a new multi-input gate with configurable type and number of inputs
 */
export function createMultiInputGate(
  type: 'and' | 'or' | 'nand' | 'nor' | 'xor' | 'xnor',
  id: string,
  position: Point,
  numInputs: number = 2,
  name?: string
): MultiInputGate {
  const config = GATE_CONFIGS[type];
  
  // Clamp inputs between 2 and 8
  const inputs = Math.min(Math.max(numInputs, 2), 8);
  
  // Calculate bounding box for parametric positioning
  const boundingBox = calculateGateBoundingBox(inputs);
  
  // Use parametric positioning system for input pins
  const inputPins = createParametricInputPins(id, position, boundingBox, inputs, 'left', 0);
  
  // Use parametric positioning for output pin
  // For inverted gates (NAND, NOR, XNOR), extension is 4px for the bubble
  const outputPos = calculatePinPosition(
    position,
    boundingBox,
    { edge: 'right', t: 0.5, extension: config.outputOffsetX }
  );
  
  return {
    id,
    type,
    position,
    numInputs: inputs,
    inputPins,
    name,
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: outputPos,
      state: config.defaultOutputState,
    },
  };
}

/**
 * Compute gate output based on type and inputs
 */
export function computeGateOutput(
  type: 'and' | 'or' | 'nand' | 'nor' | 'xor' | 'xnor',
  ...inputs: LogicLevel[]
): LogicLevel {
  // Check for CONFLICT first (highest priority)
  if (inputs.some(input => input === LogicLevel.CONFLICT)) {
    return LogicLevel.CONFLICT;
  }
  // Check for HI_Z (second priority)
  if (inputs.some(input => input === LogicLevel.HI_Z)) {
    return LogicLevel.HI_Z;
  }
  
  switch (type) {
    case 'and':
      // All must be HIGH to output HIGH
      return inputs.every(input => input === LogicLevel.HIGH) 
        ? LogicLevel.HIGH 
        : LogicLevel.LOW;
    
    case 'or':
      // Any HIGH input produces HIGH output
      return inputs.some(input => input === LogicLevel.HIGH) 
        ? LogicLevel.HIGH 
        : LogicLevel.LOW;
    
    case 'nand':
      // Inverted AND - LOW only when all inputs are HIGH
      return inputs.every(input => input === LogicLevel.HIGH) 
        ? LogicLevel.LOW 
        : LogicLevel.HIGH;
    
    case 'nor':
      // Inverted OR - HIGH only when all inputs are LOW
      return inputs.every(input => input === LogicLevel.LOW) 
        ? LogicLevel.HIGH 
        : LogicLevel.LOW;
    
    case 'xor':
      // Odd number of HIGH inputs produces HIGH output
      const highCount = inputs.filter(input => input === LogicLevel.HIGH).length;
      return (highCount % 2 === 1) ? LogicLevel.HIGH : LogicLevel.LOW;
    
    case 'xnor':
      // Even number of HIGH inputs produces HIGH output (inverted XOR)
      const highCountXnor = inputs.filter(input => input === LogicLevel.HIGH).length;
      return (highCountXnor % 2 === 0) ? LogicLevel.HIGH : LogicLevel.LOW;
    
    default:
      return LogicLevel.LOW;
  }
}
