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
    
    // Verify parametric properties are initialized
    expect(gate.boundingBox).toBeDefined();
    expect(gate.inputPinSpecs).toBeDefined();
    expect(gate.outputPinSpec).toBeDefined();
  });

  it('should create pins with correct parametric positions', () => {
    const gate = createANDGate(id, position);

    // With 2 inputs: pin span = (2-1)*15 = 15px
    // Parametric: t=0 and t=1 on the pin span
    // y = center.y - pinSpan/2 + t*pinSpan
    // For t=0: y = 200 - 7.5 + 0*15 = 192.5
    // For t=1: y = 200 - 7.5 + 1*15 = 207.5
    expect(gate.inputPins[0].position).toEqual({
      x: position.x - 30, // center.x - width/2
      y: 192.5,
    });
    expect(gate.inputPins[1].position).toEqual({
      x: position.x - 30,
      y: 207.5,
    });
    
    // Output pin at center-right: x = center.x + width/2, y = center
    expect(gate.outputPin.position).toEqual({
      x: position.x + 30,
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
