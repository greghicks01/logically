import { Point } from './Point';
import { Pin } from './Pin';
import { LogicLevel } from './LogicLevel';
import { LogicComponent } from './LogicComponent';

/**
 * Base class for multi-input, single-output logic gates
 * Contains common multi-input gate functionality
 */
export abstract class MultiInputComponent extends LogicComponent {
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;

  constructor(
    id: string,
    position: Point,
    numInputs: number,
    outputOffsetX: number,
    defaultOutputState: LogicLevel,
    name?: string
  ) {
    super(id, position, name);
    
    // Clamp inputs between 2 and 8
    this.numInputs = Math.min(Math.max(numInputs, 2), 8);
    this.inputPins = this.createInputPins(id, position, this.numInputs);
    
    this.outputPin = {
      id: `${id}-out`,
      label: 'OUT',
      position: { x: position.x + outputOffsetX, y: position.y },
      state: defaultOutputState,
    };
  }

  /**
   * Create input pins vertically spaced
   */
  private createInputPins(id: string, position: Point, numInputs: number): Pin[] {
    const pins: Pin[] = [];
    const spacing = 15;
    const totalHeight = (numInputs - 1) * spacing;
    const startY = position.y - totalHeight / 2;
    
    for (let i = 0; i < numInputs; i++) {
      pins.push({
        id: `${id}-in${i}`,
        label: String.fromCharCode(65 + i), // A, B, C, D, E, F, G, H
        position: { x: position.x, y: startY + i * spacing },
        state: LogicLevel.LOW,
      });
    }
    
    return pins;
  }

  getAllPins(): Pin[] {
    return [...this.inputPins, this.outputPin];
  }

  /**
   * Update pin positions when component moves
   */
  updatePosition(newPosition: Point, outputOffsetX: number): void {
    const deltaX = newPosition.x - this.position.x;
    const deltaY = newPosition.y - this.position.y;
    
    this.position = newPosition;
    
    // Update all input pins
    this.inputPins = this.inputPins.map(pin => ({
      ...pin,
      position: {
        x: pin.position.x + deltaX,
        y: pin.position.y + deltaY
      }
    }));
    
    // Update output pin
    this.outputPin.position = {
      x: this.outputPin.position.x + deltaX,
      y: this.outputPin.position.y + deltaY
    };
  }

  /**
   * Compute output based on all inputs - to be implemented by subclasses
   */
  abstract computeOutput(...inputs: LogicLevel[]): LogicLevel;

  computeOutputs(): void {
    const inputStates = this.inputPins.map(pin => pin.state);
    this.outputPin.state = this.computeOutput(...inputStates);
  }

  /**
   * Change number of inputs (recreate input pins)
   */
  setNumInputs(numInputs: number): void {
    const oldNumInputs = this.numInputs;
    this.numInputs = Math.min(Math.max(numInputs, 2), 8);
    
    // Preserve existing pin states when possible
    const oldPins = this.inputPins;
    this.inputPins = this.createInputPins(this.id, this.position, this.numInputs);
    
    // Restore states from old pins
    for (let i = 0; i < Math.min(oldNumInputs, this.numInputs); i++) {
      if (oldPins[i]) {
        this.inputPins[i].state = oldPins[i].state;
      }
    }
  }
}
