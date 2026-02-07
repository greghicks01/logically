import { LogicLevel } from '../models/LogicLevel';

/**
 * Generate all possible input combinations for n inputs
 * Returns 2^n rows with unique binary combinations
 * 
 * Mathematical model: For n inputs, generate binary numbers 0 to 2^n - 1
 * Each number's binary representation gives one input combination
 * MSB (leftmost bit) = first input, LSB (rightmost bit) = last input
 * 
 * Example for 3 inputs:
 * 0 (binary 000) → [false, false, false]
 * 1 (binary 001) → [false, false, true]
 * ...
 * 7 (binary 111) → [true, true, true]
 * 
 * @param inputCount Number of inputs (0-10)
 * @returns Array of boolean arrays representing all combinations
 */
export function generateInputCombinations(inputCount: number): boolean[][] {
  if (inputCount < 0 || inputCount > 10) {
    throw new Error('Input count must be between 0 and 10');
  }
  
  const rowCount = Math.pow(2, inputCount);
  const combinations: boolean[][] = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row: boolean[] = [];
    // Extract each bit from MSB to LSB
    for (let bit = inputCount - 1; bit >= 0; bit--) {
      row.push(((i >> bit) & 1) === 1);
    }
    combinations.push(row);
  }
  
  return combinations;
}

/**
 * Convert boolean array to binary string ID
 * 
 * @param combination Array of boolean values
 * @returns Binary string (e.g., "101")
 */
export function combinationToId(combination: boolean[]): string {
  return combination.map(b => b ? '1' : '0').join('');
}

/**
 * Convert boolean array to logic level record
 * 
 * @param combination Array of boolean values
 * @param pinNames Names of input pins
 * @returns Record mapping pin names to logic levels
 */
export function combinationToInputs(
  combination: boolean[],
  pinNames: string[]
): Record<string, LogicLevel> {
  if (combination.length !== pinNames.length) {
    throw new Error('Combination length must match pin names length');
  }
  
  const inputs: Record<string, LogicLevel> = {};
  pinNames.forEach((name, i) => {
    inputs[name] = combination[i] ? LogicLevel.HIGH : LogicLevel.LOW;
  });
  
  return inputs;
}

/**
 * Check if current inputs match a specific combination
 * 
 * @param currentInputs Current circuit input values
 * @param targetInputs Target combination to match
 * @returns True if all input values match
 */
export function inputsMatch(
  currentInputs: Record<string, LogicLevel>,
  targetInputs: Record<string, LogicLevel>
): boolean {
  const keys = Object.keys(targetInputs);
  return keys.every(key => currentInputs[key] === targetInputs[key]);
}

/**
 * Validate truth table input parameters
 * 
 * @param inputPinCount Number of input pins
 * @param outputPinCount Number of output pins
 * @returns Validation result
 */
export function validateTruthTableParams(
  inputPinCount: number,
  outputPinCount: number
): { valid: boolean; error?: string } {
  if (inputPinCount === 0) {
    return { valid: false, error: 'Gate must have at least one input pin' };
  }
  
  if (inputPinCount > 10) {
    return { valid: false, error: 'Truth tables limited to 10 inputs maximum' };
  }
  
  if (outputPinCount !== 1) {
    return { valid: false, error: 'Gate must have exactly one output pin for truth table' };
  }
  
  return { valid: true };
}

/**
 * Format logic level for display
 * 
 * @param level Logic level value
 * @param format Display format (binary or symbolic)
 * @returns Formatted string
 */
export function formatLogicLevel(
  level: LogicLevel,
  format: 'BINARY' | 'SYMBOLIC'
): string {
  if (format === 'BINARY') {
    return level === LogicLevel.HIGH ? '1' : '0';
  } else {
    return level === LogicLevel.HIGH ? 'HIGH' : 'LOW';
  }
}
