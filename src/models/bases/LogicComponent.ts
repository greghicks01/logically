import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';

/**
 * Base class for all logic components
 * Contains common properties: ID, position, pins, colors
 */
export abstract class LogicComponent {
  id: string;
  position: Point;
  name?: string;

  constructor(id: string, position: Point, name?: string) {
    this.id = id;
    this.position = position;
    this.name = name;
  }

  /**
   * Get all pins (both input and output) for this component
   */
  abstract getAllPins(): Pin[];

  /**
   * Compute output state(s) based on input state(s)
   */
  abstract computeOutputs(): void;

  /**
   * Get the component type name (for UI display)
   */
  abstract getTypeName(): string;
}
