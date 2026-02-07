import { TruthTable, TruthTableRow } from '../models/TruthTable';
import { LogicLevel } from '../models/LogicLevel';
import {
  generateInputCombinations,
  combinationToId,
  combinationToInputs,
  validateTruthTableParams,
  inputsMatch
} from '../lib/truthTableUtils';

/**
 * Gate interface for truth table generation
 */
export interface Gate {
  id: string;
  type: string;
  inputPins: Pin[];
  outputPins: Pin[];
  evaluateOutput: (inputs: Record<string, LogicLevel>) => LogicLevel;
}

export interface Pin {
  id: string;
  name: string;
  type: 'INPUT' | 'OUTPUT';
}

/**
 * Generate a complete truth table for a gate
 * 
 * @param gate Gate to generate truth table for
 * @returns Complete truth table
 * @throws Error if gate configuration is invalid
 */
export function generateTruthTable(gate: Gate): TruthTable {
  // Validate parameters
  const validation = validateTruthTableParams(
    gate.inputPins.length,
    gate.outputPins.length
  );
  
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  if (!gate.evaluateOutput) {
    throw new Error('Gate must have evaluateOutput function');
  }
  
  // Extract pin names
  const inputPins = gate.inputPins.map(p => p.name);
  const outputPin = gate.outputPins[0].name;
  
  // Generate all input combinations
  const combinations = generateInputCombinations(inputPins.length);
  
  // Create rows by evaluating gate for each combination
  const rows: TruthTableRow[] = combinations.map(combo => {
    const inputs = combinationToInputs(combo, inputPins);
    const output = gate.evaluateOutput(inputs);
    const id = combinationToId(combo);
    
    return {
      id,
      inputs,
      output,
      isCurrent: false
    };
  });
  
  return {
    gateId: gate.id,
    inputPins,
    outputPin,
    rows,
    isVisible: false,
    generatedAt: Date.now()
  };
}

/**
 * Update which row is marked as current based on circuit state
 * 
 * @param table Existing truth table
 * @param currentInputs Current logic levels of gate inputs
 * @returns New truth table with updated isCurrent flags
 */
export function updateCurrentState(
  table: TruthTable,
  currentInputs: Record<string, LogicLevel>
): TruthTable {
  const rows = table.rows.map(row => ({
    ...row,
    isCurrent: inputsMatch(currentInputs, row.inputs)
  }));
  
  return {
    ...table,
    rows
  };
}

/**
 * Toggle truth table visibility
 * 
 * @param table Existing truth table
 * @param visible Visibility state
 * @returns New truth table with updated visibility
 */
export function setTruthTableVisibility(
  table: TruthTable,
  visible: boolean
): TruthTable {
  return {
    ...table,
    isVisible: visible
  };
}

/**
 * Check if truth table needs regeneration
 * Useful for caching/memoization
 * 
 * @param table Existing truth table
 * @param gate Current gate configuration
 * @returns True if regeneration needed
 */
export function needsRegeneration(table: TruthTable, gate: Gate): boolean {
  // Check if input pins changed
  const currentPinNames = gate.inputPins.map(p => p.name);
  if (currentPinNames.length !== table.inputPins.length) {
    return true;
  }
  
  for (let i = 0; i < currentPinNames.length; i++) {
    if (currentPinNames[i] !== table.inputPins[i]) {
      return true;
    }
  }
  
  // Check if output pin changed
  if (gate.outputPins[0]?.name !== table.outputPin) {
    return true;
  }
  
  return false;
}
