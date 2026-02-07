import { LogicLevel } from './LogicLevel';
import { Point } from './Point';
import { Pin } from './Pin';
import { PinConnection } from './PinConnection';

/**
 * Push button component for interactive circuit testing
 */
export interface PushButton {
  id: string;
  /** Button type */
  type: 'toggle' | 'momentary';
  /** Current state */
  state: 'pressed' | 'released';
  /** Output value */
  outputValue: LogicLevel;
  /** Visual position */
  position: Point;
  /** Visual size */
  size: { width: number; height: number };
  /** Output pin */
  outputPin: Pin;
}

/**
 * Create a push button
 */
export function createPushButton(
  id: string,
  type: 'toggle' | 'momentary',
  position: Point
): PushButton {
  return {
    id,
    type,
    state: 'released',
    outputValue: LogicLevel.LOW,
    position,
    size: { width: 40, height: 40 },
    outputPin: {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + 50, y: position.y + 20 },
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Press a push button - activates and sets output to HIGH
 */
export function pressPushButton(button: PushButton): PushButton {
  return {
    ...button,
    state: 'pressed',
    outputValue: LogicLevel.HIGH,
    outputPin: {
      ...button.outputPin,
      state: LogicLevel.HIGH,
    },
  };
}

/**
 * Release a push button - deactivates and sets output to LOW
 */
export function releasePushButton(button: PushButton): PushButton {
  return {
    ...button,
    state: 'released',
    outputValue: LogicLevel.LOW,
    outputPin: {
      ...button.outputPin,
      state: LogicLevel.LOW,
    },
  };
}

/**
 * Toggle a push button (for toggle-type buttons)
 */
export function togglePushButton(button: PushButton): PushButton {
  if (button.type !== 'toggle') {
    return button;
  }
  
  const newState = button.state === 'pressed' ? 'released' : 'pressed';
  const newOutputValue = newState === 'pressed' ? LogicLevel.HIGH : LogicLevel.LOW;
  
  return {
    ...button,
    state: newState,
    outputValue: newOutputValue,
    outputPin: {
      ...button.outputPin,
      state: newOutputValue,
    },
  };
}

/**
 * Light indicator component for displaying logic states
 */
export interface LightIndicator {
  id: string;
  /** Visual display state */
  state: 'on' | 'off' | 'dimmed';
  /** Input logic value */
  inputValue: LogicLevel;
  /** Visual position */
  position: Point;
  /** Circle radius */
  radius: number;
  /** Input connection */
  inputPin: PinConnection;
}

/**
 * Create a light indicator
 */
export function createLightIndicator(
  id: string,
  position: Point,
  inputPin: PinConnection
): LightIndicator {
  return {
    id,
    state: 'off',
    inputValue: LogicLevel.LOW,
    position,
    radius: 15,
    inputPin,
  };
}

/**
 * Get light state from logic level
 */
export function getLightState(level: LogicLevel): {
  state: 'on' | 'off' | 'dimmed';
  color: string;
  pattern?: string;
} {
  switch (level) {
    case LogicLevel.HIGH:
      return { state: 'on', color: '#FFFF00' }; // Yellow
    case LogicLevel.LOW:
      return { state: 'off', color: '#333333' }; // Dark grey
    case LogicLevel.HI_Z:
      return { state: 'dimmed', color: '#808080', pattern: 'diagonal-stripes' }; // Grey with stripes
    case LogicLevel.CONFLICT:
      return { state: 'on', color: '#FF6600' }; // Orange
    default:
      return { state: 'off', color: '#333333' };
  }
}
