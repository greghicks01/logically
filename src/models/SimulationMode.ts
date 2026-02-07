/**
 * Available simulation modes
 */
export enum SimulationModeType {
  /** Standard instant evaluation */
  INSTANT = 'INSTANT',
  
  /** Slow-motion with uniform timing (educational) */
  SMOOTH = 'SMOOTH',
  
  /** Slow-motion with realistic gate delays */
  REALISTIC = 'REALISTIC'
}

/**
 * Configuration for slow-motion simulation modes
 */
export interface SimulationModeConfig {
  /** Current active mode */
  type: SimulationModeType;
  
  /** Playback state */
  isPlaying: boolean;
  
  /** Speed multiplier (0.1 - 10.0) */
  speed: number;
  
  /** Whether to animate step-by-step (manual advancement) */
  stepMode: boolean;
  
  /** Base delay for smooth mode (milliseconds) */
  smoothModeDelay: number;
  
  /** Scale factor for realistic mode (nanoseconds → milliseconds) */
  realisticScaleFactor: number;
}

export const DEFAULT_SIMULATION_CONFIG: SimulationModeConfig = {
  type: SimulationModeType.INSTANT,
  isPlaying: false,
  speed: 1.0,
  stepMode: false,
  smoothModeDelay: 500,
  realisticScaleFactor: 50_000_000 // 50M: converts ns to visible ms
};
