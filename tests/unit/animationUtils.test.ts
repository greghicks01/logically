import {
  lerp,
  clamp,
  calculateProgress,
  interpolateColor,
  rgbToString,
  parseColor,
  easeInOutCubic,
  createAnimationState,
  updateAnimationState,
  RGB
} from '../../src/lib/animationUtils';

describe('animationUtils', () => {
  describe('lerp', () => {
    it('interpolates between two values linearly', () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(0, 100, 1)).toBe(100);
    });
    
    it('handles negative values', () => {
      expect(lerp(-10, 10, 0.5)).toBe(0);
      expect(lerp(-100, -50, 0.5)).toBe(-75);
    });
    
    it('handles progress outside [0, 1] (extrapolation)', () => {
      expect(lerp(0, 100, 1.5)).toBe(150);
      expect(lerp(0, 100, -0.5)).toBe(-50);
    });
    
    it('handles same start and end values', () => {
      expect(lerp(5, 5, 0.5)).toBe(5);
    });
  });
  
  describe('clamp', () => {
    it('returns value when within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, -10, 10)).toBe(0);
    });
    
    it('clamps to minimum when below range', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, -10, 10)).toBe(-10);
    });
    
    it('clamps to maximum when above range', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, -10, 10)).toBe(10);
    });
    
    it('returns boundary values unchanged', () => {
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });
  });
  
  describe('calculateProgress', () => {
    it('returns 0 at start time', () => {
      expect(calculateProgress(100, 500, 100)).toBe(0);
    });
    
    it('returns 1 at end time', () => {
      expect(calculateProgress(100, 500, 600)).toBe(1);
    });
    
    it('returns 0.5 at midpoint', () => {
      expect(calculateProgress(100, 500, 350)).toBe(0.5);
    });
    
    it('clamps to [0, 1] range', () => {
      expect(calculateProgress(100, 500, 50)).toBe(0);   // Before start
      expect(calculateProgress(100, 500, 700)).toBe(1);  // After end
    });
    
    it('handles zero duration', () => {
      expect(calculateProgress(100, 0, 100)).toBe(1);
      expect(calculateProgress(100, 0, 150)).toBe(1);
    });
    
    it('handles negative duration', () => {
      expect(calculateProgress(100, -100, 150)).toBe(1);
    });
  });
  
  describe('interpolateColor', () => {
    it('interpolates RGB colors', () => {
      const color1: RGB = { r: 0, g: 0, b: 0 };
      const color2: RGB = { r: 100, g: 200, b: 50 };
      
      const mid = interpolateColor(color1, color2, 0.5);
      expect(mid).toEqual({ r: 50, g: 100, b: 25 });
    });
    
    it('returns start color at t=0', () => {
      const color1: RGB = { r: 100, g: 150, b: 200 };
      const color2: RGB = { r: 200, g: 50, b: 100 };
      
      const result = interpolateColor(color1, color2, 0);
      expect(result).toEqual(color1);
    });
    
    it('returns end color at t=1', () => {
      const color1: RGB = { r: 100, g: 150, b: 200 };
      const color2: RGB = { r: 200, g: 50, b: 100 };
      
      const result = interpolateColor(color1, color2, 1);
      expect(result).toEqual(color2);
    });
    
    it('rounds to integer values', () => {
      const color1: RGB = { r: 0, g: 0, b: 0 };
      const color2: RGB = { r: 100, g: 100, b: 100 };
      
      const result = interpolateColor(color1, color2, 0.333);
      expect(Number.isInteger(result.r)).toBe(true);
      expect(Number.isInteger(result.g)).toBe(true);
      expect(Number.isInteger(result.b)).toBe(true);
    });
  });
  
  describe('rgbToString', () => {
    it('converts RGB to CSS rgb() string', () => {
      expect(rgbToString({ r: 255, g: 128, b: 0 })).toBe('rgb(255, 128, 0)');
      expect(rgbToString({ r: 0, g: 0, b: 0 })).toBe('rgb(0, 0, 0)');
      expect(rgbToString({ r: 255, g: 255, b: 255 })).toBe('rgb(255, 255, 255)');
    });
  });
  
  describe('parseColor', () => {
    it('parses rgb() format', () => {
      expect(parseColor('rgb(255, 128, 0)')).toEqual({ r: 255, g: 128, b: 0 });
      expect(parseColor('rgb(0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0 });
    });
    
    it('parses hex format', () => {
      expect(parseColor('#FF8000')).toEqual({ r: 255, g: 128, b: 0 });
      expect(parseColor('#ff8000')).toEqual({ r: 255, g: 128, b: 0 });
      expect(parseColor('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(parseColor('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
    });
    
    it('returns null for invalid format', () => {
      expect(parseColor('invalid')).toBeNull();
      expect(parseColor('rgb(invalid)')).toBeNull();
      expect(parseColor('#ZZZ')).toBeNull();
    });
  });
  
  describe('easeInOutCubic', () => {
    it('starts at 0 and ends at 1', () => {
      expect(easeInOutCubic(0)).toBe(0);
      expect(easeInOutCubic(1)).toBe(1);
    });
    
    it('passes through 0.5 at midpoint', () => {
      const mid = easeInOutCubic(0.5);
      expect(mid).toBeCloseTo(0.5, 5);
    });
    
    it('produces smooth curve', () => {
      // Early values should accelerate
      const early = easeInOutCubic(0.25);
      expect(early).toBeLessThan(0.25); // Slower than linear
      
      // Later values should decelerate
      const late = easeInOutCubic(0.75);
      expect(late).toBeGreaterThan(0.75); // Faster than linear
    });
    
    it('is symmetric around midpoint', () => {
      const t1 = easeInOutCubic(0.2);
      const t2 = easeInOutCubic(0.8);
      
      expect(t1).toBeCloseTo(1 - t2, 5);
    });
  });
  
  describe('createAnimationState', () => {
    it('creates animation state with correct properties', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      expect(state.componentId).toBe('comp-1');
      expect(state.fromValue).toBe(0);
      expect(state.toValue).toBe(100);
      expect(state.startTime).toBe(1000);
      expect(state.endTime).toBe(1500); // 1000 + 500
      expect(state.progress).toBe(0);
      expect(state.isComplete).toBe(false);
    });
    
    it('handles any value types', () => {
      const colorState = createAnimationState(
        'wire-1',
        { r: 0, g: 0, b: 0 },
        { r: 255, g: 255, b: 255 },
        0,
        1000
      );
      
      expect(colorState.fromValue).toEqual({ r: 0, g: 0, b: 0 });
      expect(colorState.toValue).toEqual({ r: 255, g: 255, b: 255 });
    });
  });
  
  describe('updateAnimationState', () => {
    it('updates progress based on current time', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      const updated = updateAnimationState(state, 1250); // Midpoint
      expect(updated.progress).toBe(0.5);
      expect(updated.isComplete).toBe(false);
    });
    
    it('marks complete when time reaches end', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      const updated = updateAnimationState(state, 1500);
      expect(updated.progress).toBe(1);
      expect(updated.isComplete).toBe(true);
    });
    
    it('marks complete when time exceeds end', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      const updated = updateAnimationState(state, 2000);
      expect(updated.progress).toBe(1);
      expect(updated.isComplete).toBe(true);
    });
    
    it('clamps progress at 0 before start time', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      const updated = updateAnimationState(state, 500);
      expect(updated.progress).toBe(0);
      expect(updated.isComplete).toBe(false);
    });
    
    it('preserves other state properties', () => {
      const state = createAnimationState('comp-1', 0, 100, 1000, 500);
      
      const updated = updateAnimationState(state, 1250);
      expect(updated.componentId).toBe('comp-1');
      expect(updated.fromValue).toBe(0);
      expect(updated.toValue).toBe(100);
      expect(updated.startTime).toBe(1000);
      expect(updated.endTime).toBe(1500);
    });
  });
});
