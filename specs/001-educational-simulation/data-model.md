# Data Model: Educational Simulation Features

**Feature**: 001-educational-simulation  
**Date**: 2026-02-07  
**Status**: Complete

## Overview

This document defines the core data structures and entities for truth table visualization and slow-motion simulation features. All models follow the constitutional principle of separating logical specifications from physical rendering.

---

## Core Entities

### 1. TruthTable

Represents the logical behavior of a gate as a table of input combinations and corresponding outputs.

**Type Definition**:
```typescript
/**
 * Represents a single row in a truth table
 */
interface TruthTableRow {
  /** Input pin values for this combination, keyed by pin name */
  inputs: Record<string, LogicLevel>;  // e.g., { A: HIGH, B: LOW, C: HIGH }
  
  /** Output value for this input combination */
  output: LogicLevel;
  
  /** Whether this row matches the current circuit state */
  isCurrent: boolean;
  
  /** Unique identifier for this row (for React keys) */
  id: string;  // e.g., "010" for binary combination
}

/**
 * Complete truth table data structure for a gate
 */
interface TruthTable {
  /** ID of the gate this truth table represents */
  gateId: string;
  
  /** Ordered list of input pin names */
  inputPins: string[];  // e.g., ['A', 'B', 'C']
  
  /** Output pin name */
  outputPin: string;    // e.g., 'Y'
  
  /** All possible input/output combinations (2^n rows) */
  rows: TruthTableRow[];
  
  /** Whether this truth table is currently visible in UI */
  isVisible: boolean;
  
  /** Timestamp of last generation (for cache invalidation) */
  generatedAt: number;
}
```

**Invariants**:
- `rows.length === Math.pow(2, inputPins.length)`
- Each row ID is unique within the table
- Row IDs match binary representation: n inputs → n-digit binary string
- Exactly one row has `isCurrent: true` at any time (when circuit is in stable state)
- Input combinations cover all possible permutations without duplicates

**Relationships**:
- One TruthTable per Gate (1:1)
- Generated from Gate's logic function
- Not stored persistently - computed on demand from gate configuration

**Edge Cases**:
- 0 inputs: Single row (constant output)
- 1 input: Two rows (buffer/inverter behavior)
- 6+ inputs: 64+ rows, requires virtual scrolling in UI
- Custom gates: Pin names from gate definition, not standard A/B/C

---

### 2. SimulationMode

Represents the current visualization and timing mode of the circuit simulation.

**Type Definition**:
```typescript
/**
 * Available simulation modes
 */
enum SimulationModeType {
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
interface SimulationModeConfig {
  /** Current active mode */
  type: SimulationModeType;
  
  /** Playback state */
  isPlaying: boolean;
  
  /** Speed multiplier (0.1 - 10.0) */
  speed: number;
  
  /** Whether to animate step-by-step (manual advancement) */
  stepMode: boolean;
  
  /** Base delay for smooth mode (milliseconds) */
  smoothModeDelay: number;  // default: 500ms
  
  /** Scale factor for realistic mode (nanoseconds → milliseconds) */
  realisticScaleFactor: number;  // default: 50_000_000 (50M)
}
```

**Invariants**:
- Only one mode can be active at a time
- `speed` must be in range [0.1, 10.0]
- `isPlaying` is false when `stepMode` is true
- `type === INSTANT` ignores speed and playback settings

**State Transitions**:
```
INSTANT → SMOOTH:   User enables smooth mode
INSTANT → REALISTIC: User enables realistic mode
SMOOTH → REALISTIC: User switches to realistic mode
REALISTIC → SMOOTH: User switches to smooth mode
ANY → INSTANT:      User disables slow-motion
```

**Edge Cases**:
- Switching modes mid-animation: Complete current animation, then switch
- Speed changes during playback: Apply immediately to remaining duration
- Step mode enabled during continuous play: Pause at current event

---

### 3. PropagationEvent

Represents a single signal change traveling through the circuit during slow-motion simulation.

**Type Definition**:
```typescript
/**
 * Represents a signal propagation event in the simulation queue
 */
interface PropagationEvent {
  /** Unique identifier for this event */
  id: string;
  
  /** Component receiving the signal change (wire or gate) */
  targetId: string;
  
  /** Type of target component */
  targetType: 'WIRE' | 'GATE';
  
  /** New logic level value */
  newLevel: LogicLevel;
  
  /** Previous logic level value */
  previousLevel: LogicLevel;
  
  /** Scheduled time for this event (milliseconds from simulation start) */
  scheduledTime: number;
  
  /** Duration of visual animation (milliseconds) */
  animationDuration: number;
  
  /** Source component that triggered this event */
  sourceId: string;
  
  /** Gate type (for realistic delay calculation) */
  gateType?: GateType;
  
  /** Whether this event has been processed */
  completed: boolean;
}

/**
 * Priority queue for managing propagation events
 */
interface PropagationQueue {
  /** Ordered list of pending events (sorted by scheduledTime) */
  events: PropagationEvent[];
  
  /** Current simulation time (milliseconds) */
  currentTime: number;
  
  /** Simulation start timestamp (for synchronization) */
  startTime: number;
  
  /** Events that have completed */
  history: PropagationEvent[];
}
```

**Invariants**:
- Events in queue are sorted by `scheduledTime` (ascending)
- `scheduledTime >= currentTime` for all pending events
- `newLevel !== previousLevel` (events only for actual state changes)
- `completed === false` for events in queue, `true` for events in history
- Each event ID is unique across queue and history

**Relationships**:
- Generated by SimulationEngine when circuit state changes
- Consumed by AnimationController for visual rendering
- One PropagationEvent per state change per component

**Mathematical Model**:
```
Smooth mode:
  scheduledTime = currentTime + smoothModeDelay * speed

Realistic mode:
  gateDelay = GATE_PROPAGATION_DELAYS[gateType] (nanoseconds)
  scheduledTime = currentTime + (gateDelay * realisticScaleFactor * speed)

Animation duration:
  animationDuration = (scheduledTime - currentTime) * 0.6  
  // 60% of delay for visual transition, 40% for settled state
```

**Edge Cases**:
- Simultaneous events (same scheduledTime): Process in insertion order
- Event cancellation: Remove from queue if input changes before scheduled time
- Loop/oscillator circuits: Events may schedule recursively infinitely

---

### 4. GateDelayProfile

Represents timing characteristics of a specific gate type for realistic simulation mode.

**Type Definition**:
```typescript
/**
 * Gate types supported by the simulator
 */
enum GateType {
  NOT = 'NOT',
  BUFFER = 'BUFFER',
  AND = 'AND',
  OR = 'OR',
  NAND = 'NAND',
  NOR = 'NOR',
  XOR = 'XOR',
  XNOR = 'XNOR'
}

/**
 * Propagation delay profile for a gate type
 */
interface GateDelayProfile {
  /** Gate type identifier */
  type: GateType;
  
  /** Typical propagation delay (nanoseconds) */
  typicalDelay: number;
  
  /** Minimum propagation delay (nanoseconds) */
  minDelay: number;
  
  /** Maximum propagation delay (nanoseconds) */
  maxDelay: number;
  
  /** Standard for these values (e.g., '74LS TTL') */
  standard: string;
  
  /** Reference source (datasheet, etc.) */
  reference: string;
}

/**
 * Configuration of all gate delay profiles
 */
type GateDelayConfiguration = Record<GateType, GateDelayProfile>;
```

**Default Values** (from research.md):
```typescript
const GATE_PROPAGATION_DELAYS: GateDelayConfiguration = {
  NOT: {
    type: GateType.NOT,
    typicalDelay: 5,
    minDelay: 3,
    maxDelay: 7,
    standard: '74LS TTL',
    reference: '74LS04 Datasheet'
  },
  BUFFER: {
    type: GateType.BUFFER,
    typicalDelay: 8,
    minDelay: 5,
    maxDelay: 11,
    standard: '74LS TTL',
    reference: '74LS125 Datasheet'
  },
  NAND: {
    type: GateType.NAND,
    typicalDelay: 10,
    minDelay: 7,
    maxDelay: 15,
    standard: '74LS TTL',
    reference: '74LS00 Datasheet'
  },
  NOR: {
    type: GateType.NOR,
    typicalDelay: 10,
    minDelay: 7,
    maxDelay: 15,
    standard: '74LS TTL',
    reference: '74LS02 Datasheet'
  },
  AND: {
    type: GateType.AND,
    typicalDelay: 15,
    minDelay: 10,
    maxDelay: 20,
    standard: '74LS TTL',
    reference: '74LS08 Datasheet'
  },
  OR: {
    type: GateType.OR,
    typicalDelay: 15,
    minDelay: 10,
    maxDelay: 20,
    standard: '74LS TTL',
    reference: '74LS32 Datasheet'
  },
  XOR: {
    type: GateType.XOR,
    typicalDelay: 22,
    minDelay: 15,
    maxDelay: 30,
    standard: '74LS TTL',
    reference: '74LS86 Datasheet'
  },
  XNOR: {
    type: GateType.XNOR,
    typicalDelay: 22,
    minDelay: 15,
    maxDelay: 30,
    standard: '74LS TTL',
    reference: 'Derived from XOR + NOT'
  }
};
```

**Invariants**:
- `minDelay < typicalDelay < maxDelay` for all profiles
- All delays in nanoseconds (consistent units)
- Delay hierarchy: NOT < NAND/NOR < AND/OR < XOR/XNOR

**Usage**:
- Realistic mode: Use `typicalDelay` for consistent educational experience
- Future enhancement: Could use `minDelay`/`maxDelay` for temperature variation simulation
- Configuration can be customized for different IC families (CMOS, ECL, etc.)

---

## Supporting Types

### AnimationState

Tracks the visual rendering state of a component during slow-motion animation.

```typescript
/**
 * Animation state for a wire or gate component
 */
interface AnimationState {
  /** Component being animated */
  componentId: string;
  
  /** Current animation progress [0.0, 1.0] */
  progress: number;
  
  /** Animation start time (milliseconds) */
  startTime: number;
  
  /** Animation end time (milliseconds) */
  endTime: number;
  
  /** Starting visual value (e.g., color, position) */
  fromValue: any;
  
  /** Ending visual value */
  toValue: any;
  
  /** Whether animation is complete */
  isComplete: boolean;
}
```

**Mathematical Model**:
```
progress = clamp((currentTime - startTime) / (endTime - startTime), 0, 1)
currentValue = interpolate(fromValue, toValue, progress)

Linear interpolation:
  interpolate(a, b, t) = a + (b - a) * t
  
For colors (RGB):
  interpolate({r: r1, g: g1, b: b1}, {r: r2, g: g2, b: b2}, t) = {
    r: r1 + (r2 - r1) * t,
    g: g1 + (g2 - g1) * t,
    b: b1 + (b2 - b1) * t
  }
```

---

### TruthTablePreferences

User preferences for truth table display.

```typescript
/**
 * User preferences for truth table display
 */
interface TruthTablePreferences {
  /** Show binary (0/1) vs symbolic (LOW/HIGH) values */
  displayFormat: 'BINARY' | 'SYMBOLIC';
  
  /** Automatically scroll to current row */
  autoScroll: boolean;
  
  /** Show row numbers */
  showRowNumbers: boolean;
  
  /** Highlight current row */
  highlightCurrentRow: boolean;
  
  /** Column width (pixels or 'auto') */
  columnWidth: number | 'auto';
}
```

---

## Data Validation Rules

### Truth Table Generation

**Input Validation**:
```typescript
function validateTruthTableInput(gate: Gate): ValidationResult {
  // Rule: Gate must have at least one input pin
  if (gate.inputPins.length === 0) {
    return { valid: false, error: 'Gate must have at least one input pin' };
  }
  
  // Rule: Maximum 10 inputs (1024 rows) - beyond this, truth table too large
  if (gate.inputPins.length > 10) {
    return { valid: false, error: 'Truth tables limited to 10 inputs maximum' };
  }
  
  // Rule: Gate must have exactly one output pin
  if (gate.outputPins.length !== 1) {
    return { valid: false, error: 'Gate must have exactly one output pin for truth table' };
  }
  
  // Rule: Gate must have a defined logic function
  if (!gate.evaluateOutput) {
    return { valid: false, error: 'Gate must have evaluateOutput function' };
  }
  
  return { valid: true };
}
```

**Row Generation Algorithm**:
```typescript
/**
 * Generate all possible input combinations for n inputs
 * Returns 2^n rows with unique binary combinations
 */
function generateInputCombinations(inputCount: number): boolean[][] {
  const rowCount = Math.pow(2, inputCount);
  const combinations: boolean[][] = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row: boolean[] = [];
    for (let bit = inputCount - 1; bit >= 0; bit--) {
      row.push(((i >> bit) & 1) === 1);
    }
    combinations.push(row);
  }
  
  return combinations;
}

// Example for 3 inputs:
// 0: [false, false, false] → "000"
// 1: [false, false, true]  → "001"
// 2: [false, true, false]  → "010"
// ...
// 7: [true, true, true]    → "111"
```

### Simulation Mode Validation

```typescript
function validateSimulationMode(config: SimulationModeConfig): ValidationResult {
  // Rule: Speed must be in valid range
  if (config.speed < 0.1 || config.speed > 10.0) {
    return { valid: false, error: 'Speed must be between 0.1 and 10.0' };
  }
  
  // Rule: Cannot be playing in step mode
  if (config.stepMode && config.isPlaying) {
    return { valid: false, error: 'Cannot auto-play in step mode' };
  }
  
  // Rule: Delays must be positive
  if (config.smoothModeDelay <= 0) {
    return { valid: false, error: 'Smooth mode delay must be positive' };
  }
  
  if (config.realisticScaleFactor <= 0) {
    return { valid: false, error: 'Realistic scale factor must be positive' };
  }
  
  return { valid: true };
}
```

### Propagation Event Validation

```typescript
function validatePropagationEvent(event: PropagationEvent, queue: PropagationQueue): ValidationResult {
  // Rule: Scheduled time must be in the future
  if (event.scheduledTime < queue.currentTime) {
    return { valid: false, error: 'Cannot schedule event in the past' };
  }
  
  // Rule: Must represent an actual state change
  if (event.newLevel === event.previousLevel) {
    return { valid: false, error: 'Event must change logic level' };
  }
  
  // Rule: Animation duration must be positive
  if (event.animationDuration <= 0) {
    return { valid: false, error: 'Animation duration must be positive' };
  }
  
  // Rule: Event ID must be unique
  const existingIds = new Set([
    ...queue.events.map(e => e.id),
    ...queue.history.map(e => e.id)
  ]);
  if (existingIds.has(event.id)) {
    return { valid: false, error: 'Event ID must be unique' };
  }
  
  return { valid: true };
}
```

---

## Persistence Strategy

**None Required** - All data structures are computed or ephemeral:

- **TruthTable**: Generated on-demand from gate logic, not stored
- **SimulationMode**: User preference, stored in React state/context (session-only)
- **PropagationEvent**: Runtime-only, cleared when simulation stops
- **GateDelayProfile**: Static configuration, no persistence needed
- **AnimationState**: Transient rendering state, discarded between frames

**Future Considerations** (if persistence added):
- Save simulation mode preferences to localStorage
- Export/import custom gate delay profiles
- Record and replay simulation history (educational review feature)

---

## Summary

All entities follow constitutional principles:

✅ **Mathematical Foundation**: Truth table (2^n), delay calculations, interpolation clearly defined  
✅ **Separation of Concerns**: Logical models (TruthTable, PropagationEvent) separate from rendering (AnimationState)  
✅ **Single Source of Truth**: GATE_PROPAGATION_DELAYS is authoritative configuration  
✅ **Type Safety**: All entities have explicit TypeScript interfaces with invariants documented  
✅ **Testability**: Pure data structures with validation functions easily unit tested

**Next**: Generate API contracts and quickstart guide.
