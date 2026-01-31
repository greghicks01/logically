import { createANDGate, computeANDOutput } from '../../src/models/ANDGate';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('AND Gate Model', () => {
  const position = { x: 100, y: 200 };
  const id = 'and-1';

  it('should create an AND gate with LOW inputs and output', () => {
    const gate = createANDGate(id, position);

    expect(gate.id).toBe(id);
    expect(gate.position).toEqual(position);
    expect(gate.inputPins[0].state).toBe(LogicLevel.LOW);
    expect(gate.inputPins[1].state).toBe(LogicLevel.LOW);
    expect(gate.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should create pins with correct position offsets', () => {
    const gate = createANDGate(id, position);

    expect(gate.inputPins[0].position).toEqual({
      x: position.x,
      y: position.y - 7.5,
    });
    expect(gate.inputPins[1].position).toEqual({
      x: position.x,
      y: position.y + 7.5,
    });
    expect(gate.outputPin.position).toEqual({
      x: position.x + 60,
      y: position.y,
    });
  });

  it('should create unique pin IDs', () => {
    const gate = createANDGate(id, position);

    expect(gate.inputPins[0].id).toBe('and-1-in0');
    expect(gate.inputPins[1].id).toBe('and-1-in1');
    expect(gate.outputPin.id).toBe('and-1-out');
  });

  describe('computeANDOutput', () => {
    it('should return HIGH when both inputs are HIGH', () => {
      const result = computeANDOutput(LogicLevel.HIGH, LogicLevel.HIGH);
      expect(result).toBe(LogicLevel.HIGH);
    });

    it('should return LOW when both inputs are LOW', () => {
      const result = computeANDOutput(LogicLevel.LOW, LogicLevel.LOW);
      expect(result).toBe(LogicLevel.LOW);
    });

    it('should return LOW when first input is HIGH and second is LOW', () => {
      const result = computeANDOutput(LogicLevel.HIGH, LogicLevel.LOW);
      expect(result).toBe(LogicLevel.LOW);
    });

    it('should return LOW when first input is LOW and second is HIGH', () => {
      const result = computeANDOutput(LogicLevel.LOW, LogicLevel.HIGH);
      expect(result).toBe(LogicLevel.LOW);
    });

    it('should return HI_Z when first input is HI_Z', () => {
      const result = computeANDOutput(LogicLevel.HI_Z, LogicLevel.HIGH);
      expect(result).toBe(LogicLevel.HI_Z);
    });

    it('should return HI_Z when second input is HI_Z', () => {
      const result = computeANDOutput(LogicLevel.HIGH, LogicLevel.HI_Z);
      expect(result).toBe(LogicLevel.HI_Z);
    });

    it('should return CONFLICT when first input is CONFLICT', () => {
      const result = computeANDOutput(LogicLevel.CONFLICT, LogicLevel.HIGH);
      expect(result).toBe(LogicLevel.CONFLICT);
    });

    it('should return CONFLICT when second input is CONFLICT', () => {
      const result = computeANDOutput(LogicLevel.HIGH, LogicLevel.CONFLICT);
      expect(result).toBe(LogicLevel.CONFLICT);
    });

    it('should prioritize CONFLICT over HI_Z', () => {
      const result = computeANDOutput(LogicLevel.CONFLICT, LogicLevel.HI_Z);
      expect(result).toBe(LogicLevel.CONFLICT);
    });
  });
});
