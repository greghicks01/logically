import { Point } from '../Point';
import { Pin } from '../Pin';
import { LogicLevel } from '../LogicLevel';
import { LogicComponent } from './LogicComponent';

/**
 * Pin edge specification for parametric positioning
 */
export type PinEdge = 'left' | 'right' | 'top' | 'bottom';

/**
 * Parametric pin specification
 * Defines pin position relative to component boundary using normalized coordinates
 */
export interface PinSpec {
  /** Which edge of the component boundary */
  edge: PinEdge;
  /** Parametric position along edge [0,1] where 0=start, 1=end */
  t: number;
  /** Distance to extend beyond boundary edge (0 = on boundary) */
  extension: number;
}

/**
 * Bounding box dimensions
 */
export interface BoundingBox {
  width: number;
  height: number;
}

/**
 * # Multi-Pin Component Pin Positioning System
 * 
 * ## Design Philosophy: Parametric Boundary Coordinates
 * 
 * Pins are positioned using **relative parametric coordinates** along component boundaries,
 * not absolute offsets. This enables pins to automatically adapt to:
 * - Component resizing
 * - Orientation changes (future: 0°, 90°, 180°, 270°)
 * - Different component geometries
 * 
 * ## Mathematical Model
 * 
 * ### Pin Specification (Logical)
 * Each pin is defined by its position along a boundary edge:
 * ```
 * Pin_spec = {
 *   edge: 'left' | 'right' | 'top' | 'bottom',
 *   t: ℝ ∈ [0,1],              // parametric position along edge
 *   extension: ℝ               // distance from boundary (default: 0)
 * }
 * ```
 * 
 * ### Position Calculation (Physical)
 * Given component center C = (C_x, C_y) and bounding box (W, H):
 * 
 * **For 'left' edge (default for input pins):**
 * ```
 * x = C_x - W/2 - extension
 * y = C_y - H/2 + t·H
 * ```
 * 
 * **For 'right' edge (default for output pins):**
 * ```
 * x = C_x + W/2 + extension
 * y = C_y - H/2 + t·H
 * ```
 * 
 * **For 'top' edge:**
 * ```
 * x = C_x - W/2 + t·W
 * y = C_y - H/2 - extension
 * ```
 * 
 * **For 'bottom' edge:**
 * ```
 * x = C_x - W/2 + t·W
 * y = C_y + H/2 + extension
 * ```
 * 
 * ### Even Distribution Formula
 * For n pins evenly spaced on an edge:
 * 
 * **Centered distribution (recommended):**
 * ```
 * t_i = (i + 0.5) / n    where i ∈ {0, 1, ..., n-1}
 * ```
 * This centers pins in equal subdivisions of the edge.
 * 
 * **Endpoint distribution (alternative):**
 * ```
 * t_i = i / (n - 1)      where i ∈ {0, 1, ..., n-1}
 * ```
 * This places first pin at t=0 and last pin at t=1 (only use if n ≥ 2).
 * 
 * ## Current Implementation (Endpoint Distribution)
 * 
 * The current implementation uses endpoint distribution for vertical spacing:
 * ```
 * spacing = 15px
 * H_total = (n - 1) × spacing
 * t_i = i / (n - 1)    →    y_offset_i = -H_total/2 + i × spacing
 * ```
 * 
 * This means:
 * - For n=2: pins at y ∈ {-7.5, +7.5} → t ∈ {0, 1} on edge
 * - For n=3: pins at y ∈ {-15, 0, +15} → t ∈ {0, 0.5, 1} on edge
 * - For n=8: pins at y ∈ {-52.5, ..., +52.5} → t ∈ {0, 1/7, ..., 1} on edge
 * 
 * ## Advantages Over Absolute Positioning
 * 
 * **❌ Absolute (legacy):**
 * ```
 * y_i = C_y + fixed_offset_i    // Breaks on resize/rotation
 * ```
 * 
 * **✅ Parametric (current):**
 * ```
 * y_i = C_y + bounds(edge) + t_i × span(edge)    // Adapts naturally
 * ```
 * 
 * ## Future Extensions
 * 
 * When orientation support is added:
 * 1. Store pin specifications with (edge, t, extension)
 * 2. Map logical edge to physical edge based on orientation
 * 3. Calculate position using same formulas
 * 
 * Example for θ=90° rotation:
 * - Logical 'left' → Physical 'bottom'
 * - Logical 'right' → Physical 'top'
 * 
 * @see https://en.wikipedia.org/wiki/Parametric_equation
 */

/**
 * Calculate physical position from parametric pin specification.
 * 
 * Converts a pin's logical position (edge, t, extension) into absolute coordinates
 * based on the component's center position and bounding box.
 * 
 * @param center Component center position (C_x, C_y)
 * @param boundingBox Component dimensions (width, height)
 * @param spec Pin specification with edge, t parameter, and extension
 * @returns Absolute position {x, y} in world coordinates
 * 
 * @example
 * // Pin at middle of left edge with no extension
 * calculatePinPosition(
 *   {x: 100, y: 200},
 *   {width: 60, height: 40},
 *   {edge: 'left', t: 0.5, extension: 0}
 * ) 
 * // Returns: {x: 70, y: 200}  (center-width/2 = 100-30 = 70)
 */
export function calculatePinPosition(
  center: Point,
  boundingBox: BoundingBox,
  spec: PinSpec
): Point {
  const { edge, t, extension } = spec;
  const { width, height } = boundingBox;
  const halfW = width / 2;
  const halfH = height / 2;

  switch (edge) {
    case 'left':
      return {
        x: center.x - halfW - extension,
        y: center.y - halfH + t * height
      };
    
    case 'right':
      return {
        x: center.x + halfW + extension,
        y: center.y - halfH + t * height
      };
    
    case 'top':
      return {
        x: center.x - halfW + t * width,
        y: center.y - halfH - extension
      };
    
    case 'bottom':
      return {
        x: center.x - halfW + t * width,
        y: center.y + halfH + extension
      };
  }
}

/**
 * Generate parametric specifications for evenly distributed pins on an edge.
 * 
 * Uses endpoint distribution: t_i = i / (n-1) for n ≥ 2 pins.
 * For n = 1, places pin at t = 0.5 (center of edge).
 * 
 * @param numPins Number of pins to distribute
 * @param edge Which edge to place pins on
 * @param extension How far pins extend from boundary (default: 0)
 * @returns Array of pin specifications
 * 
 * @example
 * // 3 pins on left edge
 * generatePinSpecs(3, 'left', 0)
 * // Returns: [
 * //   {edge: 'left', t: 0.0, extension: 0},
 * //   {edge: 'left', t: 0.5, extension: 0},
 * //   {edge: 'left', t: 1.0, extension: 0}
 * // ]
 */
export function generatePinSpecs(
  numPins: number,
  edge: PinEdge,
  extension: number = 0
): PinSpec[] {
  const specs: PinSpec[] = [];
  
  if (numPins === 1) {
    // Single pin: center of edge
    specs.push({ edge, t: 0.5, extension });
  } else {
    // Multiple pins: endpoint distribution
    for (let i = 0; i < numPins; i++) {
      const t = i / (numPins - 1);
      specs.push({ edge, t, extension });
    }
  }
  
  return specs;
}

/**
 * Calculate bounding box for a multi-input gate.
 * 
 * Uses fixed width and height based on number of inputs with minimum constraints.
 * Height scales linearly with pin count to maintain consistent spacing.
 * 
 * @param numInputs Number of input pins (2-8)
 * @param gateWidth Gate body width (default: 60px)
 * @param pinSpacing Vertical spacing between pins (default: 15px)
 * @param minHeight Minimum gate height (default: 40px)
 * @returns Bounding box dimensions
 */
export function calculateGateBoundingBox(
  numInputs: number,
  gateWidth: number = 60,
  pinSpacing: number = 15,
  minHeight: number = 40
): BoundingBox {
  const totalPinHeight = (numInputs - 1) * pinSpacing;
  const height = Math.max(minHeight, totalPinHeight);
  
  return { width: gateWidth, height };
}

/**
 * Create input pins vertically spaced and centered around a position.
 * 
 * This is the **single source of truth** for multi-pin positioning logic.
 * 
 * Uses endpoint distribution formula: t_i = i / (n-1) for n pins.
 * Physical spacing is controlled by the `spacing` constant.
 * 
 * @param id Component identifier (used to generate pin IDs)
 * @param position Component center position (C_x, C_y)
 * @param numInputs Number of input pins (2 ≤ n ≤ 8)
 * @returns Array of Pin objects with calculated positions
 * 
 * @example
 * // For a 3-input gate at (100, 200):
 * const pins = createInputPinsAtPosition('and1', {x: 100, y: 200}, 3);
 * // Results in pins at y positions: [185, 200, 215]
 * // Pin span: 30px, centered at 200
 */
export function createInputPinsAtPosition(id: string, position: Point, numInputs: number): Pin[] {
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

/**
 * Create input pins using parametric positioning system.
 * 
 * This function generates pins based on parametric specifications and calculates
 * their physical positions using the component's bounding box.
 * 
 * @param id Component identifier (used to generate pin IDs)
 * @param center Component center position
 * @param boundingBox Component dimensions
 * @param numInputs Number of input pins (2-8)
 * @param edge Which edge to place pins on (default: 'left')
 * @param extension Pin extension distance (default: 0)
 * @returns Array of Pin objects with parametrically calculated positions
 */
export function createParametricInputPins(
  id: string,
  center: Point,
  boundingBox: BoundingBox,
  numInputs: number,
  edge: PinEdge = 'left',
  extension: number = 0
): Pin[] {
  const specs = generatePinSpecs(numInputs, edge, extension);
  
  // Calculate actual pin span (not bounding box)
  const pinSpacing = 15;
  const pinSpanHeight = (numInputs - 1) * pinSpacing;
  
  // Create a virtual box for pin positioning based on pin span
  const pinBox: BoundingBox = {
    width: boundingBox.width,
    height: pinSpanHeight
  };
  
  return specs.map((spec, i) => ({
    id: `${id}-in${i}`,
    label: String.fromCharCode(65 + i), // A, B, C, D, E, F, G, H
    position: calculatePinPosition(center, pinBox, spec),
    state: LogicLevel.LOW,
  }));
}

/**
 * Base class for multi-input, single-output logic gates.
 * 
 * ## Required Behavior: Parametric Pin Positioning
 * 
 * All subclasses MUST follow the parametric boundary coordinate system for pin positioning:
 * 
 * ### Input Pins
 * - Positioned on the LEFT edge by default
 * - Distributed using endpoint formula: t_i = i/(n-1)
 * - Vertical positions calculated relative to component center and height
 * - Must use `createInputPinsAtPosition()` for positioning consistency
 * 
 * ### Output Pin
 * - Positioned on the RIGHT edge by default
 * - Centered vertically: t = 0.5 → y = C_y
 * - Horizontal offset specified by subclass (typically gate width)
 * 
 * ### Position Updates
 * - When component moves, pins MUST move by same delta
 * - Pin relationships to boundary remain constant (parametric coordinates preserved)
 * - Use `updatePosition()` to maintain consistency
 * 
 * ### Resizing (Future)
 * - If gate height changes, pins MUST recalculate using same t values
 * - This ensures pins maintain relative positions on boundary
 * - Absolute spacing adapts automatically
 * 
 * @see createInputPinsAtPosition for pin positioning implementation
 * @see updatePosition for movement handling
 */
export abstract class MultiInputComponent extends LogicComponent {
  inputPins: Pin[];
  outputPin: Pin;
  numInputs: number;
  
  /** Parametric specifications for input pins */
  protected inputPinSpecs: PinSpec[];
  /** Parametric specification for output pin */
  protected outputPinSpec: PinSpec;
  /** Component bounding box */
  protected boundingBox: BoundingBox;

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
    
    // Calculate bounding box
    this.boundingBox = calculateGateBoundingBox(this.numInputs);
    
    // Generate parametric specifications
    this.inputPinSpecs = generatePinSpecs(this.numInputs, 'left', 0);
    this.outputPinSpec = { edge: 'right', t: 0.5, extension: 0 };
    
    // Create physical pins from specs
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
    return createInputPinsAtPosition(id, position, numInputs);
  }

  /**
   * Get the component's bounding box.
   * 
   * @returns Current bounding box dimensions
   */
  getBoundingBox(): BoundingBox {
    return this.boundingBox;
  }

  /**
   * Get parametric specifications for all pins.
   * 
   * @returns Object containing input and output pin specifications
   */
  getPinSpecs(): { inputs: PinSpec[]; output: PinSpec } {
    return {
      inputs: this.inputPinSpecs,
      output: this.outputPinSpec
    };
  }

  /**
   * Recalculate all pin positions using parametric specifications.
   * 
   * This method demonstrates the power of parametric positioning:
   * pins automatically reposition themselves based on current component
   * center and bounding box, maintaining their relative positions.
   * 
   * Call this after changing component position or bounding box.
   */
  protected recalculatePinPositions(): void {
    // Recalculate input pins using parametric specs
    this.inputPins = this.inputPinSpecs.map((spec, i) => ({
      ...this.inputPins[i],
      position: calculatePinPosition(this.position, this.boundingBox, spec)
    }));
    
    // Recalculate output pin using parametric spec
    this.outputPin = {
      ...this.outputPin,
      position: calculatePinPosition(this.position, this.boundingBox, this.outputPinSpec)
    };
  }

  getAllPins(): Pin[] {
    return [...this.inputPins, this.outputPin];
  }

  /**
   * Update pin positions when component moves.
   * 
   * Maintains parametric relationships by translating all pins by same delta.
   * This preserves the pins' relative positions on component boundaries.
   * 
   * @param newPosition New component center position
   * @param outputOffsetX Horizontal offset for output pin (typically gate width)
   * 
   * @invariant After update: pin.position - component.position remains constant
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
   * Update position using parametric recalculation.
   * 
   * This is the preferred method for parametric positioning.
   * Instead of translating by delta, it recalculates positions from specs.
   * 
   * @param newPosition New component center position
   */
  updatePositionParametric(newPosition: Point): void {
    this.position = newPosition;
    this.recalculatePinPositions();
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
   * Change number of inputs (recreate input pins).
   * 
   * Recalculates pin positions using parametric distribution.
   * Preserves existing pin states where possible (up to min(old, new) count).
   * 
   * This demonstrates parametric positioning: pins automatically redistribute
   * based on new count while maintaining centered, evenly-spaced layout.
   * 
   * @param numInputs New number of inputs (clamped to 2-8)
   */
  setNumInputs(numInputs: number): void {
    const oldNumInputs = this.numInputs;
    this.numInputs = Math.min(Math.max(numInputs, 2), 8);
    
    // Update bounding box for new pin count
    this.boundingBox = calculateGateBoundingBox(this.numInputs);
    
    // Update parametric specifications for new pin count
    this.inputPinSpecs = generatePinSpecs(this.numInputs, 'left', 0);
    
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
