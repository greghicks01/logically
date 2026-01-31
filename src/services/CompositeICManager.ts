import { CompositeIC, createCompositeIC, ValidationResult, validateCompositeIC } from '../models/CompositeIC';
import { Circuit, Component, createCircuit } from '../models/Circuit';
import { ICPin, createICPin } from '../models/ICPin';
import { Point } from '../models/Point';

/**
 * Pin mapping configuration
 */
export interface PinMapping {
  label: string;
  internalWireId: string;
}

/**
 * IC creation configuration
 */
export interface CreateICConfig {
  name: string;
  description?: string;
  sourceCircuit: Circuit;
  inputPinMappings: PinMapping[];
  outputPinMappings: PinMapping[];
}

/**
 * Composite IC Manager service
 * Handles creation, storage, and instantiation of composite ICs
 */
export class CompositeICManager {
  private icLibrary: Map<string, CompositeIC> = new Map();

  /**
   * Create a composite IC from a circuit
   */
  createCompositeIC(config: CreateICConfig): CompositeIC {
    const id = this.generateId();

    // Create input pins
    const inputPins: ICPin[] = config.inputPinMappings.map((mapping, index) =>
      createICPin(`${id}-in-${index}`, mapping.label, 'input', mapping.internalWireId)
    );

    // Create output pins
    const outputPins: ICPin[] = config.outputPinMappings.map((mapping, index) =>
      createICPin(`${id}-out-${index}`, mapping.label, 'output', mapping.internalWireId)
    );

    // Calculate nesting level
    const nestingLevel = this.calculateNestingDepth(config.sourceCircuit);

    // Create IC
    const ic = createCompositeIC({
      id,
      name: config.name,
      description: config.description,
      inputPins,
      outputPins,
      internalCircuit: config.sourceCircuit,
      nestingLevel,
    });

    // Validate
    const validation = validateCompositeIC(ic);
    if (!validation.valid) {
      throw new Error(`Invalid IC: ${validation.errors.join(', ')}`);
    }

    // Show warnings
    if (validation.warnings.length > 0) {
      console.warn('IC Warnings:', validation.warnings.join(', '));
    }

    // Store in library
    this.icLibrary.set(ic.id, ic);

    return ic;
  }

  /**
   * Calculate nesting depth
   * Uses iterative algorithm to prevent stack overflow
   */
  calculateNestingDepth(circuit: Circuit, visited: Set<string> = new Set()): number {
    let maxDepth = 1;

    for (const component of circuit.components) {
      // Check if component is a CompositeIC
      if (this.isCompositeIC(component)) {
        const icId = (component as any).icId;
        
        if (visited.has(icId)) {
          continue; // Prevent circular references
        }
        
        visited.add(icId);
        const ic = this.icLibrary.get(icId);
        
        if (ic) {
          const childDepth = this.calculateNestingDepth(ic.internalCircuit, new Set(visited));
          maxDepth = Math.max(maxDepth, 1 + childDepth);
        }
        
        visited.delete(icId);
      }
    }

    return maxDepth;
  }

  /**
   * Instantiate a composite IC
   */
  instantiateCompositeIC(config: {
    icId: string;
    position: Point;
  }): Component & { icId: string; ic: CompositeIC } {
    const ic = this.icLibrary.get(config.icId);
    if (!ic) {
      throw new Error(`IC ${config.icId} not found in library`);
    }

    return {
      id: this.generateId(),
      type: 'CompositeIC',
      position: config.position,
      icId: config.icId,
      ic: ic,
    };
  }

  /**
   * Get IC from library
   */
  getIC(icId: string): CompositeIC | undefined {
    return this.icLibrary.get(icId);
  }

  /**
   * Get all ICs in library
   */
  getAllICs(): CompositeIC[] {
    return Array.from(this.icLibrary.values());
  }

  /**
   * Delete IC from library
   */
  deleteIC(icId: string): boolean {
    return this.icLibrary.delete(icId);
  }

  /**
   * Check if component is a composite IC
   */
  private isCompositeIC(component: Component): boolean {
    return component.type === 'CompositeIC';
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `ic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add inverter to IC pin
   */
  addInverterToPin(icId: string, pinId: string): void {
    const ic = this.icLibrary.get(icId);
    if (!ic) {
      throw new Error(`IC ${icId} not found`);
    }

    const pin = [...ic.inputPins, ...ic.outputPins].find((p) => p.id === pinId);
    if (!pin) {
      throw new Error(`Pin ${pinId} not found on IC ${icId}`);
    }

    pin.hasInverter = true;
    ic.modifiedAt = new Date();
  }

  /**
   * Remove inverter from IC pin
   */
  removeInverterFromPin(icId: string, pinId: string): void {
    const ic = this.icLibrary.get(icId);
    if (!ic) {
      throw new Error(`IC ${icId} not found`);
    }

    const pin = [...ic.inputPins, ...ic.outputPins].find((p) => p.id === pinId);
    if (!pin) {
      throw new Error(`Pin ${pinId} not found on IC ${icId}`);
    }

    pin.hasInverter = false;
    ic.modifiedAt = new Date();
  }
}
