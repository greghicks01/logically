import { TruthTableGenerator } from '../../src/services/TruthTableGenerator';
import { createMultiInputGate } from '../../src/models/MultiInputGate';
import { createInverter } from '../../src/models/Inverter';
import { createBuffer } from '../../src/models/Buffer';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('TruthTableGenerator', () => {
  let generator: TruthTableGenerator;

  beforeEach(() => {
    generator = new TruthTableGenerator();
  });

  describe('generateForGate - AND gate', () => {
    it('generates correct truth table for 2-input AND gate', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(andGate, 'multi-input');

      expect(table.gateId).toBe('and-1');
      expect(table.inputPins).toEqual(['A', 'B']);
      expect(table.outputPin).toBe('Y');
      expect(table.rows).toHaveLength(4); // 2^2 = 4

      // Verify AND logic: output HIGH only when all inputs HIGH
      expect(table.rows[0].inputs).toEqual({ A: LogicLevel.LOW, B: LogicLevel.LOW });
      expect(table.rows[0].output).toBe(LogicLevel.LOW);

      expect(table.rows[1].inputs).toEqual({ A: LogicLevel.LOW, B: LogicLevel.HIGH });
      expect(table.rows[1].output).toBe(LogicLevel.LOW);

      expect(table.rows[2].inputs).toEqual({ A: LogicLevel.HIGH, B: LogicLevel.LOW });
      expect(table.rows[2].output).toBe(LogicLevel.LOW);

      expect(table.rows[3].inputs).toEqual({ A: LogicLevel.HIGH, B: LogicLevel.HIGH });
      expect(table.rows[3].output).toBe(LogicLevel.HIGH); // Only this is HIGH
    });

    it('generates correct truth table for 3-input AND gate', () => {
      const andGate = createMultiInputGate('and', 'and-3', { x: 0, y: 0 }, 3);
      const table = generator.generateForGate(andGate, 'multi-input');

      expect(table.inputPins).toEqual(['A', 'B', 'C']);
      expect(table.rows).toHaveLength(8); // 2^3 = 8

      // Only the last row (all HIGH) should output HIGH
      const allHighRow = table.rows[7];
      expect(allHighRow.inputs).toEqual({
        A: LogicLevel.HIGH,
        B: LogicLevel.HIGH,
        C: LogicLevel.HIGH
      });
      expect(allHighRow.output).toBe(LogicLevel.HIGH);

      // All other rows should be LOW
      for (let i = 0; i < 7; i++) {
        expect(table.rows[i].output).toBe(LogicLevel.LOW);
      }
    });

    it('generates unique row IDs based on binary representation', () => {
      const andGate = createMultiInputGate('and', 'and-2', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(andGate, 'multi-input');

      expect(table.rows[0].id).toBe('00');
      expect(table.rows[1].id).toBe('01');
      expect(table.rows[2].id).toBe('10');
      expect(table.rows[3].id).toBe('11');
    });

    it('marks no row as current by default', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(andGate, 'multi-input');

      expect(table.rows.every(row => row.isCurrent === false)).toBe(true);
    });

    it('sets isVisible to false by default', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(andGate, 'multi-input');

      expect(table.isVisible).toBe(false);
    });

    it('sets generation timestamp', () => {
      const beforeTime = Date.now();
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(andGate, 'multi-input');
      const afterTime = Date.now();

      expect(table.generatedAt).toBeGreaterThanOrEqual(beforeTime);
      expect(table.generatedAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('generateForGate - OR gate', () => {
    it('generates correct truth table for 2-input OR gate', () => {
      const orGate = createMultiInputGate('or', 'or-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(orGate, 'multi-input');

      // Verify OR logic: output HIGH when any input HIGH
      expect(table.rows[0].output).toBe(LogicLevel.LOW);  // 00 -> LOW
      expect(table.rows[1].output).toBe(LogicLevel.HIGH); // 01 -> HIGH
      expect(table.rows[2].output).toBe(LogicLevel.HIGH); // 10 -> HIGH
      expect(table.rows[3].output).toBe(LogicLevel.HIGH); // 11 -> HIGH
    });
  });

  describe('generateForGate - NAND gate', () => {
    it('generates correct truth table for 2-input NAND gate', () => {
      const nandGate = createMultiInputGate('nand', 'nand-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(nandGate, 'multi-input');

      // Verify NAND logic: inverted AND
      expect(table.rows[0].output).toBe(LogicLevel.HIGH); // 00 -> HIGH
      expect(table.rows[1].output).toBe(LogicLevel.HIGH); // 01 -> HIGH
      expect(table.rows[2].output).toBe(LogicLevel.HIGH); // 10 -> HIGH
      expect(table.rows[3].output).toBe(LogicLevel.LOW);  // 11 -> LOW (only this)
    });
  });

  describe('generateForGate - NOR gate', () => {
    it('generates correct truth table for 2-input NOR gate', () => {
      const norGate = createMultiInputGate('nor', 'nor-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(norGate, 'multi-input');

      // Verify NOR logic: inverted OR
      expect(table.rows[0].output).toBe(LogicLevel.HIGH); // 00 -> HIGH (only this)
      expect(table.rows[1].output).toBe(LogicLevel.LOW);  // 01 -> LOW
      expect(table.rows[2].output).toBe(LogicLevel.LOW);  // 10 -> LOW
      expect(table.rows[3].output).toBe(LogicLevel.LOW);  // 11 -> LOW
    });
  });

  describe('generateForGate - XOR gate', () => {
    it('generates correct truth table for 2-input XOR gate', () => {
      const xorGate = createMultiInputGate('xor', 'xor-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(xorGate, 'multi-input');

      // Verify XOR logic: HIGH when inputs differ
      expect(table.rows[0].output).toBe(LogicLevel.LOW);  // 00 -> LOW
      expect(table.rows[1].output).toBe(LogicLevel.HIGH); // 01 -> HIGH
      expect(table.rows[2].output).toBe(LogicLevel.HIGH); // 10 -> HIGH
      expect(table.rows[3].output).toBe(LogicLevel.LOW);  // 11 -> LOW
    });
  });

  describe('generateForGate - XNOR gate', () => {
    it('generates correct truth table for 2-input XNOR gate', () => {
      const xnorGate = createMultiInputGate('xnor', 'xnor-1', { x: 0, y: 0 }, 2);
      const table = generator.generateForGate(xnorGate, 'multi-input');

      // Verify XNOR logic: inverted XOR (HIGH when inputs match)
      expect(table.rows[0].output).toBe(LogicLevel.HIGH); // 00 -> HIGH
      expect(table.rows[1].output).toBe(LogicLevel.LOW);  // 01 -> LOW
      expect(table.rows[2].output).toBe(LogicLevel.LOW);  // 10 -> LOW
      expect(table.rows[3].output).toBe(LogicLevel.HIGH); // 11 -> HIGH
    });
  });

  describe('generateForGate - Inverter', () => {
    it('generates correct truth table for inverter (NOT)', () => {
      const inverter = createInverter('inv-1', { x: 0, y: 0 });
      const table = generator.generateForGate(inverter, 'inverter');

      expect(table.inputPins).toEqual(['IN']);
      expect(table.outputPin).toBe('OUT');
      expect(table.rows).toHaveLength(2); // 2^1 = 2

      // Verify NOT logic
      expect(table.rows[0].inputs).toEqual({ IN: LogicLevel.LOW });
      expect(table.rows[0].output).toBe(LogicLevel.HIGH);

      expect(table.rows[1].inputs).toEqual({ IN: LogicLevel.HIGH });
      expect(table.rows[1].output).toBe(LogicLevel.LOW);
    });
  });

  describe('generateForGate - Buffer', () => {
    it('generates correct truth table for buffer', () => {
      const buffer = createBuffer('buf-1', { x: 0, y: 0 });
      const table = generator.generateForGate(buffer, 'buffer');

      expect(table.inputPins).toEqual(['IN']);
      expect(table.outputPin).toBe('OUT');
      expect(table.rows).toHaveLength(2);

      // Verify Buffer logic (pass-through)
      expect(table.rows[0].inputs).toEqual({ IN: LogicLevel.LOW });
      expect(table.rows[0].output).toBe(LogicLevel.LOW);

      expect(table.rows[1].inputs).toEqual({ IN: LogicLevel.HIGH });
      expect(table.rows[1].output).toBe(LogicLevel.HIGH);
    });
  });

  describe('updateCurrentRow', () => {
    it('marks the row matching current gate inputs as current', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      
      // Set gate inputs to HIGH, LOW
      andGate.inputPins[0].state = LogicLevel.HIGH;
      andGate.inputPins[1].state = LogicLevel.LOW;
      
      let table = generator.generateForGate(andGate, 'multi-input');
      table = generator.updateCurrentRow(table, andGate, 'multi-input');

      // Row 2 (10 in binary) should be marked as current
      expect(table.rows[0].isCurrent).toBe(false); // 00
      expect(table.rows[1].isCurrent).toBe(false); // 01
      expect(table.rows[2].isCurrent).toBe(true);  // 10 - matches HIGH, LOW
      expect(table.rows[3].isCurrent).toBe(false); // 11
    });

    it('marks only one row as current', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      andGate.inputPins[0].state = LogicLevel.LOW;
      andGate.inputPins[1].state = LogicLevel.HIGH;
      
      let table = generator.generateForGate(andGate, 'multi-input');
      table = generator.updateCurrentRow(table, andGate, 'multi-input');

      const currentRows = table.rows.filter(row => row.isCurrent);
      expect(currentRows).toHaveLength(1);
      expect(currentRows[0].id).toBe('01');
    });

    it('handles no matching row gracefully', () => {
      const andGate = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      
      // Set to CONFLICT state (not in truth table)
      andGate.inputPins[0].state = LogicLevel.CONFLICT;
      andGate.inputPins[1].state = LogicLevel.LOW;
      
      let table = generator.generateForGate(andGate, 'multi-input');
      table = generator.updateCurrentRow(table, andGate, 'multi-input');

      // No row should be marked as current
      expect(table.rows.every(row => row.isCurrent === false)).toBe(true);
    });
  });

  describe('polymorphic behavior', () => {
    it('uses same generation logic for all multi-input gate types', () => {
      const gateTypes: Array<'and' | 'or' | 'nand' | 'nor' | 'xor' | 'xnor'> = 
        ['and', 'or', 'nand', 'nor', 'xor', 'xnor'];

      gateTypes.forEach(type => {
        const gate = createMultiInputGate(type, `${type}-1`, { x: 0, y: 0 }, 2);
        const table = generator.generateForGate(gate, 'multi-input');

        // All should have same structure
        expect(table.rows).toHaveLength(4);
        expect(table.inputPins).toEqual(['A', 'B']);
        expect(table.rows.every(row => row.id.length === 2)).toBe(true);
      });
    });

    it('generates different outputs for different gate types with same inputs', () => {
      const and = createMultiInputGate('and', 'and-1', { x: 0, y: 0 }, 2);
      const or = createMultiInputGate('or', 'or-1', { x: 0, y: 0 }, 2);

      const andTable = generator.generateForGate(and, 'multi-input');
      const orTable = generator.generateForGate(or, 'multi-input');

      // Same inputs, different outputs based on gate type
      expect(andTable.rows[1].inputs).toEqual(orTable.rows[1].inputs); // Both 01
      expect(andTable.rows[1].output).not.toBe(orTable.rows[1].output); // Different results
    });
  });
});
