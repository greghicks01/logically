/**
 * Linear interpolation between two values
 * 
 * Mathematical formula: lerp(a, b, t) = a + (b - a) × t
 * where t ∈ [0, 1]
 * 
 * @param start Starting value
 * @param end Ending value
 * @param progress Progress value [0, 1]
 * @returns Interpolated value
 */
export function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

/**
 * Clamp a value between min and max
 * 
 * @param value Value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate animation progress from elapsed time
 * 
 * Mathematical formula: progress = clamp((currentTime - startTime) / duration, 0, 1)
 * 
 * @param startTime Animation start time (ms)
 * @param duration Animation duration (ms)
 * @param currentTime Current time (ms)
 * @returns Progress value [0, 1]
 */
export function calculateProgress(
  startTime: number,
  duration: number,
  currentTime: number
): number {
  if (duration <= 0) return 1;
  return clamp((currentTime - startTime) / duration, 0, 1);
}

/**
 * RGB color representation
 */
export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

/**
 * Interpolate between two RGB colors
 * 
 * Mathematical formula (per channel):
 * r = r1 + (r2 - r1) × t
 * g = g1 + (g2 - g1) × t
 * b = b1 + (b2 - b1) × t
 * 
 * @param color1 Starting color
 * @param color2 Ending color
 * @param progress Progress value [0, 1]
 * @returns Interpolated RGB color
 */
export function interpolateColor(
  color1: RGB,
  color2: RGB,
  progress: number
): RGB {
  return {
    r: Math.round(lerp(color1.r, color2.r, progress)),
    g: Math.round(lerp(color1.g, color2.g, progress)),
    b: Math.round(lerp(color1.b, color2.b, progress))
  };
}

/**
 * Convert RGB to CSS color string
 * 
 * @param color RGB color
 * @returns CSS rgb() string
 */
export function rgbToString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Parse CSS rgb/hex color to RGB object
 * 
 * @param colorString CSS color string
 * @returns RGB object or null if invalid
 */
export function parseColor(colorString: string): RGB | null {
  // Handle rgb() format
  const rgbMatch = colorString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1]),
      g: parseInt(rgbMatch[2]),
      b: parseInt(rgbMatch[3])
    };
  }
  
  // Handle hex format (#RRGGBB)
  const hexMatch = colorString.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16)
    };
  }
  
  return null;
}

/**
 * Easing function for smooth animations
 * Uses ease-in-out cubic for natural motion
 * 
 * Mathematical formula:
 * t < 0.5: 4t³
 * t >= 0.5: 1 - (-2t + 2)³ / 2
 * 
 * @param t Linear progress [0, 1]
 * @returns Eased progress [0, 1]
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Animation state for a component
 */
export interface AnimationState {
  /** Component being animated */
  componentId: string;
  
  /** Current animation progress [0.0, 1.0] */
  progress: number;
  
  /** Animation start time (milliseconds) */
  startTime: number;
  
  /** Animation end time (milliseconds) */
  endTime: number;
  
  /** Starting visual value */
  fromValue: any;
  
  /** Ending visual value */
  toValue: any;
  
  /** Whether animation is complete */
  isComplete: boolean;
}

/**
 * Create a new animation state
 * 
 * @param componentId Component ID
 * @param fromValue Starting value
 * @param toValue Ending value
 * @param startTime Start time (ms)
 * @param duration Duration (ms)
 * @returns Animation state
 */
export function createAnimationState(
  componentId: string,
  fromValue: any,
  toValue: any,
  startTime: number,
  duration: number
): AnimationState {
  return {
    componentId,
    progress: 0,
    startTime,
    endTime: startTime + duration,
    fromValue,
    toValue,
    isComplete: false
  };
}

/**
 * Update animation state based on current time
 * 
 * @param state Current animation state
 * @param currentTime Current time (ms)
 * @returns Updated animation state
 */
export function updateAnimationState(
  state: AnimationState,
  currentTime: number
): AnimationState {
  const progress = calculateProgress(state.startTime, state.endTime - state.startTime, currentTime);
  
  return {
    ...state,
    progress,
    isComplete: progress >= 1.0
  };
}
