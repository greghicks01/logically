import { createPushButton, createLightIndicator, getLightState } from '../../src/models/PinComponent';
import { LogicLevel } from '../../src/models/LogicLevel';
import { createPoint } from '../../src/models/Point';
import { createPinConnection } from '../../src/models/PinConnection';

describe('PushButton Model', () => {
  it('should create a push button with default state', () => {
    const outputPin = createPinConnection('c1', 'p1', 'output');
    const button = createPushButton('btn1', 'toggle', createPoint(0, 0), outputPin);
    
    expect(button.id).toBe('btn1');
    expect(button.type).toBe('toggle');
    expect(button.state).toBe('released');
    expect(button.outputValue).toBe(LogicLevel.LOW);
  });
});

describe('LightIndicator Model', () => {
  it('should create a light indicator with default state', () => {
    const inputPin = createPinConnection('c1', 'p1', 'input');
    const light = createLightIndicator('light1', createPoint(0, 0), inputPin);
    
    expect(light.id).toBe('light1');
    expect(light.state).toBe('off');
    expect(light.inputValue).toBe(LogicLevel.LOW);
  });

  it('should return correct state for logic levels', () => {
    const highState = getLightState(LogicLevel.HIGH);
    expect(highState.state).toBe('on');
    expect(highState.color).toBe('#FFFF00');

    const lowState = getLightState(LogicLevel.LOW);
    expect(lowState.state).toBe('off');
    
    const hizState = getLightState(LogicLevel.HI_Z);
    expect(hizState.state).toBe('dimmed');
    expect(hizState.pattern).toBe('diagonal-stripes');

    const conflictState = getLightState(LogicLevel.CONFLICT);
    expect(conflictState.state).toBe('on');
    expect(conflictState.color).toBe('#FF6600');
  });
});
