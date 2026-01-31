# Data Model: Wire Logic Level Visualization and Composite ICs

**Feature**: 002-wire-logic-display  
**Date**: 2026-01-31  
**Tech Stack**: TypeScript 5.0+, React 18+

## Overview

This document defines the core entities and their relationships for wire visualization and composite IC functionality. All entities are implemented as TypeScript classes/interfaces with strong typing.

---

## Core Entities

### 1. LogicLevel (Enum)

Represents the three possible states of a digital signal, plus conflict state.

```typescript
enum LogicLevel {
  LOW = 0,      // Logic 0 (false/ground)
  HIGH = 1,     // Logic 1 (true/power)
  HI_Z = 2,     // High impedance (floating/undriven)
  CONFLICT = 3  // Multiple conflicting drivers
}
```

**Purpose**: Type-safe representation of signal states throughout the system

**Validation Rules**:
- Cannot be undefined or null
- Must be one of the four enum values
- HI_Z used for unconnected pins and tri-state outputs
- CONFLICT automatically detected when multiple drivers disagree

---

### 2. Wire

Represents a connection between components that carries a logic signal and displays its state visually.

```typescript
interface Wire {
  id: string;                    // Unique identifier
  source: PinConnection | null;  // Output pin driving this wire
  destinations: PinConnection[]; // Input pins receiving signal
  logicLevel: LogicLevel;        // Current state (0, 1, Hi-Z, Conflict)
  path: Point[];                 // Visual routing points [(x,y), ...]
  color: string;                 // Computed from logicLevel
  drivers: OutputPin[];          // All sources attempting to drive this wire
}

interface PinConnection {
  componentId: string;
  pinId: string;
  pinType: 'input' | 'output';
}

interface Point {
  x: number;
  y: number;
}
```

**Relationships**:
- Connected to 1+ components via source/destinations
- Driven by 0+ output pins (drivers array)
- Referenced by CompositeIC internal circuit

**Business Rules**:
- `logicLevel` = HI_Z if drivers.length === 0
- `logicLevel` = CONFLICT if drivers have different non-HiZ states
- `color` computed from logicLevel (blue/red/grey/orange)
- `path` must have at least 2 points (start and end)

**State Transitions**:
```
HI_Z → LOW/HIGH (when driver connected)
LOW/HIGH → HI_Z (when all drivers disconnected)
LOW/HIGH → CONFLICT (when contradictory drivers added)
CONFLICT → LOW/HIGH (when conflict resolved)
```

---

### 3. CompositeIC

A user-created component composed of other components (basic gates or other composite ICs).

```typescript
interface CompositeIC {
  id: string;
  name: string;
  description?: string;
  
  // Pin definitions (external interface)
  inputPins: ICPin[];
  outputPins: ICPin[];
  
  // Internal circuit encapsulation
  internalCircuit: Circuit;
  
  // Metadata
  nestingLevel: number;          // Depth in hierarchy (1 = no nesting)
  createdAt: Date;
  modifiedAt: Date;
  
  // Visual representation
  position?: Point;              // When placed on canvas
  boundingBox: { width: number; height: number };
}

interface ICPin {
  id: string;
  label: string;                 // e.g., "CK", "EN", "Q", "Q̅"
  direction: 'input' | 'output';
  hasInverter: boolean;          // Inverter symbol attached?
  
  // Connection mapping
  internalConnection: PinConnection;  // Wire in internalCircuit
  externalConnection?: PinConnection; // Wire when IC is placed
}
```

**Relationships**:
- Contains Circuit (internalCircuit) with components and wires
- Has ICPin[] defining external interface
- Can contain other CompositeICs (nesting)
- Stored in CompositeICLibrary for reuse

**Business Rules**:
- `name` must be unique in library
- `nestingLevel` calculated from maximum nested IC depth + 1
- Warning if `nestingLevel > 10`
- `internalCircuit` must be self-contained (no external dependencies)
- Pin `label` supports overbar notation (Q̅, EN̅) via Unicode combining character
- `hasInverter` inverts signal: 0↔1, Hi-Z remains Hi-Z

**Validation**:
```typescript
class CompositeICValidator {
  validate(ic: CompositeIC): ValidationResult {
    const errors: string[] = [];
    
    // Check nesting depth
    if (ic.nestingLevel > 10) {
      errors.push(`Warning: ${ic.nestingLevel} levels of nesting may impact performance`);
    }
    
    // Check pin labels are valid
    ic.inputPins.concat(ic.outputPins).forEach(pin => {
      if (!/^[A-Z][A-Z0-9̅]*$/.test(pin.label)) {
        errors.push(`Invalid pin label: ${pin.label}`);
      }
    });
    
    // Check internal circuit is complete
    if (!ic.internalCircuit.isValid()) {
      errors.push('Internal circuit contains errors');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

---

### 4. InverterSymbol

Visual indicator attached to IC pins that inverts logic levels.

```typescript
interface InverterSymbol {
  pinId: string;                 // Pin this inverter is attached to
  position: Point;               // Visual position on pin
  radius: number;                // Small circle radius (5-8px)
}
```

**Relationships**:
- Attached to ICPin (1:1 relationship)
- Can be on input OR output pins

**Business Rules**:
- Inverts logic levels: LOW ↔ HIGH
- Hi-Z remains Hi-Z (cannot invert undefined state)
- Visual: small filled circle on pin
- Applied before signal enters (input) or after signal exits (output)

**Inversion Logic**:
```typescript
function applyInverter(signal: LogicLevel, hasInverter: boolean): LogicLevel {
  if (!hasInverter) return signal;
  
  switch (signal) {
    case LogicLevel.LOW: return LogicLevel.HIGH;
    case LogicLevel.HIGH: return LogicLevel.LOW;
    case LogicLevel.HI_Z: return LogicLevel.HI_Z;
    case LogicLevel.CONFLICT: return LogicLevel.CONFLICT;
  }
}
```

---

### 5. PushButton

Interactive input component that allows users to manually control logic levels.

```typescript
interface PushButton {
  id: string;
  type: 'toggle' | 'momentary';
  state: 'pressed' | 'released';
  outputValue: LogicLevel;       // Current output (HIGH when pressed, LOW when released)
  
  // Visual properties
  position: Point;
  size: { width: number; height: number };
  
  // Connection
  outputPin: PinConnection;
}
```

**Relationships**:
- Connects to Wire via outputPin
- Can be internal component in CompositeIC

**Business Rules**:
- **Toggle mode**: Click to switch state (stays pressed until next click)
- **Momentary mode**: Active only while mouse/touch pressed
- `outputValue` = HIGH when state = 'pressed'
- `outputValue` = LOW when state = 'released'
- Cannot output HI_Z or CONFLICT

**State Machine**:
```
Toggle mode:
  released --[click]--> pressed --[click]--> released

Momentary mode:
  released --[mousedown]--> pressed --[mouseup]--> released
```

---

### 6. LightIndicator

Output component that visually displays logic levels.

```typescript
interface LightIndicator {
  id: string;
  state: 'on' | 'off' | 'dimmed';  // Visual state
  inputValue: LogicLevel;           // Signal being displayed
  
  // Visual properties
  position: Point;
  radius: number;                   // Circle radius
  
  // Connection
  inputPin: PinConnection;
}
```

**Relationships**:
- Receives signal from Wire via inputPin
- Can be internal component in CompositeIC

**Business Rules**:
- **Logic HIGH**: state = 'on' (bright/filled)
- **Logic LOW**: state = 'off' (dim/outline)
- **Hi-Z**: state = 'dimmed' with diagonal stripe pattern (distinct from LOW)
- **CONFLICT**: state = 'on' with orange color (instead of normal color)

**Display Mapping**:
```typescript
function getLightState(level: LogicLevel): LightState {
  switch (level) {
    case LogicLevel.HIGH: return { state: 'on', color: '#FFFF00' };
    case LogicLevel.LOW: return { state: 'off', color: '#333333' };
    case LogicLevel.HI_Z: return { state: 'dimmed', pattern: 'diagonal-stripes' };
    case LogicLevel.CONFLICT: return { state: 'on', color: '#FF6600' };
  }
}
```

---

### 7. Circuit

Container for components and wires (used in both main circuit and CompositeIC internals).

```typescript
interface Circuit {
  id: string;
  components: Component[];       // Gates, ICs, PushButtons, Lights
  wires: Wire[];
  metadata: {
    name: string;
    createdAt: Date;
    modifiedAt: Date;
  };
}

type Component = LogicGate | CompositeIC | PushButton | LightIndicator;
```

**Relationships**:
- Contains Wire[] and Component[]
- Used by main canvas and CompositeIC.internalCircuit
- Referenced by simulation engine for propagation

**Business Rules**:
- Must be acyclic for combinational logic (warnings for cycles)
- All wire destinations must connect to valid input pins
- All wire sources must connect to valid output pins
- No floating connections allowed

---

## Entity Relationships (ERD)

```
Circuit
  ├─ 1:N → Wire
  ├─ 1:N → Component
  │         ├─ LogicGate (from feature 001)
  │         ├─ CompositeIC
  │         ├─ PushButton
  │         └─ LightIndicator
  └─ 1:N → CompositeIC (library)

Wire
  ├─ N:1 → Component (source)
  ├─ N:M → Component (destinations)
  └─ 1:1 → LogicLevel (state)

CompositeIC
  ├─ 1:N → ICPin (inputs/outputs)
  ├─ 1:1 → Circuit (internalCircuit)
  └─ 0:N → InverterSymbol (on pins)

ICPin
  ├─ 0:1 → InverterSymbol
  └─ 1:1 → PinConnection (mapping)

PushButton
  └─ 1:1 → PinConnection (output)

LightIndicator
  └─ 1:1 → PinConnection (input)
```

---

## Color Scheme Definitions

```typescript
const WIRE_COLORS: Record<LogicLevel, string> = {
  [LogicLevel.LOW]: '#0066CC',      // Blue (WCAG AA compliant)
  [LogicLevel.HIGH]: '#CC0000',     // Red (WCAG AA compliant)
  [LogicLevel.HI_Z]: '#808080',     // Grey (WCAG AA compliant)
  [LogicLevel.CONFLICT]: '#FF6600'  // Orange (WCAG AA compliant)
};

const HIGH_CONTRAST_COLORS: Record<LogicLevel, string> = {
  [LogicLevel.LOW]: '#0000FF',      // Brighter blue
  [LogicLevel.HIGH]: '#FF0000',     // Brighter red
  [LogicLevel.HI_Z]: '#404040',     // Darker grey
  [LogicLevel.CONFLICT]: '#FF8C00'  // Brighter orange
};
```

---

## Serialization Format

For persisting CompositeICs to IndexedDB:

```typescript
interface SerializedCompositeIC {
  id: string;
  name: string;
  version: '1.0';  // Schema version for future compatibility
  
  pins: {
    inputs: Array<{ id: string; label: string; hasInverter: boolean }>;
    outputs: Array<{ id: string; label: string; hasInverter: boolean }>;
  };
  
  circuit: {
    components: Array<{ type: string; id: string; config: any }>;
    wires: Array<{ id: string; source: string; destinations: string[] }>;
  };
  
  metadata: {
    nestingLevel: number;
    createdAt: string;  // ISO 8601
    modifiedAt: string;
  };
}
```

---

## Type Guards

```typescript
function isCompositeIC(component: Component): component is CompositeIC {
  return 'internalCircuit' in component;
}

function isPushButton(component: Component): component is PushButton {
  return 'outputValue' in component && 'type' in component;
}

function isLightIndicator(component: Component): component is LightIndicator {
  return 'inputValue' in component && 'state' in component;
}

function hasConflict(wire: Wire): boolean {
  return wire.logicLevel === LogicLevel.CONFLICT;
}
```

---

## Summary

**7 Core Entities**: LogicLevel, Wire, CompositeIC, InverterSymbol, PushButton, LightIndicator, Circuit

**Key Relationships**:
- Wire carries LogicLevel and connects Components
- CompositeIC encapsulates Circuit with defined ICPins
- InverterSymbol modifies signal at ICPin boundaries
- PushButton/LightIndicator enable interactive testing

**TypeScript Benefits**:
- Compile-time type safety for all entities
- Enum-based LogicLevel prevents invalid states
- Interface contracts for component interaction
- Type guards for component discrimination

**Ready for**: Contract definition (API methods for these entities)
