import { TruthTable, TruthTableRow } from '../models/TruthTable';
import { MultiInputGate } from '../models/MultiInputGate';
import { Inverter, computeInverterOutput } from '../models/Inverter';
import { Buffer, computeBufferOutput } from '../models/Buffer';
import { LogicLevel } from '../models/LogicLevel';
import {
  generateInputCombinations,
  combinationToId,
  combinationToInputs,
  inputsMatch
} from '../lib/truthTableUtils';

/**
 * Gate component types supported for truth table generation
 */
export type SupportedGateComponent = MultiInputGate | Inverter | Buffer;
export type GateComponentType = 'multi-input' | 'inverter' | 'buffer';


/**
 * Service for generating and managing truth tables for logic gates
 * 
 * Design Pattern: Polymorphism via Type Discriminator
 * - Uses gate 'type' field to compute logic outputs
 * - Single generation algorithm works for all gate types
 * - No separate classes needed per gate type
 */
export class TruthTableGenerator {
  
  /**
   * Generate a complete truth table for any supported gate type
   * 
   * Mathematical model: 2^n rows for n inputs, each row representing
   * one unique binary combination of input values
   * 
   * @param gate The gate component (multi-input, inverter, or buffer)
   * @param componentType Type of component for polymorphic handling
   * @returns Complete truth table with all input/output combinations
   */
  generateForGate(
    gate: SupportedGateComponent,
    componentType: GateComponentType
  ): TruthTable {
    const { inputPins, outputPin, inputCount } = this.extractGateInfo(gate, componentType);
    
    // Generate all possible input combinations (2^n rows)
    const combinations = generateInputCombinations(inputCount);
    
    // Build truth table rows
    const rows: TruthTableRow[] = combinations.map(combo => {
      const inputs = combinationToInputs(combo, inputPins);
      const output = this.computeOutput(gate, componentType, inputs);
      
      return {
        id: combinationToId(combo),
        inputs,
        output,
        isCurrent: false // Will be updated by updateCurrentRow
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
   * Update truth table to mark the row matching current gate inputs
   * 
   * @param table Existing truth table
   * @param gate Current gate state
   * @param componentType Type of component
   * @returns Updated truth table with current row marked
   */
  updateCurrentRow(
    table: TruthTable,
    gate: SupportedGateComponent,
    componentType: GateComponentType
  ): TruthTable {
    const currentInputs = this.getCurrentInputStates(gate, componentType);
    
    const updatedRows = table.rows.map(row => ({
      ...row,
      isCurrent: inputsMatch(currentInputs, row.inputs)
    }));
    
    return {
      ...table,
      rows: updatedRows
    };
  }
  
  /**
   * Extract gate information polymorphically based on component type
   */
  private extractGateInfo(
    gate: SupportedGateComponent,
    componentType: GateComponentType
  ): { inputPins: string[]; outputPin: string; inputCount: number } {
    switch (componentType) {
      case 'multi-input':
        const multiGate = gate as MultiInputGate;
        return {
          inputPins: multiGate.inputPins.map((_, i) => 
            String.fromCharCode(65 + i) // A, B, C, ...
          ),
          outputPin: 'Y',
          inputCount: multiGate.numInputs
        };
        
      case 'inverter':
        return {
          inputPins: ['IN'],
          outputPin: 'OUT',
          inputCount: 1
        };
        
      case 'buffer':
        return {
          inputPins: ['IN'],
          outputPin: 'OUT',
          inputCount: 1
        };
    }
  }
  
  /**
   * Get current input states from gate
   */
  private getCurrentInputStates(
    gate: SupportedGateComponent,
    componentType: GateComponentType
  ): Record<string, LogicLevel> {
    const { inputPins } = this.extractGateInfo(gate, componentType);
    const currentInputs: Record<string, LogicLevel> = {};
    
    switch (componentType) {
      case 'multi-input':
        const multiGate = gate as MultiInputGate;
        inputPins.forEach((name, i) => {
          currentInputs[name] = multiGate.inputPins[i].state;
        });
        break;
        
      case 'inverter':
        const inverter = gate as Inverter;
        currentInputs['IN'] = inverter.inputPin.state;
        break;
        
      case 'buffer':
        const buffer = gate as Buffer;
        currentInputs['IN'] = buffer.inputPin.state;
        break;
    }
    
    return currentInputs;
  }
  
  /**
   * Compute output for given inputs using polymorphic logic
   * 
   * Key polymorphism: Uses gate type discriminator to select logic function
   * instead of separate compute methods per gate class
   */
  private computeOutput(
    gate: SupportedGateComponent,
    componentType: GateComponentType,
    inputs: Record<string, LogicLevel>
  ): LogicLevel {
    switch (componentType) {
      case 'multi-input':
        return this.computeMultiInputGateOutput(gate as MultiInputGate, inputs);
        
      case 'inverter':
        return computeInverterOutput(inputs['IN']);
        
      case 'buffer':
        return computeBufferOutput(inputs['IN']);
    }
  }
  
  /**
   * Compute multi-input gate output polymorphically using type discriminator
   * 
   * Mathematical formulas:
   * - AND:  output = input[0] AND input[1] AND ... input[n]
   * - OR:   output = input[0] OR input[1] OR ... input[n]
   * - NAND: output = NOT(AND(...))
   * - NOR:  output = NOT(OR(...))
   * - XOR:  output = input[0] XOR input[1] XOR ... input[n]
   * - XNOR: output = NOT(XOR(...))
   */
  private computeMultiInputGateOutput(
    gate: MultiInputGate,
    inputs: Record<string, LogicLevel>
  ): LogicLevel {
    const inputValues = Object.values(inputs);
    
    // Handle special states
    if (inputValues.some(v => v === LogicLevel.CONFLICT)) {
      return LogicLevel.CONFLICT;
    }
    if (inputValues.some(v => v === LogicLevel.HI_Z)) {
      return LogicLevel.HI_Z;
    }
    
    // Convert to boolean for logic operations
    const boolInputs = inputValues.map(v => v === LogicLevel.HIGH);
    
    let result: boolean;
    
    switch (gate.type) {
      case 'and':
        // All inputs must be HIGH
        result = boolInputs.every(b => b === true);
        break;
        
      case 'or':
        // Any input must be HIGH
        result = boolInputs.some(b => b === true);
        break;
        
      case 'nand':
        // NOT(AND): Inverted AND
        result = !boolInputs.every(b => b === true);
        break;
        
      case 'nor':
        // NOT(OR): Inverted OR
        result = !boolInputs.some(b => b === true);
        break;
        
      case 'xor':
        // XOR: Odd number of HIGH inputs
        result = boolInputs.filter(b => b === true).length % 2 === 1;
        break;
        
      case 'xnor':
        // XNOR: Even number of HIGH inputs (inverted XOR)
        result = boolInputs.filter(b => b === true).length % 2 === 0;
        break;
        
      default:
        // Should never reach here due to TypeScript type checking
        result = false;
    }
    
    return result ? LogicLevel.HIGH : LogicLevel.LOW;
  }
}

