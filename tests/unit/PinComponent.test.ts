import { 
  createPushButton, 
  pressPushButton, 
  releasePushButton, 
  togglePushButton,
  createLightIndicator, 
  getLightState 
} from '../../src/models/PinComponent';
import { LogicLevel } from '../../src/models/LogicLevel';
import { createPoint } from '../../src/models/Point';
import { createPinConnection } from '../../src/models/PinConnection';

describe('PushButton Model', () => {
  const position = createPoint(100, 200);

  it('should create a push button with default state', () => {
    const button = createPushButton('btn1', 'toggle', position);
    
    expect(button.id).toBe('btn1');
    expect(button.type).toBe('toggle');
    expect(button.state).toBe('released');
    expect(button.outputValue).toBe(LogicLevel.LOW);
  });

  it('should create momentary button with default LOW state', () => {
    const button = createPushButton('btn2', 'momentary', position);
    
    expect(button.type).toBe('momentary');
    expect(button.state).toBe('released');
    expect(button.outputValue).toBe(LogicLevel.LOW);
    expect(button.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should press button and set output to HIGH', () => {
    const button = createPushButton('btn1', 'momentary', position);
    const pressed = pressPushButton(button);

    expect(pressed.state).toBe('pressed');
    expect(pressed.outputValue).toBe(LogicLevel.HIGH);
    expect(pressed.outputPin.state).toBe(LogicLevel.HIGH);
  });

  it('should release button and set output to LOW', () => {
    const button = createPushButton('btn1', 'momentary', position);
    const pressed = pressPushButton(button);
    const released = releasePushButton(pressed);

    expect(released.state).toBe('released');
    expect(released.outputValue).toBe(LogicLevel.LOW);
    expect(released.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should toggle button from released to pressed', () => {
    const button = createPushButton('btn1', 'toggle', position);
    const toggled = togglePushButton(button);

    expect(toggled.state).toBe('pressed');
    expect(toggled.outputValue).toBe(LogicLevel.HIGH);
    expect(toggled.outputPin.state).toBe(LogicLevel.HIGH);
  });

  it('should toggle button from pressed to released', () => {
    const button = createPushButton('btn1', 'toggle', position);
    const toggled = togglePushButton(button);
    const toggledAgain = togglePushButton(toggled);

    expect(toggledAgain.state).toBe('released');
    expect(toggledAgain.outputValue).toBe(LogicLevel.LOW);
    expect(toggledAgain.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should not toggle momentary button', () => {
    const button = createPushButton('btn1', 'momentary', position);
    const result = togglePushButton(button);

    expect(result).toBe(button); // Returns unchanged
    expect(result.state).toBe('released');
  });

  it('should maintain button ID and type when pressing/releasing', () => {
    const button = createPushButton('btn-test', 'momentary', position);
    const pressed = pressPushButton(button);
    const released = releasePushButton(pressed);

    expect(pressed.id).toBe('btn-test');
    expect(pressed.type).toBe('momentary');
    expect(released.id).toBe('btn-test');
    expect(released.type).toBe('momentary');
  });

  it('should maintain output pin ID when changing state', () => {
    const button = createPushButton('btn1', 'momentary', position);
    const originalPinId = button.outputPin.id;
    
    const pressed = pressPushButton(button);
    const released = releasePushButton(pressed);

    expect(pressed.outputPin.id).toBe(originalPinId);
    expect(released.outputPin.id).toBe(originalPinId);
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
