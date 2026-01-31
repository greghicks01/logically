import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * Light Indicator - Output display component
 */
export interface LightIndicator {
  id: string;
  position: Point;
  inputPin: Pin;
  radius: number;
  inputValue: LogicLevel;
}

/**
 * Create a new light indicator
 */
export function createLightIndicator(id: string, position: Point): LightIndicator {
  return {
    id,
    position,
    inputPin: {
      id: `${id}-in`,
      label: 'IN',
      position: { x: position.x - 20, y: position.y },
      state: LogicLevel.LOW,
    },
    radius: 15,
    inputValue: LogicLevel.LOW,
  };
}

/**
 * Get light display state from logic level
 */
export function getLightState(level: LogicLevel): {
  state: 'on' | 'off' | 'hi-z' | 'conflict';
  color: string;
  pattern?: string;
} {
  switch (level) {
    case LogicLevel.HIGH:
      return { state: 'on', color: '#CC0000' }; // Red - ON
    case LogicLevel.LOW:
      return { state: 'off', color: '#1a1a1a' }; // Dark - OFF
    case LogicLevel.HI_Z:
      return { state: 'hi-z', color: '#808080', pattern: 'diagonal-stripes' }; // Grey with pattern
    case LogicLevel.CONFLICT:
      return { state: 'conflict', color: '#FF6600' }; // Orange - ERROR
    default:
      return { state: 'off', color: '#1a1a1a' };
  }
}
