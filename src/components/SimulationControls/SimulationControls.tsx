import React from 'react';
import { SimulationModeType, SimulationModeConfig } from '../../models/SimulationMode';
import './SimulationControls.css';

export interface SimulationControlsProps {
  /** Current simulation mode config */
  config: SimulationModeConfig;
  
  /** Callback when mode changes */
  onModeChange: (mode: SimulationModeType) => void;
  
  /** Callback when play/pause toggled */
  onPlaybackToggle: () => void;
  
  /** Callback when speed changes */
  onSpeedChange: (speed: number) => void;
  
  /** Callback for step forward */
  onStepForward: () => void;
  
  /** Callback for step backward */
  onStepBackward: () => void;
  
  /** Whether circuit has pending events (enables step forward) */
  hasPendingEvents: boolean;
  
  /** Whether circuit has history (enables step backward) */
  hasHistory: boolean;
}

/**
 * Controls for simulation playback and speed
 */
export const SimulationControls: React.FC<SimulationControlsProps> = ({
  config,
  onModeChange,
  onPlaybackToggle,
  onSpeedChange,
  onStepForward,
  onStepBackward,
  hasPendingEvents,
  hasHistory
}) => {
  const isSlowMotion = config.type !== SimulationModeType.INSTANT;
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSpeedChange(parseFloat(e.target.value));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (isSlowMotion) onPlaybackToggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        onStepForward();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        onStepBackward();
        break;
      case '+':
      case '=':
        e.preventDefault();
        onSpeedChange(Math.min(10.0, config.speed * 1.5));
        break;
      case '-':
      case '_':
        e.preventDefault();
        onSpeedChange(Math.max(0.1, config.speed / 1.5));
        break;
    }
  };
  
  return (
    <div
      className="simulation-controls"
      role="group"
      aria-label="Simulation controls"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Mode Selection */}
      <div className="control-section">
        <label htmlFor="sim-mode">Mode:</label>
        <select
          id="sim-mode"
          value={config.type}
          onChange={e => onModeChange(e.target.value as SimulationModeType)}
          className="mode-select"
        >
          <option value={SimulationModeType.INSTANT}>Instant</option>
          <option value={SimulationModeType.SMOOTH}>Smooth Slow-Motion</option>
          <option value={SimulationModeType.REALISTIC}>Realistic Delays</option>
        </select>
      </div>
      
      {/* Playback Controls (only in slow-motion modes) */}
      {isSlowMotion && (
        <>
          <div className="control-section playback-controls">
            <button
              onClick={onStepBackward}
              disabled={!hasHistory}
              className="control-button"
              aria-label="Step backward"
              title="Step backward (←)"
            >
              ◀
            </button>
            
            <button
              onClick={onPlaybackToggle}
              className="control-button play-pause-button"
              aria-label={config.isPlaying ? 'Pause' : 'Play'}
              title={config.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {config.isPlaying ? '⏸' : '▶'}
            </button>
            
            <button
              onClick={onStepForward}
              disabled={!hasPendingEvents}
              className="control-button"
              aria-label="Step forward"
              title="Step forward (→)"
            >
              ▶
            </button>
          </div>
          
          {/* Speed Control */}
          <div className="control-section speed-control">
            <label htmlFor="sim-speed">
              Speed: {config.speed.toFixed(1)}×
            </label>
            <input
              id="sim-speed"
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={config.speed}
              onChange={handleSpeedChange}
              className="speed-slider"
              aria-label="Playback speed"
            />
            <div className="speed-markers">
              <span>0.1×</span>
              <span>1×</span>
              <span>10×</span>
            </div>
          </div>
        </>
      )}
      
      {/* Keyboard shortcuts hint */}
      {isSlowMotion && (
        <div className="keyboard-hints">
          <small>
            Space: Play/Pause | ←→: Step | +−: Speed
          </small>
        </div>
      )}
    </div>
  );
};
