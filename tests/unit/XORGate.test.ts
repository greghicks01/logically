import { createXORGate, computeXOROutput } from '../../src/models/XORGate';
import { LogicLevel } from '../../src/models/LogicLevel';
import { Point } from '../../src/models/Point';

describe('XORGate', () => {
  describe('createXORGate', () => {
    it('should create an XOR gate with correct number of inputs', () => {
      const id = 'xor-1';
      const position: Point = { x: 100, y: 100 };
      const gate = createXORGate(id, position);

      expect(gate.id).toBe(id);
      expect(gate.position).toEqual(position);
      expect(gate.numInputs).toBe(2);
      expect(gate.inputPins.length).toBe(2);
    });
  });

  describe('computeXOROutput', () => {
    it('should return LOW when both inputs are LOW', () => {
      expect(computeXOROutput(LogicLevel.LOW, LogicLevel.LOW)).toBe(LogicLevel.LOW);
    });

    it('should return HIGH when inputs differ', () => {
      expect(computeXOROutput(LogicLevel.HIGH, LogicLevel.LOW)).toBe(LogicLevel.HIGH);
      expect(computeXOROutput(LogicLevel.LOW, LogicLevel.HIGH)).toBe(LogicLevel.HIGH);
    });

    it('should return LOW when both inputs are HIGH', () => {
      expect(computeXOROutput(LogicLevel.HIGH, LogicLevel.HIGH)).toBe(LogicLevel.LOW);
    });

    it('should return HIGH with odd number of HIGH inputs', () => {
      expect(computeXOROutput(LogicLevel.HIGH, LogicLevel.LOW, LogicLevel.LOW)).toBe(LogicLevel.HIGH);
      expect(computeXOROutput(LogicLevel.HIGH, LogicLevel.HIGH, LogicLevel.HIGH)).toBe(LogicLevel.HIGH);
    });

    it('should return LOW with even number of HIGH inputs', () => {
      expect(computeXOROutput(LogicLevel.HIGH, LogicLevel.HIGH, LogicLevel.LOW, LogicLevel.LOW)).toBe(LogicLevel.LOW);
    });
  });
});
