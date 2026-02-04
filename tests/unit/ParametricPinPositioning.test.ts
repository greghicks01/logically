import { describe, it, expect } from '@jest/globals';
import {
  PinSpec,
  PinEdge,
  BoundingBox,
  calculatePinPosition,
  generatePinSpecs,
  calculateGateBoundingBox,
  createParametricInputPins,
} from '../../src/models/bases/MultiInputComponent';
import { Point } from '../../src/models/Point';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('Parametric Pin Positioning System', () => {
  describe('calculatePinPosition', () => {
    const center: Point = { x: 100, y: 200 };
    const boundingBox: BoundingBox = { width: 60, height: 40 };

    describe('Left edge', () => {
      it('should place pin at top of left edge (t=0)', () => {
        const spec: PinSpec = { edge: 'left', t: 0, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = center.x - width/2 = 100 - 30 = 70
        // y = center.y - height/2 + t*height = 200 - 20 + 0*40 = 180
        expect(pos).toEqual({ x: 70, y: 180 });
      });

      it('should place pin at middle of left edge (t=0.5)', () => {
        const spec: PinSpec = { edge: 'left', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 - 30 = 70
        // y = 200 - 20 + 0.5*40 = 200
        expect(pos).toEqual({ x: 70, y: 200 });
      });

      it('should place pin at bottom of left edge (t=1)', () => {
        const spec: PinSpec = { edge: 'left', t: 1, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 70
        // y = 200 - 20 + 1*40 = 220
        expect(pos).toEqual({ x: 70, y: 220 });
      });

      it('should apply extension away from edge', () => {
        const spec: PinSpec = { edge: 'left', t: 0.5, extension: 5 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 - 30 - 5 = 65 (extended left)
        // y = 200
        expect(pos).toEqual({ x: 65, y: 200 });
      });
    });

    describe('Right edge', () => {
      it('should place pin at middle of right edge (t=0.5)', () => {
        const spec: PinSpec = { edge: 'right', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = center.x + width/2 = 100 + 30 = 130
        // y = 200 - 20 + 0.5*40 = 200
        expect(pos).toEqual({ x: 130, y: 200 });
      });

      it('should apply extension away from edge', () => {
        const spec: PinSpec = { edge: 'right', t: 0.5, extension: 10 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 + 30 + 10 = 140 (extended right)
        expect(pos).toEqual({ x: 140, y: 200 });
      });

      it('should span full height from t=0 to t=1', () => {
        const top = calculatePinPosition(center, boundingBox, { edge: 'right', t: 0, extension: 0 });
        const bottom = calculatePinPosition(center, boundingBox, { edge: 'right', t: 1, extension: 0 });
        
        expect(top.y).toBe(180);
        expect(bottom.y).toBe(220);
        expect(bottom.y - top.y).toBe(40); // Full height
      });
    });

    describe('Top edge', () => {
      it('should place pin at left of top edge (t=0)', () => {
        const spec: PinSpec = { edge: 'top', t: 0, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = center.x - width/2 + t*width = 100 - 30 + 0*60 = 70
        // y = center.y - height/2 = 200 - 20 = 180
        expect(pos).toEqual({ x: 70, y: 180 });
      });

      it('should place pin at middle of top edge (t=0.5)', () => {
        const spec: PinSpec = { edge: 'top', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 - 30 + 0.5*60 = 100
        // y = 180
        expect(pos).toEqual({ x: 100, y: 180 });
      });

      it('should apply extension away from edge', () => {
        const spec: PinSpec = { edge: 'top', t: 0.5, extension: 8 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // y = 200 - 20 - 8 = 172 (extended up)
        expect(pos).toEqual({ x: 100, y: 172 });
      });
    });

    describe('Bottom edge', () => {
      it('should place pin at middle of bottom edge (t=0.5)', () => {
        const spec: PinSpec = { edge: 'bottom', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 - 30 + 0.5*60 = 100
        // y = center.y + height/2 = 200 + 20 = 220
        expect(pos).toEqual({ x: 100, y: 220 });
      });

      it('should apply extension away from edge', () => {
        const spec: PinSpec = { edge: 'bottom', t: 0.5, extension: 12 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // y = 200 + 20 + 12 = 232 (extended down)
        expect(pos).toEqual({ x: 100, y: 232 });
      });
    });

    describe('Edge cases', () => {
      it('should handle zero-width bounding box', () => {
        const narrowBox: BoundingBox = { width: 0, height: 40 };
        const spec: PinSpec = { edge: 'left', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, narrowBox, spec);
        
        expect(pos).toEqual({ x: 100, y: 200 });
      });

      it('should handle zero-height bounding box', () => {
        const flatBox: BoundingBox = { width: 60, height: 0 };
        const spec: PinSpec = { edge: 'left', t: 0.5, extension: 0 };
        const pos = calculatePinPosition(center, flatBox, spec);
        
        expect(pos).toEqual({ x: 70, y: 200 });
      });

      it('should handle negative extension (inside boundary)', () => {
        const spec: PinSpec = { edge: 'left', t: 0.5, extension: -5 };
        const pos = calculatePinPosition(center, boundingBox, spec);
        
        // x = 100 - 30 - (-5) = 75 (moved inward)
        expect(pos).toEqual({ x: 75, y: 200 });
      });
    });
  });

  describe('generatePinSpecs', () => {
    describe('Single pin', () => {
      it('should place single pin at center of edge (t=0.5)', () => {
        const specs = generatePinSpecs(1, 'left', 0);
        
        expect(specs).toHaveLength(1);
        expect(specs[0]).toEqual({ edge: 'left', t: 0.5, extension: 0 });
      });

      it('should respect extension parameter', () => {
        const specs = generatePinSpecs(1, 'right', 10);
        
        expect(specs[0]).toEqual({ edge: 'right', t: 0.5, extension: 10 });
      });
    });

    describe('Two pins (endpoint distribution)', () => {
      it('should place at t=0 and t=1', () => {
        const specs = generatePinSpecs(2, 'left', 0);
        
        expect(specs).toHaveLength(2);
        expect(specs[0].t).toBe(0);
        expect(specs[1].t).toBe(1);
      });
    });

    describe('Three pins', () => {
      it('should place at t=0, t=0.5, t=1', () => {
        const specs = generatePinSpecs(3, 'left', 0);
        
        expect(specs).toHaveLength(3);
        expect(specs[0].t).toBe(0);
        expect(specs[1].t).toBe(0.5);
        expect(specs[2].t).toBe(1);
      });

      it('should apply to different edges', () => {
        const specs = generatePinSpecs(3, 'top', 0);
        
        expect(specs.every(s => s.edge === 'top')).toBe(true);
      });
    });

    describe('Many pins', () => {
      it('should distribute 8 pins evenly', () => {
        const specs = generatePinSpecs(8, 'left', 0);
        
        expect(specs).toHaveLength(8);
        
        // Endpoint distribution: t_i = i / (n-1)
        const expectedT = [0, 1/7, 2/7, 3/7, 4/7, 5/7, 6/7, 1];
        specs.forEach((spec, i) => {
          expect(spec.t).toBeCloseTo(expectedT[i], 10);
        });
      });

      it('should maintain equal spacing between adjacent pins', () => {
        const specs = generatePinSpecs(5, 'left', 0);
        
        // Calculate spacing between consecutive pins
        const spacings = [];
        for (let i = 1; i < specs.length; i++) {
          spacings.push(specs[i].t - specs[i-1].t);
        }
        
        // All spacings should be equal (0.25 for 5 pins)
        const expectedSpacing = 1 / 4;
        spacings.forEach(spacing => {
          expect(spacing).toBeCloseTo(expectedSpacing, 10);
        });
      });
    });

    describe('Extension parameter', () => {
      it('should apply extension to all pins', () => {
        const specs = generatePinSpecs(4, 'right', 15);
        
        expect(specs.every(s => s.extension === 15)).toBe(true);
      });
    });
  });

  describe('calculateGateBoundingBox', () => {
    it('should use minimum height for 2 inputs', () => {
      const box = calculateGateBoundingBox(2);
      
      // totalPinHeight = (2-1) * 15 = 15
      // height = max(40, 15) = 40
      expect(box).toEqual({ width: 60, height: 40 });
    });

    it('should use minimum height for 3 inputs', () => {
      const box = calculateGateBoundingBox(3);
      
      // totalPinHeight = (3-1) * 15 = 30
      // height = max(40, 30) = 40
      expect(box).toEqual({ width: 60, height: 40 });
    });

    it('should scale height beyond minimum for 4 inputs', () => {
      const box = calculateGateBoundingBox(4);
      
      // totalPinHeight = (4-1) * 15 = 45
      // height = max(40, 45) = 45
      expect(box).toEqual({ width: 60, height: 45 });
    });

    it('should scale height linearly with more inputs', () => {
      const box8 = calculateGateBoundingBox(8);
      
      // totalPinHeight = (8-1) * 15 = 105
      expect(box8).toEqual({ width: 60, height: 105 });
    });

    it('should respect custom gate width', () => {
      const box = calculateGateBoundingBox(3, 80);
      
      expect(box.width).toBe(80);
    });

    it('should respect custom pin spacing', () => {
      const box = calculateGateBoundingBox(4, 60, 20);
      
      // totalPinHeight = (4-1) * 20 = 60
      expect(box.height).toBe(60);
    });

    it('should respect custom minimum height', () => {
      const box = calculateGateBoundingBox(2, 60, 15, 50);
      
      // totalPinHeight = 15, but minHeight = 50
      expect(box.height).toBe(50);
    });
  });

  describe('createParametricInputPins', () => {
    const id = 'test-gate';
    const center: Point = { x: 100, y: 200 };
    const boundingBox: BoundingBox = { width: 60, height: 40 };

    it('should create 2 pins with correct positions', () => {
      const pins = createParametricInputPins(id, center, boundingBox, 2);
      
      expect(pins).toHaveLength(2);
      expect(pins[0].id).toBe('test-gate-in0');
      expect(pins[0].label).toBe('A');
      // Pin span = (2-1)*15 = 15, so t=0: y = 200 - 7.5 = 192.5
      expect(pins[0].position).toEqual({ x: 70, y: 192.5 }); // t=0
      
      expect(pins[1].id).toBe('test-gate-in1');
      expect(pins[1].label).toBe('B');
      // t=1: y = 200 + 7.5 = 207.5
      expect(pins[1].position).toEqual({ x: 70, y: 207.5 }); // t=1
    });

    it('should create 3 pins with correct labels', () => {
      const pins = createParametricInputPins(id, center, boundingBox, 3);
      
      expect(pins).toHaveLength(3);
      expect(pins.map(p => p.label)).toEqual(['A', 'B', 'C']);
    });

    it('should create 8 pins with correct labels', () => {
      const pins = createParametricInputPins(id, center, boundingBox, 8);
      
      expect(pins).toHaveLength(8);
      expect(pins.map(p => p.label)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    });

    it('should place pins on specified edge', () => {
      const pinsRight = createParametricInputPins(id, center, boundingBox, 2, 'right');
      
      // Right edge: x = 100 + 30 = 130
      expect(pinsRight[0].position.x).toBe(130);
      expect(pinsRight[1].position.x).toBe(130);
    });

    it('should apply extension', () => {
      const pins = createParametricInputPins(id, center, boundingBox, 2, 'left', 10);
      
      // Left edge with extension: x = 100 - 30 - 10 = 60
      expect(pins[0].position.x).toBe(60);
      expect(pins[1].position.x).toBe(60);
    });

    it('should initialize all pins with LOW state', () => {
      const pins = createParametricInputPins(id, center, boundingBox, 4);
      
      expect(pins.every(p => p.state === LogicLevel.LOW)).toBe(true);
    });
  });

  describe('Parametric system integration', () => {
    it('should maintain relative positions when component moves', () => {
      const center1: Point = { x: 100, y: 200 };
      const center2: Point = { x: 300, y: 400 };
      const boundingBox: BoundingBox = { width: 60, height: 60 };
      
      const pins1 = createParametricInputPins('gate1', center1, boundingBox, 3);
      const pins2 = createParametricInputPins('gate2', center2, boundingBox, 3);
      
      // Pins should have same relative positions
      for (let i = 0; i < 3; i++) {
        const offset1 = { x: pins1[i].position.x - center1.x, y: pins1[i].position.y - center1.y };
        const offset2 = { x: pins2[i].position.x - center2.x, y: pins2[i].position.y - center2.y };
        
        expect(offset1.x).toBeCloseTo(offset2.x, 10);
        expect(offset1.y).toBeCloseTo(offset2.y, 10);
      }
    });

    it('should adapt to different bounding box heights', () => {
      const center: Point = { x: 100, y: 200 };
      const box1: BoundingBox = { width: 60, height: 40 };
      const box2: BoundingBox = { width: 60, height: 80 };
      
      const pins1 = createParametricInputPins('gate1', center, box1, 3);
      const pins2 = createParametricInputPins('gate2', center, box2, 3);
      
      // Pin span is based on (numInputs-1)*15, NOT bounding box
      // For 3 pins: span = (3-1)*15 = 30px regardless of bounding box
      const span1 = pins1[2].position.y - pins1[0].position.y;
      const span2 = pins2[2].position.y - pins2[0].position.y;
      
      expect(span1).toBe(30);
      expect(span2).toBe(30); // Same span, not affected by bounding box
      
      // Pins maintain parametric t values (0, 0.5, 1) on pin span
      // So they have same absolute spacing regardless of gate size
    });

    it('should center pins vertically regardless of count', () => {
      const center: Point = { x: 100, y: 200 };
      const boundingBox: BoundingBox = { width: 60, height: 60 };
      
      for (let numPins = 2; numPins <= 8; numPins++) {
        const pins = createParametricInputPins('gate', center, boundingBox, numPins);
        
        // Average Y position should be at center
        const avgY = pins.reduce((sum, p) => sum + p.position.y, 0) / pins.length;
        expect(avgY).toBeCloseTo(center.y, 10);
      }
    });
  });
});
