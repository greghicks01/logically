import { LogicLevel } from './LogicLevel';

/**
 * Represents a single row in a truth table
 */
export interface TruthTableRow {
  /** Input pin values for this combination, keyed by pin name */
  inputs: Record<string, LogicLevel>;
  
  /** Output value for this input combination */
  output: LogicLevel;
  
  /** Whether this row matches the current circuit state */
  isCurrent: boolean;
  
  /** Unique identifier for this row (binary representation) */
  id: string;
}

/**
 * Complete truth table data structure for a gate
 */
export interface TruthTable {
  /** ID of the gate this truth table represents */
  gateId: string;
  
  /** Ordered list of input pin names */
  inputPins: string[];
  
  /** Output pin name */
  outputPin: string;
  
  /** All possible input/output combinations (2^n rows) */
  rows: TruthTableRow[];
  
  /** Whether this truth table is currently visible in UI */
  isVisible: boolean;
  
  /** Timestamp of last generation (for cache invalidation) */
  generatedAt: number;
}

/**
 * User preferences for truth table display
 */
export interface TruthTablePreferences {
  /** Show binary (0/1) vs symbolic (LOW/HIGH) values */
  displayFormat: 'BINARY' | 'SYMBOLIC';
  
  /** Automatically scroll to current row */
  autoScroll: boolean;
  
  /** Show row numbers */
  showRowNumbers: boolean;
  
  /** Highlight current row */
  highlightCurrentRow: boolean;
  
  /** Column width (pixels or 'auto') */
  columnWidth: number | 'auto';
}

export const DEFAULT_TRUTH_TABLE_PREFERENCES: TruthTablePreferences = {
  displayFormat: 'SYMBOLIC',
  autoScroll: true,
  showRowNumbers: false,
  highlightCurrentRow: true,
  columnWidth: 'auto'
};
