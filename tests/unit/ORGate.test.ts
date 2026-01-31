import { createORGate, computeOROutput } from '../../src/models/ORGate';
import { LogicLevel } from '../../src/models/LogicLevel';
import { Point } from '../../src/models/Point';

describe('ORGate', () => {
  describe('createORGate', () => {
    it('should create an OR gate with correct number of inputs', () => {
      const id = 'or-1';
      const position: Point = { x: 100, y: 100 };
      const gate = createORGate(id, position);

      expect(gate.id).toBe(id);
      expect(gate.position).toEqual(position);
      expect(gate.numInputs).toBe(2);
      expect(gate.inputPins.length).toBe(2);
    });

    it('should create input pins with correct labels', () => {
      const id = 'or-1';
      const position: Point = { x: 100, y: 100 };
      const gate = createORGate(id, position);

      expect(gate.inputPins[0].label).toBe('A');
      expect(gate.inputPins[1].label).toBe('B');
    });

    it('should support custom number of inputs', () => {
      const id = 'or-1';
      const position: Point = { x: 100, y: 100 };
      const gate = createORGate(id, position, 4);

      expect(gate.numInputs).toBe(4);
      expect(gate.inputPins.length).toBe(4);
      expect(gate.inputPins[3].label).toBe('D');
    });
  });

  describe('computeOROutput', () => {
    it('should return LOW when all inputs are LOW', () => {
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.LOW)).toBe(LogicLevel.LOW);
    });

    it('should return HIGH when any input is HIGH', () => {
      expect(computeOROutput(LogicLevel.HIGH, LogicLevel.LOW)).toBe(LogicLevel.HIGH);
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.HIGH)).toBe(LogicLevel.HIGH);
      expect(computeOROutput(LogicLevel.HIGH, LogicLevel.HIGH)).toBe(LogicLevel.HIGH);
    });

    it('should prioritize CONFLICT state', () => {
      expect(computeOROutput(LogicLevel.CONFLICT, LogicLevel.LOW)).toBe(LogicLevel.CONFLICT);
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.CONFLICT)).toBe(LogicLevel.CONFLICT);
    });

    it('should handle HI_Z state', () => {
      expect(computeOROutput(LogicLevel.HI_Z, LogicLevel.LOW)).toBe(LogicLevel.HI_Z);
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.HI_Z)).toBe(LogicLevel.HI_Z);
    });

    it('should work with multiple inputs', () => {
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.LOW, LogicLevel.LOW, LogicLevel.HIGH)).toBe(LogicLevel.HIGH);
      expect(computeOROutput(LogicLevel.LOW, LogicLevel.LOW, LogicLevel.LOW, LogicLevel.LOW)).toBe(LogicLevel.LOW);
    });
  });
});
