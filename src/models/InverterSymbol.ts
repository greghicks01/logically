import { ICPin } from '../models/ICPin';
import { Point } from '../models/Point';

/**
 * Inverter symbol model
 */
export interface InverterSymbol {
  pinId: string;
  position: Point;
  radius: number;
}

/**
 * Create an inverter symbol
 */
export function createInverterSymbol(pinId: string, position: Point): InverterSymbol {
  return {
    pinId,
    position,
    radius: 6,
  };
}
