import { Circuit } from './Circuit';
import { ICPin } from './ICPin';
import { Point } from './Point';

/**
 * Composite IC - User-created component from other components
 */
export interface CompositeIC {
  /** Unique identifier */
  id: string;
  /** IC name (must be unique in library) */
  name: string;
  /** Optional description */
  description?: string;
  
  /** Input pins (external interface) */
  inputPins: ICPin[];
  /** Output pins (external interface) */
  outputPins: ICPin[];
  
  /** Internal circuit encapsulation */
  internalCircuit: Circuit;
  
  /** Nesting level (1 = no nesting, 2+ = nested ICs) */
  nestingLevel: number;
  
  /** Creation/modification timestamps */
  createdAt: Date;
  modifiedAt: Date;
  
  /** Visual representation when placed */
  position?: Point;
  boundingBox: { width: number; height: number };
}

/**
 * Create a new composite IC
 */
export function createCompositeIC(config: {
  id: string;
  name: string;
  description?: string;
  inputPins: ICPin[];
  outputPins: ICPin[];
  internalCircuit: Circuit;
  nestingLevel: number;
}): CompositeIC {
  const now = new Date();
  return {
    ...config,
    createdAt: now,
    modifiedAt: now,
    boundingBox: calculateBoundingBox(config.inputPins.length, config.outputPins.length),
  };
}

/**
 * Calculate bounding box size based on pin count
 */
function calculateBoundingBox(inputCount: number, outputCount: number): { width: number; height: number } {
  const maxPins = Math.max(inputCount, outputCount);
  const height = Math.max(60, maxPins * 20 + 20);
  const width = 120;
  return { width, height };
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate composite IC
 */
export function validateCompositeIC(ic: CompositeIC): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check name
  if (!ic.name || ic.name.trim().length === 0) {
    errors.push('IC name cannot be empty');
  }

  // Check pins
  if (ic.inputPins.length === 0 && ic.outputPins.length === 0) {
    errors.push('IC must have at least one input or output pin');
  }

  // Check nesting level
  if (ic.nestingLevel > 10) {
    warnings.push(
      `Warning: ${ic.nestingLevel} levels of nesting may impact performance (recommended: ≤10)`
    );
  }

  // Check internal circuit
  if (!ic.internalCircuit) {
    errors.push('Internal circuit is required');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
