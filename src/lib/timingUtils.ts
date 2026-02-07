import { GateType } from '../models/PropagationEvent';
import { SimulationModeType, SimulationModeConfig } from '../models/SimulationMode';

/**
 * Propagation delay profile for a gate type
 * Based on TTL 74LS-series datasheets
 */
export interface GateDelayProfile {
  /** Gate type identifier */
  type: GateType;
  
  /** Typical propagation delay (nanoseconds) */
  typicalDelay: number;
  
  /** Minimum propagation delay (nanoseconds) */
  minDelay: number;
  
  /** Maximum propagation delay (nanoseconds) */
  maxDelay: number;
  
  /** Standard for these values */
  standard: string;
  
  /** Reference source */
  reference: string;
}

/**
 * Gate propagation delays based on TTL 74LS-series
 * Values represent typical propagation delays in nanoseconds
 * 
 * Mathematical model:
 * - Simple gates (NOT, Buffer): Single stage, fastest
 * - Basic gates (NAND, NOR): Fundamental TTL building blocks
 * - Compound gates (AND, OR): Built from basic + inverter
 * - Complex gates (XOR, XNOR): Multiple internal stages
 */
export const GATE_PROPAGATION_DELAYS: Record<GateType, GateDelayProfile> = {
  [GateType.NOT]: {
    type: GateType.NOT,
    typicalDelay: 5,
    minDelay: 3,
    maxDelay: 7,
    standard: '74LS TTL',
    reference: '74LS04 Datasheet'
  },
  [GateType.BUFFER]: {
    type: GateType.BUFFER,
    typicalDelay: 8,
    minDelay: 5,
    maxDelay: 11,
    standard: '74LS TTL',
    reference: '74LS125 Datasheet'
  },
  [GateType.NAND]: {
    type: GateType.NAND,
    typicalDelay: 10,
    minDelay: 7,
    maxDelay: 15,
    standard: '74LS TTL',
    reference: '74LS00 Datasheet'
  },
  [GateType.NOR]: {
    type: GateType.NOR,
    typicalDelay: 10,
    minDelay: 7,
    maxDelay: 15,
    standard: '74LS TTL',
    reference: '74LS02 Datasheet'
  },
  [GateType.AND]: {
    type: GateType.AND,
    typicalDelay: 15,
    minDelay: 10,
    maxDelay: 20,
    standard: '74LS TTL',
    reference: '74LS08 Datasheet'
  },
  [GateType.OR]: {
    type: GateType.OR,
    typicalDelay: 15,
    minDelay: 10,
    maxDelay: 20,
    standard: '74LS TTL',
    reference: '74LS32 Datasheet'
  },
  [GateType.XOR]: {
    type: GateType.XOR,
    typicalDelay: 22,
    minDelay: 15,
    maxDelay: 30,
    standard: '74LS TTL',
    reference: '74LS86 Datasheet'
  },
  [GateType.XNOR]: {
    type: GateType.XNOR,
    typicalDelay: 22,
    minDelay: 15,
    maxDelay: 30,
    standard: '74LS TTL',
    reference: 'Derived from XOR + NOT'
  }
};

/**
 * Calculate propagation delay in milliseconds for animation
 * 
 * Mathematical formulas:
 * - INSTANT mode: delay = 0 (no animation)
 * - SMOOTH mode: delay = smoothModeDelay × speed
 * - REALISTIC mode: delay = (gateDelay_ns × scaleFactor × speed) / 1,000,000
 * 
 * The realistic scale factor converts nanoseconds to visible milliseconds.
 * Default scale factor of 50,000,000 means:
 * - 10ns gate delay → 500ms visible delay at 1× speed
 * 
 * @param gateType Type of gate
 * @param mode Simulation mode
 * @param config Mode configuration
 * @returns Delay in milliseconds
 */
export function calculateDelay(
  gateType: GateType,
  mode: SimulationModeType,
  config: SimulationModeConfig
): number {
  switch (mode) {
    case SimulationModeType.INSTANT:
      return 0;
    
    case SimulationModeType.SMOOTH:
      return config.smoothModeDelay * config.speed;
    
    case SimulationModeType.REALISTIC: {
      const profile = GATE_PROPAGATION_DELAYS[gateType];
      if (!profile) return 0;
      
      // Convert nanoseconds to milliseconds: ns × scaleFactor / 1,000,000
      const delayMs = (profile.typicalDelay * config.realisticScaleFactor) / 1_000_000;
      return delayMs * config.speed;
    }
    
    default:
      return 0;
  }
}

/**
 * Get typical propagation delay for gate type (nanoseconds)
 * 
 * @param gateType Gate type
 * @returns Delay in nanoseconds
 */
export function getGateDelay(gateType: GateType): number {
  const profile = GATE_PROPAGATION_DELAYS[gateType];
  return profile ? profile.typicalDelay : 0;
}

/**
 * Validate simulation mode configuration
 * 
 * @param config Configuration to validate
 * @returns Validation result
 */
export function validateSimulationConfig(
  config: SimulationModeConfig
): { valid: boolean; error?: string } {
  if (config.speed < 0.1 || config.speed > 10.0) {
    return { valid: false, error: 'Speed must be between 0.1 and 10.0' };
  }
  
  if (config.stepMode && config.isPlaying) {
    return { valid: false, error: 'Cannot auto-play in step mode' };
  }
  
  if (config.smoothModeDelay <= 0) {
    return { valid: false, error: 'Smooth mode delay must be positive' };
  }
  
  if (config.realisticScaleFactor <= 0) {
    return { valid: false, error: 'Realistic scale factor must be positive' };
  }
  
  return { valid: true };
}

/**
 * Clamp speed to valid range
 * 
 * @param speed Requested speed
 * @returns Clamped speed between 0.1 and 10.0
 */
export function clampSpeed(speed: number): number {
  return Math.max(0.1, Math.min(10.0, speed));
}
