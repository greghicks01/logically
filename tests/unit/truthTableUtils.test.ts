import {
  generateInputCombinations,
  combinationToId,
  combinationToInputs,
  inputsMatch,
  validateTruthTableParams,
  formatLogicLevel
} from '../../src/lib/truthTableUtils';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('truthTableUtils', () => {
  describe('generateInputCombinations', () => {
    it('generates 2^n combinations for n inputs', () => {
      expect(generateInputCombinations(0)).toHaveLength(1);  // 2^0 = 1
      expect(generateInputCombinations(1)).toHaveLength(2);  // 2^1 = 2
      expect(generateInputCombinations(2)).toHaveLength(4);  // 2^2 = 4
      expect(generateInputCombinations(3)).toHaveLength(8);  // 2^3 = 8
      expect(generateInputCombinations(6)).toHaveLength(64); // 2^6 = 64
    });
    
    it('covers all binary combinations without duplicates', () => {
      const combos = generateInputCombinations(3);
      const stringified = combos.map(c => c.map(b => b ? '1' : '0').join(''));
      
      // All unique
      expect(new Set(stringified).size).toBe(8);
      
      // All combinations present
      expect(stringified.sort()).toEqual([
        '000', '001', '010', '011', '100', '101', '110', '111'
      ]);
    });
    
    it('maintains correct bit order (MSB first)', () => {
      const combos = generateInputCombinations(2);
      expect(combos[0]).toEqual([false, false]); // 00
      expect(combos[1]).toEqual([false, true]);  // 01
      expect(combos[2]).toEqual([true, false]);  // 10
      expect(combos[3]).toEqual([true, true]);   // 11
    });
    
    it('handles edge case of 0 inputs', () => {
      const combos = generateInputCombinations(0);
      expect(combos).toEqual([[]]);
    });
    
    it('handles edge case of 1 input', () => {
      const combos = generateInputCombinations(1);
      expect(combos).toEqual([[false], [true]]);
    });
    
    it('throws error for negative input count', () => {
      expect(() => generateInputCombinations(-1)).toThrow('Input count must be between 0 and 10');
    });
    
    it('throws error for input count > 10', () => {
      expect(() => generateInputCombinations(11)).toThrow('Input count must be between 0 and 10');
    });
  });
  
  describe('combinationToId', () => {
    it('converts boolean array to binary string', () => {
      expect(combinationToId([false, false, false])).toBe('000');
      expect(combinationToId([false, false, true])).toBe('001');
      expect(combinationToId([true, false, true])).toBe('101');
      expect(combinationToId([true, true, true])).toBe('111');
    });
    
    it('handles empty array', () => {
      expect(combinationToId([])).toBe('');
    });
    
    it('handles single element', () => {
      expect(combinationToId([false])).toBe('0');
      expect(combinationToId([true])).toBe('1');
    });
  });
  
  describe('combinationToInputs', () => {
    it('maps boolean values to logic levels', () => {
      const result = combinationToInputs(
        [false, true, false],
        ['A', 'B', 'C']
      );
      
      expect(result).toEqual({
        A: LogicLevel.LOW,
        B: LogicLevel.HIGH,
        C: LogicLevel.LOW
      });
    });
    
    it('handles custom pin names', () => {
      const result = combinationToInputs(
        [true, false],
        ['SET', 'RESET']
      );
      
      expect(result).toEqual({
        SET: LogicLevel.HIGH,
        RESET: LogicLevel.LOW
      });
    });
    
    it('throws error if lengths do not match', () => {
      expect(() => combinationToInputs([true, false], ['A'])).toThrow(
        'Combination length must match pin names length'
      );
    });
    
    it('handles empty arrays', () => {
      const result = combinationToInputs([], []);
      expect(result).toEqual({});
    });
  });
  
  describe('inputsMatch', () => {
    it('returns true when all inputs match', () => {
      const current = {
        A: LogicLevel.HIGH,
        B: LogicLevel.LOW,
        C: LogicLevel.HIGH
      };
      
      const target = {
        A: LogicLevel.HIGH,
        B: LogicLevel.LOW,
        C: LogicLevel.HIGH
      };
      
      expect(inputsMatch(current, target)).toBe(true);
    });
    
    it('returns false when any input differs', () => {
      const current = {
        A: LogicLevel.HIGH,
        B: LogicLevel.LOW,
        C: LogicLevel.HIGH
      };
      
      const target = {
        A: LogicLevel.HIGH,
        B: LogicLevel.HIGH, // Different
        C: LogicLevel.HIGH
      };
      
      expect(inputsMatch(current, target)).toBe(false);
    });
    
    it('handles empty inputs', () => {
      expect(inputsMatch({}, {})).toBe(true);
    });
    
    it('checks only target keys (ignores extra current keys)', () => {
      const current = {
        A: LogicLevel.HIGH,
        B: LogicLevel.LOW,
        EXTRA: LogicLevel.HIGH
      };
      
      const target = {
        A: LogicLevel.HIGH,
        B: LogicLevel.LOW
      };
      
      expect(inputsMatch(current, target)).toBe(true);
    });
  });
  
  describe('validateTruthTableParams', () => {
    it('passes validation for valid params', () => {
      const result = validateTruthTableParams(2, 1);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('fails when input count is 0', () => {
      const result = validateTruthTableParams(0, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Gate must have at least one input pin');
    });
    
    it('fails when input count > 10', () => {
      const result = validateTruthTableParams(11, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Truth tables limited to 10 inputs maximum');
    });
    
    it('fails when output count is not 1', () => {
      const result = validateTruthTableParams(2, 0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Gate must have exactly one output pin for truth table');
      
      const result2 = validateTruthTableParams(2, 2);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Gate must have exactly one output pin for truth table');
    });
    
    it('accepts maximum valid input count', () => {
      const result = validateTruthTableParams(10, 1);
      expect(result.valid).toBe(true);
    });
  });
  
  describe('formatLogicLevel', () => {
    it('formats as binary when requested', () => {
      expect(formatLogicLevel(LogicLevel.HIGH, 'BINARY')).toBe('1');
      expect(formatLogicLevel(LogicLevel.LOW, 'BINARY')).toBe('0');
    });
    
    it('formats as symbolic when requested', () => {
      expect(formatLogicLevel(LogicLevel.HIGH, 'SYMBOLIC')).toBe('HIGH');
      expect(formatLogicLevel(LogicLevel.LOW, 'SYMBOLIC')).toBe('LOW');
    });
  });
});
