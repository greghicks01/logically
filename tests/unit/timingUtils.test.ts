import {
  GATE_PROPAGATION_DELAYS,
  calculateDelay,
  getGateDelay,
  validateSimulationConfig,
  clampSpeed
} from '../../src/lib/timingUtils';
import { GateType } from '../../src/models/PropagationEvent';
import { SimulationModeType, DEFAULT_SIMULATION_CONFIG } from '../../src/models/SimulationMode';

describe('timingUtils', () => {
  describe('GATE_PROPAGATION_DELAYS', () => {
    it('contains all gate types', () => {
      const gateTypes = Object.values(GateType);
      gateTypes.forEach(type => {
        expect(GATE_PROPAGATION_DELAYS[type]).toBeDefined();
      });
    });
    
    it('maintains delay hierarchy: NOT < NAND/NOR < AND/OR < XOR/XNOR', () => {
      const delays = GATE_PROPAGATION_DELAYS;
      
      expect(delays[GateType.NOT].typicalDelay).toBeLessThan(delays[GateType.NAND].typicalDelay);
      expect(delays[GateType.NAND].typicalDelay).toBeLessThan(delays[GateType.AND].typicalDelay);
      expect(delays[GateType.AND].typicalDelay).toBeLessThan(delays[GateType.XOR].typicalDelay);
    });
    
    it('has consistent min < typical < max for all gates', () => {
      Object.values(GATE_PROPAGATION_DELAYS).forEach(profile => {
        expect(profile.minDelay).toBeLessThan(profile.typicalDelay);
        expect(profile.typicalDelay).toBeLessThan(profile.maxDelay);
      });
    });
    
    it('has expected values from research', () => {
      expect(GATE_PROPAGATION_DELAYS[GateType.NOT].typicalDelay).toBe(5);
      expect(GATE_PROPAGATION_DELAYS[GateType.BUFFER].typicalDelay).toBe(8);
      expect(GATE_PROPAGATION_DELAYS[GateType.NAND].typicalDelay).toBe(10);
      expect(GATE_PROPAGATION_DELAYS[GateType.NOR].typicalDelay).toBe(10);
      expect(GATE_PROPAGATION_DELAYS[GateType.AND].typicalDelay).toBe(15);
      expect(GATE_PROPAGATION_DELAYS[GateType.OR].typicalDelay).toBe(15);
      expect(GATE_PROPAGATION_DELAYS[GateType.XOR].typicalDelay).toBe(22);
      expect(GATE_PROPAGATION_DELAYS[GateType.XNOR].typicalDelay).toBe(22);
    });
  });
  
  describe('calculateDelay', () => {
    const config = { ...DEFAULT_SIMULATION_CONFIG };
    
    it('returns 0 for INSTANT mode', () => {
      const delay = calculateDelay(GateType.AND, SimulationModeType.INSTANT, config);
      expect(delay).toBe(0);
    });
    
    it('calculates smooth mode delay correctly', () => {
      const smoothConfig = {
        ...config,
        type: SimulationModeType.SMOOTH,
        smoothModeDelay: 500,
        speed: 1.0
      };
      
      const delay = calculateDelay(GateType.AND, SimulationModeType.SMOOTH, smoothConfig);
      expect(delay).toBe(500); // 500ms × 1.0
    });
    
    it('applies speed multiplier in smooth mode', () => {
      const smoothConfig = {
        ...config,
        type: SimulationModeType.SMOOTH,
        smoothModeDelay: 500,
        speed: 2.0
      };
      
      const delay = calculateDelay(GateType.AND, SimulationModeType.SMOOTH, smoothConfig);
      expect(delay).toBe(1000); // 500ms × 2.0
    });
    
    it('calculates realistic mode delay correctly', () => {
      const realisticConfig = {
        ...config,
        type: SimulationModeType.REALISTIC,
        realisticScaleFactor: 50_000_000,
        speed: 1.0
      };
      
      // XOR: 22ns × 50,000,000 / 1,000,000 = 1100ms
      const delay = calculateDelay(GateType.XOR, SimulationModeType.REALISTIC, realisticConfig);
      expect(delay).toBe(1100);
    });
    
    it('shows different delays for different gates in realistic mode', () => {
      const realisticConfig = {
        ...config,
        type: SimulationModeType.REALISTIC,
        realisticScaleFactor: 50_000_000,
        speed: 1.0
      };
      
      const notDelay = calculateDelay(GateType.NOT, SimulationModeType.REALISTIC, realisticConfig);
      const andDelay = calculateDelay(GateType.AND, SimulationModeType.REALISTIC, realisticConfig);
      const xorDelay = calculateDelay(GateType.XOR, SimulationModeType.REALISTIC, realisticConfig);
      
      // NOT (5ns) < AND (15ns) < XOR (22ns)
      expect(notDelay).toBeLessThan(andDelay);
      expect(andDelay).toBeLessThan(xorDelay);
      
      // Verify actual values
      expect(notDelay).toBe(250);  // 5 × 50M / 1M = 250ms
      expect(andDelay).toBe(750);  // 15 × 50M / 1M = 750ms
      expect(xorDelay).toBe(1100); // 22 × 50M / 1M = 1100ms
    });
    
    it('applies speed multiplier in realistic mode', () => {
      const realisticConfig = {
        ...config,
        type: SimulationModeType.REALISTIC,
        realisticScaleFactor: 50_000_000,
        speed: 0.5
      };
      
      const delay = calculateDelay(GateType.AND, SimulationModeType.REALISTIC, realisticConfig);
      expect(delay).toBe(375); // 750ms × 0.5
    });
    
    it('handles edge case of speed = 0.1', () => {
      const slowConfig = {
        ...config,
        type: SimulationModeType.SMOOTH,
        smoothModeDelay: 500,
        speed: 0.1
      };
      
      const delay = calculateDelay(GateType.AND, SimulationModeType.SMOOTH, slowConfig);
      expect(delay).toBe(50); // 500ms × 0.1
    });
    
    it('handles edge case of speed = 10.0', () => {
      const fastConfig = {
        ...config,
        type: SimulationModeType.SMOOTH,
        smoothModeDelay: 500,
        speed: 10.0
      };
      
      const delay = calculateDelay(GateType.AND, SimulationModeType.SMOOTH, fastConfig);
      expect(delay).toBe(5000); // 500ms × 10.0
    });
  });
  
  describe('getGateDelay', () => {
    it('returns typical delay for each gate type', () => {
      expect(getGateDelay(GateType.NOT)).toBe(5);
      expect(getGateDelay(GateType.NAND)).toBe(10);
      expect(getGateDelay(GateType.AND)).toBe(15);
      expect(getGateDelay(GateType.XOR)).toBe(22);
    });
    
    it('returns 0 for unknown gate type', () => {
      expect(getGateDelay('UNKNOWN' as GateType)).toBe(0);
    });
  });
  
  describe('validateSimulationConfig', () => {
    it('passes validation for default config', () => {
      const result = validateSimulationConfig(DEFAULT_SIMULATION_CONFIG);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('fails when speed < 0.1', () => {
      const config = { ...DEFAULT_SIMULATION_CONFIG, speed: 0.05 };
      const result = validateSimulationConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Speed must be between 0.1 and 10.0');
    });
    
    it('fails when speed > 10.0', () => {
      const config = { ...DEFAULT_SIMULATION_CONFIG, speed: 15.0 };
      const result = validateSimulationConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Speed must be between 0.1 and 10.0');
    });
    
    it('accepts boundary values for speed', () => {
      const config1 = { ...DEFAULT_SIMULATION_CONFIG, speed: 0.1 };
      expect(validateSimulationConfig(config1).valid).toBe(true);
      
      const config2 = { ...DEFAULT_SIMULATION_CONFIG, speed: 10.0 };
      expect(validateSimulationConfig(config2).valid).toBe(true);
    });
    
    it('fails when stepMode and isPlaying are both true', () => {
      const config = {
        ...DEFAULT_SIMULATION_CONFIG,
        stepMode: true,
        isPlaying: true
      };
      const result = validateSimulationConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Cannot auto-play in step mode');
    });
    
    it('fails when smoothModeDelay <= 0', () => {
      const config = { ...DEFAULT_SIMULATION_CONFIG, smoothModeDelay: 0 };
      const result = validateSimulationConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Smooth mode delay must be positive');
    });
    
    it('fails when realisticScaleFactor <= 0', () => {
      const config = { ...DEFAULT_SIMULATION_CONFIG, realisticScaleFactor: -1 };
      const result = validateSimulationConfig(config);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Realistic scale factor must be positive');
    });
  });
  
  describe('clampSpeed', () => {
    it('returns value within range unchanged', () => {
      expect(clampSpeed(1.0)).toBe(1.0);
      expect(clampSpeed(5.0)).toBe(5.0);
    });
    
    it('clamps values below minimum to 0.1', () => {
      expect(clampSpeed(0.05)).toBe(0.1);
      expect(clampSpeed(-1.0)).toBe(0.1);
      expect(clampSpeed(0)).toBe(0.1);
    });
    
    it('clamps values above maximum to 10.0', () => {
      expect(clampSpeed(15.0)).toBe(10.0);
      expect(clampSpeed(100.0)).toBe(10.0);
    });
    
    it('returns boundary values unchanged', () => {
      expect(clampSpeed(0.1)).toBe(0.1);
      expect(clampSpeed(10.0)).toBe(10.0);
    });
  });
});
