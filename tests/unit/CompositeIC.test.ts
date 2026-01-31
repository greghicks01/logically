import { createCompositeIC, validateCompositeIC } from '../../src/models/CompositeIC';
import { createCircuit } from '../../src/models/Circuit';
import { createICPin } from '../../src/models/ICPin';

describe('CompositeIC Model', () => {
  it('should create a valid composite IC', () => {
    const circuit = createCircuit('Internal');
    const inputPins = [createICPin('in1', 'A', 'input', 'wire1')];
    const outputPins = [createICPin('out1', 'Q', 'output', 'wire2')];
    
    const ic = createCompositeIC({
      id: 'ic1',
      name: 'TEST_IC',
      inputPins,
      outputPins,
      internalCircuit: circuit,
      nestingLevel: 1,
    });
    
    expect(ic.id).toBe('ic1');
    expect(ic.name).toBe('TEST_IC');
    expect(ic.inputPins).toHaveLength(1);
    expect(ic.outputPins).toHaveLength(1);
    expect(ic.nestingLevel).toBe(1);
  });

  it('should validate IC correctly', () => {
    const circuit = createCircuit('Internal');
    const inputPins = [createICPin('in1', 'A', 'input', 'wire1')];
    const outputPins = [createICPin('out1', 'Q', 'output', 'wire2')];
    
    const ic = createCompositeIC({
      id: 'ic1',
      name: 'VALID_IC',
      inputPins,
      outputPins,
      internalCircuit: circuit,
      nestingLevel: 1,
    });
    
    const result = validateCompositeIC(ic);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should warn about deep nesting', () => {
    const circuit = createCircuit('Internal');
    const inputPins = [createICPin('in1', 'A', 'input', 'wire1')];
    const outputPins = [createICPin('out1', 'Q', 'output', 'wire2')];
    
    const ic = createCompositeIC({
      id: 'ic1',
      name: 'DEEP_IC',
      inputPins,
      outputPins,
      internalCircuit: circuit,
      nestingLevel: 15,
    });
    
    const result = validateCompositeIC(ic);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('15 levels');
  });
});
