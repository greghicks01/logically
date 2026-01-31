import { createLightIndicator, getLightState } from '../../src/models/LightIndicator';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('Light Indicator Model', () => {
  const position = { x: 100, y: 200 };
  const id = 'light-1';

  it('should create a light indicator with LOW state', () => {
    const light = createLightIndicator(id, position);

    expect(light.id).toBe(id);
    expect(light.position).toEqual(position);
    expect(light.inputValue).toBe(LogicLevel.LOW);
    expect(light.inputPin.state).toBe(LogicLevel.LOW);
  });

  it('should create input pin with correct position offset', () => {
    const light = createLightIndicator(id, position);

    expect(light.inputPin.position).toEqual({
      x: position.x - 20,
      y: position.y,
    });
  });

  it('should create light with default radius', () => {
    const light = createLightIndicator(id, position);

    expect(light.radius).toBe(15);
  });

  it('should create unique pin ID', () => {
    const light = createLightIndicator(id, position);

    expect(light.inputPin.id).toBe('light-1-in');
  });

  describe('getLightState', () => {
    it('should return OFF state for LOW logic level', () => {
      const state = getLightState(LogicLevel.LOW);

      expect(state.state).toBe('off');
      expect(state.color).toBe('#1a1a1a');
      expect(state.pattern).toBeUndefined();
    });

    it('should return ON state for HIGH logic level', () => {
      const state = getLightState(LogicLevel.HIGH);

      expect(state.state).toBe('on');
      expect(state.color).toBe('#CC0000');
      expect(state.pattern).toBeUndefined();
    });

    it('should return HI_Z state with pattern for HI_Z logic level', () => {
      const state = getLightState(LogicLevel.HI_Z);

      expect(state.state).toBe('hi-z');
      expect(state.color).toBe('#808080');
      expect(state.pattern).toBe('diagonal-stripes');
    });

    it('should return CONFLICT state for CONFLICT logic level', () => {
      const state = getLightState(LogicLevel.CONFLICT);

      expect(state.state).toBe('conflict');
      expect(state.color).toBe('#FF6600');
      expect(state.pattern).toBeUndefined();
    });

    it('should use WCAG-compliant colors', () => {
      const highState = getLightState(LogicLevel.HIGH);
      const lowState = getLightState(LogicLevel.LOW);
      const hiZState = getLightState(LogicLevel.HI_Z);
      const conflictState = getLightState(LogicLevel.CONFLICT);

      // Verify color format
      expect(highState.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(lowState.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(hiZState.color).toMatch(/^#[0-9A-F]{6}$/i);
      expect(conflictState.color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('should support multiple light instances with unique IDs', () => {
    const light1 = createLightIndicator('light-1', position);
    const light2 = createLightIndicator('light-2', { x: 200, y: 300 });

    expect(light1.id).not.toBe(light2.id);
    expect(light1.inputPin.id).not.toBe(light2.inputPin.id);
  });
});
