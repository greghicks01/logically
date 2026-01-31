import { createSwitch, toggleSwitch } from '../../src/models/Switch';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('Switch Model', () => {
  const position = { x: 100, y: 200 };
  const id = 'switch-1';

  it('should create a switch with default LOW state', () => {
    const sw = createSwitch(id, position);

    expect(sw.id).toBe(id);
    expect(sw.position).toEqual(position);
    expect(sw.state).toBe(false);
    expect(sw.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should create output pin with correct position offset', () => {
    const sw = createSwitch(id, position);

    expect(sw.outputPin.position).toEqual({
      x: position.x + 40,
      y: position.y + 15,
    });
  });

  it('should toggle switch from LOW to HIGH', () => {
    const sw = createSwitch(id, position);
    const toggled = toggleSwitch(sw);

    expect(toggled.state).toBe(true);
    expect(toggled.outputPin.state).toBe(LogicLevel.HIGH);
  });

  it('should toggle switch from HIGH to LOW', () => {
    const sw = createSwitch(id, position);
    const toggled = toggleSwitch(sw);
    const toggledAgain = toggleSwitch(toggled);

    expect(toggledAgain.state).toBe(false);
    expect(toggledAgain.outputPin.state).toBe(LogicLevel.LOW);
  });

  it('should maintain pin ID when toggling', () => {
    const sw = createSwitch(id, position);
    const originalPinId = sw.outputPin.id;
    
    const toggled = toggleSwitch(sw);

    expect(toggled.outputPin.id).toBe(originalPinId);
  });

  it('should maintain pin label when toggling', () => {
    const sw = createSwitch(id, position);
    
    const toggled = toggleSwitch(sw);

    expect(toggled.outputPin.label).toBe('OUT');
  });

  it('should create unique pin ID based on switch ID', () => {
    const sw1 = createSwitch('switch-1', position);
    const sw2 = createSwitch('switch-2', position);

    expect(sw1.outputPin.id).toBe('switch-1-out');
    expect(sw2.outputPin.id).toBe('switch-2-out');
  });
});
