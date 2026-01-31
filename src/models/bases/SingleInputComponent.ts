import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { LogicComponent } from './LogicComponent';

/**
 * Base class for single-input, single-output components (Buffer, Inverter)
 */
export abstract class SingleInputComponent extends LogicComponent {
  inputPin: Pin;
  outputPin: Pin;

  constructor(
    id: string,
    position: Point,
    outputOffsetX: number,
    defaultOutputState: LogicLevel,
    name?: string
  ) {
    super(id, position, name);
    
    this.inputPin = {
      id: `${id}-in`,
      label: 'IN',
      position: { x: position.x, y: position.y },
      state: LogicLevel.LOW,
    };
    
    this.outputPin = {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + outputOffsetX, y: position.y },
      state: defaultOutputState,
    };
  }

  getAllPins(): Pin[] {
    return [this.inputPin, this.outputPin];
  }

  /**
   * Update pin positions when component moves
   */
  updatePosition(newPosition: Point, outputOffsetX: number): void {
    const deltaX = newPosition.x - this.position.x;
    const deltaY = newPosition.y - this.position.y;
    
    this.position = newPosition;
    this.inputPin.position = {
      x: this.inputPin.position.x + deltaX,
      y: this.inputPin.position.y + deltaY
    };
    this.outputPin.position = {
      x: this.outputPin.position.x + deltaX,
      y: this.outputPin.position.y + deltaY
    };
  }

  /**
   * Compute output based on input - to be implemented by subclasses
   */
  abstract computeOutput(input: LogicLevel): LogicLevel;

  computeOutputs(): void {
    this.outputPin.state = this.computeOutput(this.inputPin.state);
  }
}
