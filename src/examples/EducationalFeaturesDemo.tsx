/**
 * Example: How to use the educational simulation features
 * 
 * This file demonstrates how to integrate truth tables and slow-motion simulation
 * into your circuit simulator components.
 */

import React, { useState, useEffect } from 'react';
import { LogicLevel } from '../models/LogicLevel';
import { SimulationModeType, DEFAULT_SIMULATION_CONFIG } from '../models/SimulationMode';
import { TruthTablePanel } from '../components/TruthTablePanel';
import { SimulationControls } from '../components/SimulationControls';
import { generateTruthTable, Gate } from '../services/TruthTableGenerator';
import { AnimationController } from '../services/AnimationController';
import { PropagationScheduler } from '../services/PropagationScheduler';
import { GateType } from '../models/PropagationEvent';
import { calculateDelay } from '../lib/timingUtils';

/**
 * Example 1: Simple Truth Table Display
 */
export function TruthTableExample() {
  // Create a sample AND gate
  const andGate: Gate = {
    id: 'gate-1',
    type: 'AND',
    inputPins: [
      { id: 'pin-1', name: 'A', type: 'INPUT' },
      { id: 'pin-2', name: 'B', type: 'INPUT' }
    ],
    outputPins: [
      { id: 'pin-3', name: 'Y', type: 'OUTPUT' }
    ],
    evaluateOutput: (inputs) => {
      return inputs.A === LogicLevel.HIGH && inputs.B === LogicLevel.HIGH
        ? LogicLevel.HIGH
        : LogicLevel.LOW;
    }
  };
  
  // Generate truth table
  const truthTable = generateTruthTable(andGate);
  const [visibleTable, setVisibleTable] = useState({ ...truthTable, isVisible: true });
  
  // Current circuit state
  const [currentInputs, setCurrentInputs] = useState({
    A: LogicLevel.LOW,
    B: LogicLevel.LOW
  });
  
  // Handle row click to set inputs
  const handleRowClick = (inputs: Record<string, LogicLevel>) => {
    setCurrentInputs(inputs);
  };
  
  return (
    <div>
      <h2>Truth Table Example</h2>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Input controls */}
        <div>
          <h3>Inputs</h3>
          <label>
            <input
              type="checkbox"
              checked={currentInputs.A === LogicLevel.HIGH}
              onChange={e => setCurrentInputs(prev => ({
                ...prev,
                A: e.target.checked ? LogicLevel.HIGH : LogicLevel.LOW
              }))}
            />
            Input A
          </label>
          <br />
          <label>
            <input
              type="checkbox"
              checked={currentInputs.B === LogicLevel.HIGH}
              onChange={e => setCurrentInputs(prev => ({
                ...prev,
                B: e.target.checked ? LogicLevel.HIGH : LogicLevel.LOW
              }))}
            />
            Input B
          </label>
        </div>
        
        {/* Truth table display */}
        <TruthTablePanel
          truthTable={visibleTable}
          currentInputs={currentInputs}
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
}

/**
 * Example 2: Simulation Controls with Animation
 */
export function SimulationControlsExample() {
  const [config, setConfig] = useState(DEFAULT_SIMULATION_CONFIG);
  const [hasPending, setHasPending] = useState(true);
  const [hasHistory, setHasHistory] = useState(false);
  
  const handleModeChange = (mode: SimulationModeType) => {
    setConfig(prev => ({ ...prev, type: mode }));
  };
  
  const handlePlaybackToggle = () => {
    setConfig(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };
  
  const handleSpeedChange = (speed: number) => {
    setConfig(prev => ({ ...prev, speed }));
  };
  
  const handleStepForward = () => {
    console.log('Step forward');
    setHasHistory(true);
  };
  
  const handleStepBackward = () => {
    console.log('Step backward');
  };
  
  return (
    <div>
      <h2>Simulation Controls Example</h2>
      <SimulationControls
        config={config}
        onModeChange={handleModeChange}
        onPlaybackToggle={handlePlaybackToggle}
        onSpeedChange={handleSpeedChange}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        hasPendingEvents={hasPending}
        hasHistory={hasHistory}
      />
      
      <div style={{ marginTop: '20px' }}>
        <h3>Current State</h3>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </div>
    </div>
  );
}

/**
 * Example 3: Full Integration - Animation Controller + Scheduler
 */
export function FullAnimationExample() {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const animationController = new AnimationController();
  const scheduler = new PropagationScheduler();
  
  const startAnimation = () => {
    // Schedule some example events
    scheduler.scheduleEvent({
      id: 'event-1',
      targetId: 'wire-1',
      targetType: 'WIRE',
      newLevel: LogicLevel.HIGH,
      previousLevel: LogicLevel.LOW,
      scheduledTime: 500,
      animationDuration: 300,
      sourceId: 'gate-1',
      gateType: GateType.AND,
      completed: false
    });
    
    scheduler.scheduleEvent({
      id: 'event-2',
      targetId: 'wire-2',
      targetType: 'WIRE',
      newLevel: LogicLevel.HIGH,
      previousLevel: LogicLevel.LOW,
      scheduledTime: 1000,
      animationDuration: 300,
      sourceId: 'gate-2',
      gateType: GateType.XOR,
      completed: false
    });
    
    // Start animation
    animationController.start((elapsedTime) => {
      setElapsed(elapsedTime);
      
      // Process events
      const events = scheduler.processEvents(elapsedTime);
      events.forEach(event => {
        console.log(`Processed event: ${event.id} at ${elapsedTime}ms`);
      });
    });
    
    setIsRunning(true);
  };
  
  const stopAnimation = () => {
    animationController.stop();
    scheduler.reset();
    setIsRunning(false);
    setElapsed(0);
  };
  
  return (
    <div>
      <h2>Full Animation Example</h2>
      <p>Elapsed time: {elapsed.toFixed(0)}ms</p>
      <p>Pending events: {scheduler.hasPendingEvents() ? 'Yes' : 'No'}</p>
      <p>Queue snapshot: {JSON.stringify(scheduler.getQueueSnapshot())}</p>
      
      <button onClick={startAnimation} disabled={isRunning}>
        Start Animation
      </button>
      <button onClick={stopAnimation} disabled={!isRunning}>
        Stop Animation
      </button>
    </div>
  );
}

/**
 * Example 4: Calculating Delays
 */
export function DelayCalculationExample() {
  const config = {
    ...DEFAULT_SIMULATION_CONFIG,
    type: SimulationModeType.REALISTIC,
    speed: 1.0
  };
  
  const delays = {
    NOT: calculateDelay(GateType.NOT, SimulationModeType.REALISTIC, config),
    NAND: calculateDelay(GateType.NAND, SimulationModeType.REALISTIC, config),
    AND: calculateDelay(GateType.AND, SimulationModeType.REALISTIC, config),
    XOR: calculateDelay(GateType.XOR, SimulationModeType.REALISTIC, config)
  };
  
  return (
    <div>
      <h2>Gate Delay Calculation Example</h2>
      <p>Mode: Realistic (1× speed)</p>
      <table border={1} style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Gate Type</th>
            <th>Delay (ms)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(delays).map(([gate, delay]) => (
            <tr key={gate}>
              <td>{gate}</td>
              <td>{delay.toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        <small>
          Note: XOR has longest delay (1100ms) because it's the most complex gate
        </small>
      </p>
    </div>
  );
}

/**
 * Combined demo page showing all examples
 */
export function EducationalFeaturesDemo() {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Educational Simulation Features - Demo</h1>
      <p>
        This page demonstrates the new truth table and slow-motion simulation features.
      </p>
      
      <hr />
      <TruthTableExample />
      
      <hr />
      <SimulationControlsExample />
      
      <hr />
      <DelayCalculationExample />
      
      <hr />
      <div>
        <h2>Integration Guide</h2>
        <ol>
          <li>
            <strong>Truth Tables:</strong> Use <code>generateTruthTable()</code> to create
            truth tables, then display with <code>&lt;TruthTablePanel /&gt;</code>
          </li>
          <li>
            <strong>Simulation Controls:</strong> Add <code>&lt;SimulationControls /&gt;</code>
            to your UI for playback control
          </li>
          <li>
            <strong>Animation:</strong> Use <code>AnimationController</code> for timing and
            <code>PropagationScheduler</code> for event management
          </li>
          <li>
            <strong>Delays:</strong> Call <code>calculateDelay()</code> to get gate-specific
            delays in realistic mode
          </li>
        </ol>
      </div>
    </div>
  );
}
