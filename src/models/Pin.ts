import { LogicLevel } from './LogicLevel';
import { Point } from './Point';
import { PinConnection } from './PinConnection';

/**
 * Pin interface - used by gates and components
 */
export interface Pin {
  id: string;
  label?: string;
  position: Point;
  state: LogicLevel;
}

/**
 * Output pin interface
 */
export interface OutputPin {
  id: string;
  componentId: string;
  outputState: LogicLevel;
}

/**
 * Input pin interface
 */
export interface InputPin {
  id: string;
  componentId: string;
  connection?: PinConnection;
}

/**
 * Create an output pin
 */
export function createOutputPin(id: string, componentId: string, initialState: LogicLevel = LogicLevel.HI_Z): OutputPin {
  return {
    id,
    componentId,
    outputState: initialState,
  };
}

/**
 * Create an input pin
 */
export function createInputPin(id: string, componentId: string, connection?: PinConnection): InputPin {
  return {
    id,
    componentId,
    connection,
  };
}
