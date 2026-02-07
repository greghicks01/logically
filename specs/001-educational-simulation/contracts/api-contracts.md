# API Contracts: Educational Simulation Features

**Feature**: 001-educational-simulation  
**Date**: 2026-02-07  
**Type**: Internal TypeScript API (not REST/GraphQL)

## Overview

This feature implements internal TypeScript APIs for truth table generation, simulation mode management, and animation control. These are in-memory APIs consumed by React components, not external HTTP endpoints.

All contracts follow functional programming principles with pure functions and immutable data structures where possible.

---

## 1. Truth Table Service API

### `TruthTableGenerator`

Generates truth tables from gate logic functions.

#### `generateTruthTable(gate: Gate): TruthTable`

**Purpose**: Generate a complete truth table for a gate

**Input**:
```typescript
interface Gate {
  id: string;
  type: string;
  inputPins: Pin[];
  outputPins: Pin[];
  evaluateOutput: (inputs: Record<string, LogicLevel>) => LogicLevel;
}

interface Pin {
  id: string;
  name: string;  // 'A', 'B', 'C' or custom names
  type: 'INPUT' | 'OUTPUT';
}
```

**Output**:
```typescript
interface TruthTable {
  gateId: string;
  inputPins: string[];
  outputPin: string;
  rows: TruthTableRow[];
  isVisible: boolean;
  generatedAt: number;
}
```

**Contract**:
- **Preconditions**:
  - `gate.inputPins.length > 0` (at least one input)
  - `gate.inputPins.length <= 10` (maximum 10 inputs)
  - `gate.outputPins.length === 1` (exactly one output)
  - `gate.evaluateOutput` is defined
- **Postconditions**:
  - Returns TruthTable with `rows.length === 2^inputPins.length`
  - All input combinations covered without duplicates
  - Each row has unique ID matching binary combination
  - `isVisible` defaults to false
  - `generatedAt` is current timestamp
- **Side Effects**: None (pure function)
- **Errors**: Throws `ValidationError` if preconditions not met

**Example Usage**:
```typescript
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
  evaluateOutput: (inputs) => inputs.A && inputs.B ? LogicLevel.HIGH : LogicLevel.LOW
};

const truthTable = generateTruthTable(andGate);

// Result:
// {
//   gateId: 'gate-1',
//   inputPins: ['A', 'B'],
//   outputPin: 'Y',
//   rows: [
//     { id: '00', inputs: { A: LOW, B: LOW }, output: LOW, isCurrent: false },
//     { id: '01', inputs: { A: LOW, B: HIGH }, output: LOW, isCurrent: false },
//     { id: '10', inputs: { A: HIGH, B: LOW }, output: LOW, isCurrent: false },
//     { id: '11', inputs: { A: HIGH, B: HIGH }, output: HIGH, isCurrent: false }
//   ],
//   isVisible: false,
//   generatedAt: 1707321600000
// }
```

---

#### `updateCurrentState(table: TruthTable, currentInputs: Record<string, LogicLevel>): TruthTable`

**Purpose**: Update which row is marked as current based on circuit state

**Input**:
- `table`: Existing truth table
- `currentInputs`: Current logic levels of gate inputs

**Output**: New TruthTable with updated `isCurrent` flags

**Contract**:
- **Preconditions**:
  - `table` is valid TruthTable
  - `currentInputs` contains all pins from `table.inputPins`
- **Postconditions**:
  - Exactly one row has `isCurrent: true` (or zero if circuit unstable)
  - All other rows have `isCurrent: false`
  - Other fields unchanged (immutable update)
- **Side Effects**: None (returns new object)
- **Errors**: None (gracefully handles invalid input with no current row)

**Example Usage**:
```typescript
const currentInputs = { A: LogicLevel.HIGH, B: LogicLevel.HIGH };
const updatedTable = updateCurrentState(truthTable, currentInputs);

// updatedTable.rows[3].isCurrent === true (row '11')
```

---

## 2. Simulation Mode Service API

### `SimulationModeController`

Manages simulation mode state and transitions.

#### `setSimulationMode(mode: SimulationModeType, config?: Partial<SimulationModeConfig>): SimulationModeConfig`

**Purpose**: Switch to a new simulation mode

**Input**:
```typescript
enum SimulationModeType {
  INSTANT = 'INSTANT',
  SMOOTH = 'SMOOTH',
  REALISTIC = 'REALISTIC'
}

interface SimulationModeConfig {
  type: SimulationModeType;
  isPlaying: boolean;
  speed: number;
  stepMode: boolean;
  smoothModeDelay: number;
  realisticScaleFactor: number;
}
```

**Output**: Complete SimulationModeConfig with merged settings

**Contract**:
- **Preconditions**:
  - `mode` is valid SimulationModeType
  - `config.speed` (if provided) in range [0.1, 10.0]
  - Cannot have `isPlaying: true` and `stepMode: true` simultaneously
- **Postconditions**:
  - Returns complete config with defaults applied
  - `type` matches requested mode
  - Invalid config values clamped to valid ranges
- **Side Effects**: Updates internal mode state, emits mode change event
- **Errors**: Throws `ValidationError` if mode invalid

**Example Usage**:
```typescript
const config = setSimulationMode(SimulationModeType.SMOOTH, {
  speed: 2.0,
  isPlaying: true
});

// Result:
// {
//   type: 'SMOOTH',
//   isPlaying: true,
//   speed: 2.0,
//   stepMode: false,
//   smoothModeDelay: 500,  // default
//   realisticScaleFactor: 50_000_000  // default
// }
```

---

#### `setPlaybackSpeed(speed: number): void`

**Purpose**: Update playback speed without changing mode

**Input**: Speed multiplier (0.1 - 10.0)

**Output**: void

**Contract**:
- **Preconditions**: `speed` in range [0.1, 10.0]
- **Postconditions**: Speed updated, affects future animations only
- **Side Effects**: Updates speed in current config, emits speed change event
- **Errors**: Clamps to valid range if out of bounds (no error thrown)

---

#### `togglePlayback(): void`

**Purpose**: Toggle between playing and paused states

**Output**: void

**Contract**:
- **Preconditions**: Current mode is SMOOTH or REALISTIC (no-op in INSTANT)
- **Postconditions**: `isPlaying` flipped unless in step mode
- **Side Effects**: Starts/stops animation loop
- **Errors**: None

---

#### `stepForward(): void`

**Purpose**: Advance simulation by one propagation event

**Output**: void

**Contract**:
- **Preconditions**: Pending events exist in queue
- **Postconditions**: Next event processed, animation shown
- **Side Effects**: Updates circuit state, dequeues one event
- **Errors**: None (no-op if queue empty)

---

#### `stepBackward(): void`

**Purpose**: Rewind simulation by one propagation event

**Output**: void

**Contract**:
- **Preconditions**: History contains at least one event
- **Postconditions**: Last event reversed, circuit state restored
- **Side Effects**: Updates circuit state, moves event from history to queue
- **Errors**: None (no-op if history empty)

---

## 3. Propagation Scheduler API

### `PropagationScheduler`

Manages the queue of propagation events during slow-motion simulation.

#### `scheduleEvent(event: PropagationEvent): void`

**Purpose**: Add a new propagation event to the queue

**Input**:
```typescript
interface PropagationEvent {
  id: string;
  targetId: string;
  targetType: 'WIRE' | 'GATE';
  newLevel: LogicLevel;
  previousLevel: LogicLevel;
  scheduledTime: number;
  animationDuration: number;
  sourceId: string;
  gateType?: GateType;
  completed: boolean;
}
```

**Output**: void

**Contract**:
- **Preconditions**:
  - `event.id` is unique
  - `event.scheduledTime >= currentTime`
  - `event.newLevel !== event.previousLevel`
  - `event.animationDuration > 0`
- **Postconditions**:
  - Event inserted in queue sorted by scheduledTime
  - Queue invariant maintained (ascending order)
- **Side Effects**: Modifies internal queue
- **Errors**: Throws `DuplicateEventError` if ID exists

---

#### `processEvents(currentTime: number): PropagationEvent[]`

**Purpose**: Process all events scheduled up to current time

**Input**: Current simulation time (milliseconds)

**Output**: Array of processed events (for animation/state update)

**Contract**:
- **Preconditions**: `currentTime >= lastProcessedTime`
- **Postconditions**:
  - All events with `scheduledTime <= currentTime` processed
  - Processed events moved to history
  - Queue still sorted by time
- **Side Effects**: Updates circuit state, modifies queue and history
- **Errors**: None

**Example Usage**:
```typescript
const currentTime = performance.now() - simulationStartTime;
const events = processEvents(currentTime);

events.forEach(event => {
  // Update component state
  updateComponentState(event.targetId, event.newLevel);
  // Trigger animation
  animateTransition(event.targetId, event.animationDuration);
});
```

---

#### `clearQueue(): void`

**Purpose**: Remove all pending events (reset simulation)

**Output**: void

**Contract**:
- **Preconditions**: None
- **Postconditions**: Queue is empty, history cleared
- **Side Effects**: Resets internal state
- **Errors**: None

---

#### `getUpcomingEvents(count: number): PropagationEvent[]`

**Purpose**: Peek at next N events without processing

**Input**: Number of events to retrieve

**Output**: Array of upcoming events (not removed from queue)

**Contract**:
- **Preconditions**: `count > 0`
- **Postconditions**: Returns up to `count` events, queue unchanged
- **Side Effects**: None (read-only)
- **Errors**: None

---

## 4. Animation Controller API

### `AnimationController`

Controls visual animation timing using requestAnimationFrame.

#### `start(onFrame: (elapsed: number) => void): void`

**Purpose**: Begin animation loop

**Input**: Callback function receiving elapsed time in milliseconds

**Output**: void

**Contract**:
- **Preconditions**: Not already running
- **Postconditions**: Animation loop active, callback invoked every frame (~16ms)
- **Side Effects**: Schedules requestAnimationFrame calls
- **Errors**: Throws if already running

**Example Usage**:
```typescript
const controller = new AnimationController();

controller.start((elapsed) => {
  // Process propagation events up to elapsed time
  const events = scheduler.processEvents(elapsed);
  
  // Update animation states
  events.forEach(event => {
    animateComponent(event.targetId, event);
  });
  
  // Re-render canvas
  renderCircuit();
});
```

---

#### `stop(): void`

**Purpose**: Halt animation loop

**Output**: void

**Contract**:
- **Preconditions**: None
- **Postconditions**: Animation loop stopped, no more callbacks
- **Side Effects**: Cancels pending requestAnimationFrame
- **Errors**: None

---

#### `setSpeed(multiplier: number): void`

**Purpose**: Adjust animation speed multiplier

**Input**: Speed multiplier (0.1 - 10.0)

**Output**: void

**Contract**:
- **Preconditions**: `multiplier` in range [0.1, 10.0]
- **Postconditions**: Future frames use new speed for elapsed calculation
- **Side Effects**: Updates internal speed state
- **Errors**: Clamps to valid range

**Implementation Detail**:
```typescript
// Elapsed time calculation with speed:
const elapsed = (timestamp - startTime) * speedMultiplier;
```

---

#### `pause(): void`

**Purpose**: Temporarily pause animation without stopping

**Output**: void

**Contract**:
- **Preconditions**: Animation is running
- **Postconditions**: Animation paused, elapsed time frozen
- **Side Effects**: Cancels rAF, preserves current state
- **Errors**: None

---

#### `resume(): void`

**Purpose**: Continue paused animation

**Output**: void

**Contract**:
- **Preconditions**: Animation is paused
- **Postconditions**: Animation resumed from paused time
- **Side Effects**: Resumes rAF loop
- **Errors**: None

---

## 5. Delay Calculation API

### `DelayCalculator`

Pure utility functions for computing propagation delays.

#### `calculateDelay(gateType: GateType, mode: SimulationModeType, config: SimulationModeConfig): number`

**Purpose**: Calculate propagation delay in milliseconds for animation

**Input**:
- Gate type (NOT, AND, OR, etc.)
- Simulation mode (INSTANT, SMOOTH, REALISTIC)
- Mode configuration

**Output**: Delay in milliseconds

**Contract**:
- **Preconditions**: Valid gate type and mode
- **Postconditions**:
  - INSTANT mode: returns 0
  - SMOOTH mode: returns `config.smoothModeDelay * config.speed`
  - REALISTIC mode: returns `GATE_PROPAGATION_DELAYS[gateType] * config.realisticScaleFactor * config.speed`
- **Side Effects**: None (pure function)
- **Errors**: Returns 0 for unknown gate types

**Example Usage**:
```typescript
const config = {
  type: SimulationModeType.REALISTIC,
  speed: 1.0,
  realisticScaleFactor: 50_000_000,
  // ... other fields
};

const delay = calculateDelay(GateType.XOR, config.type, config);
// Result: 22ns * 50_000_000 * 1.0 = 1,100,000,000ns = 1100ms = 1.1 seconds
```

---

#### `getGateDelay(gateType: GateType): number`

**Purpose**: Get typical propagation delay for gate type (nanoseconds)

**Input**: Gate type

**Output**: Delay in nanoseconds

**Contract**:
- **Preconditions**: Valid gate type
- **Postconditions**: Returns typical delay from GATE_PROPAGATION_DELAYS
- **Side Effects**: None (pure function)
- **Errors**: Returns 0 for unknown types

---

## 6. React Component Props Contracts

### `TruthTablePanel` Props

```typescript
interface TruthTablePanelProps {
  /** Gate to display truth table for */
  gate: Gate;
  
  /** Current input values from circuit */
  currentInputs: Record<string, LogicLevel>;
  
  /** Whether panel is visible */
  isVisible: boolean;
  
  /** Callback when visibility changes */
  onVisibilityChange: (visible: boolean) => void;
  
  /** Display preferences */
  preferences?: TruthTablePreferences;
  
  /** Callback when user clicks a row to set circuit state */
  onRowClick?: (inputs: Record<string, LogicLevel>) => void;
}
```

**Contract**:
- Component generates truth table from `gate`
- Highlights row matching `currentInputs`
- Calls `onVisibilityChange` when user toggles visibility
- Calls `onRowClick` when user clicks a row (optional feature)

---

### `SimulationControls` Props

```typescript
interface SimulationControlsProps {
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
```

**Contract**:
- Displays current mode and playback state
- Calls appropriate callbacks on user interaction
- Disables step buttons when no events/history
- Shows speed slider only in SMOOTH/REALISTIC modes

---

## Error Handling

### Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class DuplicateEventError extends Error {
  constructor(eventId: string) {
    super(`Event with ID ${eventId} already exists`);
    this.name = 'DuplicateEventError';
  }
}

class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}
```

### Error Handling Strategy

- **Validation errors**: Throw early with descriptive messages
- **User input errors**: Clamp to valid ranges, don't throw
- **State errors**: Log warning, gracefully degrade (e.g., skip invalid event)
- **Async errors**: Catch in animation loop, stop loop, notify user

---

## Testing Contracts

All public APIs must have:

1. **Unit tests**: Test pure functions in isolation with various inputs
2. **Contract tests**: Verify pre/postconditions hold
3. **Edge case tests**: Zero, one, max, negative values
4. **Error tests**: Invalid inputs throw expected errors
5. **Integration tests**: APIs work together correctly

**Example Test Structure**:

```typescript
describe('TruthTableGenerator', () => {
  describe('generateTruthTable', () => {
    it('generates 2^n rows for n inputs', () => {
      const gate = createGate(3); // 3 inputs
      const table = generateTruthTable(gate);
      expect(table.rows).toHaveLength(8); // 2^3 = 8
    });
    
    it('throws ValidationError for gate with no inputs', () => {
      const gate = createGate(0);
      expect(() => generateTruthTable(gate)).toThrow(ValidationError);
    });
    
    it('covers all input combinations without duplicates', () => {
      const gate = createGate(2);
      const table = generateTruthTable(gate);
      const rowIds = table.rows.map(r => r.id);
      expect(new Set(rowIds).size).toBe(4); // All unique
      expect(rowIds.sort()).toEqual(['00', '01', '10', '11']);
    });
  });
});
```

---

## Summary

All API contracts follow constitutional principles:

✅ **Mathematical Foundation**: Delays calculated from formulas, truth tables from 2^n combinations  
✅ **Separation of Concerns**: Services handle logic, components handle UI, no mixing  
✅ **Pure Functions**: Generators and calculators are side-effect free  
✅ **Type Safety**: All APIs fully typed with TypeScript interfaces  
✅ **Testability**: Contracts specify pre/postconditions for testing

**Next**: Generate quickstart guide for developers.
