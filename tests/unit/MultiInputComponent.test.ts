import { describe, it, expect } from '@jest/globals';
import { MultiInputComponent } from '../../src/models/bases/MultiInputComponent';
import { LogicLevel } from '../../src/models/LogicLevel';
import { Point } from '../../src/models/Point';

/**
 * Concrete test implementation of MultiInputComponent
 * (Since it's abstract, we need a concrete class for testing)
 */
class TestGate extends MultiInputComponent {
  constructor(id: string, position: Point, numInputs: number) {
    super(id, position, numInputs, 60, LogicLevel.LOW, 'TEST');
  }

  computeOutput(...inputs: LogicLevel[]): LogicLevel {
    // Simple test logic: return HIGH if any input is HIGH
    return inputs.some(i => i === LogicLevel.HIGH) ? LogicLevel.HIGH : LogicLevel.LOW;
  }

  getTypeName(): string {
    return 'TestGate';
  }
}

describe('MultiInputComponent with Parametric Positioning', () => {
  describe('Construction', () => {
    it('should initialize with correct number of input pins', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      expect(gate.numInputs).toBe(3);
      expect(gate.inputPins).toHaveLength(3);
    });

    it('should clamp inputs to minimum of 2', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 1);
      
      expect(gate.numInputs).toBe(2);
      expect(gate.inputPins).toHaveLength(2);
    });

    it('should clamp inputs to maximum of 8', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 10);
      
      expect(gate.numInputs).toBe(8);
      expect(gate.inputPins).toHaveLength(8);
    });

    it('should create output pin at correct position', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 2);
      
      expect(gate.outputPin.id).toBe('gate1-out');
      expect(gate.outputPin.label).toBe('OUT');
      // Output at center-right: x = 100 + 60 = 160, y = 200
      expect(gate.outputPin.position).toEqual({ x: 160, y: 200 });
    });

    it('should initialize bounding box based on input count', () => {
      const gate2 = new TestGate('gate1', { x: 100, y: 200 }, 2);
      const gate5 = new TestGate('gate2', { x: 100, y: 200 }, 5);
      
      // 2 inputs: (2-1)*15 = 15 < 40, use min
      expect(gate2.getBoundingBox()).toEqual({ width: 60, height: 40 });
      
      // 5 inputs: (5-1)*15 = 60 > 40
      expect(gate5.getBoundingBox()).toEqual({ width: 60, height: 60 });
    });

    it('should initialize parametric pin specifications', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      const specs = gate.getPinSpecs();
      
      // Input pins on left edge
      expect(specs.inputs).toHaveLength(3);
      expect(specs.inputs.every(s => s.edge === 'left')).toBe(true);
      expect(specs.inputs.map(s => s.t)).toEqual([0, 0.5, 1]);
      
      // Output pin on right edge, centered
      expect(specs.output.edge).toBe('right');
      expect(specs.output.t).toBe(0.5);
    });
  });

  describe('Pin positioning', () => {
    it('should position input pins vertically centered', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      // 3 pins: spacing = 15, total = 30
      // Positions: y = 200 - 15, 200, 200 + 15
      expect(gate.inputPins[0].position.y).toBe(185);
      expect(gate.inputPins[1].position.y).toBe(200);
      expect(gate.inputPins[2].position.y).toBe(215);
    });

    it('should position all input pins on left edge', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 4);
      
      // All inputs at x = 100 (component center)
      expect(gate.inputPins.every(pin => pin.position.x === 100)).toBe(true);
    });

    it('should assign correct labels to input pins', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 5);
      
      const labels = gate.inputPins.map(p => p.label);
      expect(labels).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should assign correct IDs to pins', () => {
      const gate = new TestGate('mygate', { x: 100, y: 200 }, 3);
      
      expect(gate.inputPins[0].id).toBe('mygate-in0');
      expect(gate.inputPins[1].id).toBe('mygate-in1');
      expect(gate.inputPins[2].id).toBe('mygate-in2');
      expect(gate.outputPin.id).toBe('mygate-out');
    });
  });

  describe('updatePosition (legacy method)', () => {
    it('should move all pins by same delta', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      const oldInputPos = gate.inputPins.map(p => ({ ...p.position }));
      const oldOutputPos = { ...gate.outputPin.position };
      
      gate.updatePosition({ x: 150, y: 300 }, 60);
      
      // Verify delta is applied correctly (dx=50, dy=100)
      expect(gate.inputPins[0].position.x).toBe(oldInputPos[0].x + 50);
      expect(gate.inputPins[0].position.y).toBe(oldInputPos[0].y + 100);
      expect(gate.outputPin.position.x).toBe(oldOutputPos.x + 50);
      expect(gate.outputPin.position.y).toBe(oldOutputPos.y + 100);
    });

    it('should update component position', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      gate.updatePosition({ x: 150, y: 300 }, 60);
      
      expect(gate.position).toEqual({ x: 150, y: 300 });
    });

    it('should maintain pin-to-center offsets', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 4);
      
      // Calculate initial offsets
      const initialOffsets = gate.inputPins.map(pin => ({
        dx: pin.position.x - gate.position.x,
        dy: pin.position.y - gate.position.y
      }));
      
      // Move the component
      gate.updatePosition({ x: 250, y: 350 }, 60);
      
      // Verify offsets are preserved
      gate.inputPins.forEach((pin, i) => {
        expect(pin.position.x - gate.position.x).toBeCloseTo(initialOffsets[i].dx, 10);
        expect(pin.position.y - gate.position.y).toBeCloseTo(initialOffsets[i].dy, 10);
      });
    });
  });

  describe('updatePositionParametric (new method)', () => {
    it('should recalculate pin positions from specs', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      gate.updatePositionParametric({ x: 150, y: 300 });
      
      expect(gate.position).toEqual({ x: 150, y: 300 });
      
      // Verify pins are recalculated (not just translated)
      // For 3 inputs: bounding box height = 40 (min), t values are 0, 0.5, 1
      // Positions: center.y - height/2 + t*height
      // = 300 - 20 + [0*40, 0.5*40, 1*40] = [280, 300, 320]
      expect(gate.inputPins[0].position.y).toBe(280); // t=0
      expect(gate.inputPins[1].position.y).toBe(300); // t=0.5
      expect(gate.inputPins[2].position.y).toBe(320); // t=1
    });

    it('should maintain parametric relationships', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 4);
      
      // Get pin specs before move
      const specsBefore = gate.getPinSpecs();
      
      gate.updatePositionParametric({ x: 300, y: 400 });
      
      // Get pin specs after move
      const specsAfter = gate.getPinSpecs();
      
      // Parametric specs should be unchanged
      expect(specsAfter.inputs).toEqual(specsBefore.inputs);
      expect(specsAfter.output).toEqual(specsBefore.output);
    });

    it('should produce same result as legacy method for translation', () => {
      const gate1 = new TestGate('gate1', { x: 100, y: 200 }, 5);
      const gate2 = new TestGate('gate2', { x: 100, y: 200 }, 5);
      
      const newPos = { x: 200, y: 350 };
      
      gate1.updatePosition(newPos, 60);
      gate2.updatePositionParametric(newPos);
      
      // The parametric method recalculates from specs, while legacy translates.
      // For simple translation, they should match for input Y positions,
      // but X positions will differ since parametric uses bounding box edge.
      
      // Input pins Y positions should match (both methods maintain parametric t values)
      for (let i = 0; i < 5; i++) {
        expect(gate2.inputPins[i].position.y).toBeCloseTo(gate1.inputPins[i].position.y, 10);
      }
      
      // Output pin Y should match (both centered)
      expect(gate2.outputPin.position.y).toBeCloseTo(gate1.outputPin.position.y, 10);
      
      // Note: X positions will differ because parametric uses bounding box,
      // while legacy uses the passed outputOffsetX parameter
    });
  });

  describe('setNumInputs', () => {
    it('should update number of inputs', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      gate.setNumInputs(5);
      
      expect(gate.numInputs).toBe(5);
      expect(gate.inputPins).toHaveLength(5);
    });

    it('should preserve existing pin states', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      // Set some pin states
      gate.inputPins[0].state = LogicLevel.HIGH;
      gate.inputPins[1].state = LogicLevel.LOW;
      gate.inputPins[2].state = LogicLevel.HIGH;
      
      // Increase to 5 inputs
      gate.setNumInputs(5);
      
      // First 3 states should be preserved
      expect(gate.inputPins[0].state).toBe(LogicLevel.HIGH);
      expect(gate.inputPins[1].state).toBe(LogicLevel.LOW);
      expect(gate.inputPins[2].state).toBe(LogicLevel.HIGH);
      
      // New pins should have default LOW state
      expect(gate.inputPins[3].state).toBe(LogicLevel.LOW);
      expect(gate.inputPins[4].state).toBe(LogicLevel.LOW);
    });

    it('should preserve states when reducing inputs', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 5);
      
      gate.inputPins[0].state = LogicLevel.HIGH;
      gate.inputPins[1].state = LogicLevel.LOW;
      gate.inputPins[2].state = LogicLevel.HIGH;
      
      // Reduce to 3 inputs
      gate.setNumInputs(3);
      
      expect(gate.inputPins[0].state).toBe(LogicLevel.HIGH);
      expect(gate.inputPins[1].state).toBe(LogicLevel.LOW);
      expect(gate.inputPins[2].state).toBe(LogicLevel.HIGH);
    });

    it('should recalculate pin positions based on new count', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 2);
      
      // 2 inputs: spacing 15, positions at 185 and 215
      expect(gate.inputPins[0].position.y).toBe(192.5); // 200 - 7.5
      expect(gate.inputPins[1].position.y).toBe(207.5); // 200 + 7.5
      
      gate.setNumInputs(4);
      
      // 4 inputs: spacing 15, total 45
      // Positions: 200 - 22.5, 200 - 7.5, 200 + 7.5, 200 + 22.5
      expect(gate.inputPins[0].position.y).toBe(177.5);
      expect(gate.inputPins[1].position.y).toBe(192.5);
      expect(gate.inputPins[2].position.y).toBe(207.5);
      expect(gate.inputPins[3].position.y).toBe(222.5);
    });

    it('should maintain vertical centering after resize', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      gate.setNumInputs(7);
      
      // Average Y should still be at center
      const avgY = gate.inputPins.reduce((sum, p) => sum + p.position.y, 0) / 7;
      expect(avgY).toBeCloseTo(200, 10);
    });
  });

  describe('getAllPins', () => {
    it('should return all pins including inputs and output', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 4);
      
      const allPins = gate.getAllPins();
      
      expect(allPins).toHaveLength(5); // 4 inputs + 1 output
      expect(allPins.slice(0, 4)).toEqual(gate.inputPins);
      expect(allPins[4]).toBe(gate.outputPin);
    });
  });

  describe('computeOutputs', () => {
    it('should call computeOutput with input states', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      gate.inputPins[0].state = LogicLevel.HIGH;
      gate.inputPins[1].state = LogicLevel.LOW;
      gate.inputPins[2].state = LogicLevel.LOW;
      
      gate.computeOutputs();
      
      // TestGate returns HIGH if any input is HIGH
      expect(gate.outputPin.state).toBe(LogicLevel.HIGH);
    });

    it('should update output state correctly', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 2);
      
      gate.inputPins[0].state = LogicLevel.LOW;
      gate.inputPins[1].state = LogicLevel.LOW;
      
      gate.computeOutputs();
      expect(gate.outputPin.state).toBe(LogicLevel.LOW);
      
      gate.inputPins[0].state = LogicLevel.HIGH;
      gate.computeOutputs();
      expect(gate.outputPin.state).toBe(LogicLevel.HIGH);
    });
  });

  describe('Integration: Parametric system in action', () => {
    it('should maintain pin distribution when moving and resizing', () => {
      const gate = new TestGate('gate1', { x: 100, y: 200 }, 3);
      
      // Move using parametric method
      gate.updatePositionParametric({ x: 200, y: 300 });
      
      // Resize - this updates bounding box
      gate.setNumInputs(5);
      
      // Check position after resize (still at last set position)
      const center = gate.position;
      
      // Move again
      gate.updatePositionParametric({ x: 150, y: 250 });
      
      // Verify pins are correctly distributed at new position
      const avgY = gate.inputPins.reduce((sum, p) => sum + p.position.y, 0) / 5;
      expect(avgY).toBeCloseTo(250, 10);
      
      // Verify even parametric spacing (t=0, 0.25, 0.5, 0.75, 1)
      // For 5 pins with bounding box height 60: spacing = 60/4 = 15
      for (let i = 1; i < gate.inputPins.length; i++) {
        const spacing = gate.inputPins[i].position.y - gate.inputPins[i-1].position.y;
        expect(spacing).toBeCloseTo(15, 10);
      }
    });

    it('should support creating gates with different pin counts at same position', () => {
      const gates = [2, 3, 4, 5, 6, 7, 8].map((numInputs, i) => 
        new TestGate(`gate${i}`, { x: 100, y: 200 }, numInputs)
      );
      
      // All should have centered input pins
      gates.forEach(gate => {
        const avgY = gate.inputPins.reduce((sum, p) => sum + p.position.y, 0) / gate.numInputs;
        expect(avgY).toBeCloseTo(200, 10);
      });
      
      // All should have output at same position
      gates.forEach(gate => {
        expect(gate.outputPin.position).toEqual({ x: 160, y: 200 });
      });
    });
  });
});
