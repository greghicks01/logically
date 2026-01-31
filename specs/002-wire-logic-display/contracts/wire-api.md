# API Contract: Wire Management

**Feature**: 002-wire-logic-display  
**Version**: 1.0  
**Format**: TypeScript Interface Definitions

## Overview

This contract defines the API for managing wire entities, including creation, state updates, color visualization, and conflict detection.

---

## Wire Operations API

### createWire

Creates a new wire connection between components.

```typescript
interface CreateWireRequest {
  sourceComponent: string;    // Component ID
  sourcePin: string;          // Output pin ID
  destinationComponent: string;
  destinationPin: string;     // Input pin ID
  path?: Point[];            // Optional routing points
}

interface CreateWireResponse {
  wireId: string;
  initialState: LogicLevel;
  color: string;
}

function createWire(request: CreateWireRequest): CreateWireResponse;
```

**Validation**:
- Source pin must be output type
- Destination pin must be input type
- No duplicate connections to same input pin
- Components must exist

**Example**:
```typescript
const wire = createWire({
  sourceComponent: 'gate-1',
  sourcePin: 'out',
  destinationComponent: 'gate-2',
  destinationPin: 'in1',
  path: [{ x: 100, y: 100 }, { x: 200, y: 100 }]
});
// Returns: { wireId: 'w-123', initialState: LogicLevel.HI_Z, color: '#808080' }
```

---

### updateWireState

Updates the logic level of a wire and triggers color change.

```typescript
interface UpdateWireStateRequest {
  wireId: string;
  newState: LogicLevel;
  sourceComponent?: string;   // Which component is driving this state
}

interface UpdateWireStateResponse {
  wireId: string;
  previousState: LogicLevel;
  newState: LogicLevel;
  newColor: string;
  hasConflict: boolean;
  affectedComponents: string[];  // Components that need recalculation
}

function updateWireState(request: UpdateWireStateRequest): UpdateWireStateResponse;
```

**Business Logic**:
- Detect conflicts if multiple sources drive different states
- Set wire color based on new state
- Return list of affected components for propagation

**Performance Requirement**: Must complete in <100ms (SC-002)

**Example**:
```typescript
const result = updateWireState({
  wireId: 'w-123',
  newState: LogicLevel.HIGH,
  sourceComponent: 'gate-1'
});
// Returns: {
//   wireId: 'w-123',
//   previousState: LogicLevel.HI_Z,
//   newState: LogicLevel.HIGH,
//   newColor: '#CC0000',
//   hasConflict: false,
//   affectedComponents: ['gate-2', 'gate-3']
// }
```

---

### detectWireConflict

Checks if a wire has multiple conflicting drivers.

```typescript
interface DetectConflictRequest {
  wireId: string;
}

interface DetectConflictResponse {
  wireId: string;
  hasConflict: boolean;
  drivers: Array<{
    componentId: string;
    outputState: LogicLevel;
  }>;
  resolvedState: LogicLevel;  // CONFLICT if drivers disagree
}

function detectWireConflict(request: DetectConflictRequest): DetectConflictResponse;
```

**Conflict Detection Rules**:
- No conflict if drivers.length <= 1
- No conflict if all drivers output same state
- No conflict if some drivers are HI_Z (tri-state)
- CONFLICT if drivers have different HIGH/LOW states

**Example**:
```typescript
const conflict = detectWireConflict({ wireId: 'w-456' });
// Returns: {
//   wireId: 'w-456',
//   hasConflict: true,
//   drivers: [
//     { componentId: 'gate-1', outputState: LogicLevel.HIGH },
//     { componentId: 'gate-2', outputState: LogicLevel.LOW }
//   ],
//   resolvedState: LogicLevel.CONFLICT
// }
```

---

### getWireColor

Returns the visual color for a wire based on its logic level.

```typescript
interface GetWireColorRequest {
  wireId: string;
  highContrast?: boolean;  // Use high-contrast color scheme
}

interface GetWireColorResponse {
  wireId: string;
  logicLevel: LogicLevel;
  color: string;  // Hex color code
  lineWidth: number;  // Thickness based on state
}

function getWireColor(request: GetWireColorRequest): GetWireColorResponse;
```

**Color Mapping** (from data-model.md):
- LOW: `#0066CC` (blue)
- HIGH: `#CC0000` (red)
- HI_Z: `#808080` (grey)
- CONFLICT: `#FF6600` (orange)

**Example**:
```typescript
const color = getWireColor({ wireId: 'w-123' });
// Returns: {
//   wireId: 'w-123',
//   logicLevel: LogicLevel.HIGH,
//   color: '#CC0000',
//   lineWidth: 2
// }
```

---

### deleteWire

Removes a wire connection.

```typescript
interface DeleteWireRequest {
  wireId: string;
}

interface DeleteWireResponse {
  wireId: string;
  deleted: boolean;
  affectedComponents: string[];  // Components to recalculate
}

function deleteWire(request: DeleteWireRequest): DeleteWireResponse;
```

**Side Effects**:
- Destination pin returns to HI_Z state
- Affected components recalculate outputs
- Wire removed from canvas rendering

---

### bulkUpdateWireStates

Optimized batch update for multiple wires (performance optimization).

```typescript
interface BulkUpdateRequest {
  updates: Array<{
    wireId: string;
    newState: LogicLevel;
  }>;
}

interface BulkUpdateResponse {
  updatedWires: UpdateWireStateResponse[];
  totalTime: number;  // Milliseconds
}

function bulkUpdateWireStates(request: BulkUpdateRequest): BulkUpdateResponse;
```

**Performance Requirement**: Must handle 100 wire updates in <100ms

**Use Case**: Propagating signal changes through large circuits

---

## Events

Wire state changes trigger events for UI updates:

```typescript
interface WireStateChangedEvent {
  type: 'wire-state-changed';
  wireId: string;
  previousState: LogicLevel;
  newState: LogicLevel;
  timestamp: number;
}

interface WireConflictDetectedEvent {
  type: 'wire-conflict-detected';
  wireId: string;
  drivers: string[];  // Component IDs
  timestamp: number;
}

type WireEvent = WireStateChangedEvent | WireConflictDetectedEvent;
```

**Event Handlers**:
```typescript
interface WireEventSubscription {
  subscribe(eventType: 'wire-state-changed' | 'wire-conflict-detected', 
            callback: (event: WireEvent) => void): void;
  unsubscribe(eventType: string, callback: Function): void;
}
```

---

## Error Codes

```typescript
enum WireErrorCode {
  WIRE_NOT_FOUND = 'WIRE_NOT_FOUND',
  INVALID_CONNECTION = 'INVALID_CONNECTION',
  DUPLICATE_CONNECTION = 'DUPLICATE_CONNECTION',
  COMPONENT_NOT_FOUND = 'COMPONENT_NOT_FOUND',
  INVALID_PIN = 'INVALID_PIN',
  PROPAGATION_TIMEOUT = 'PROPAGATION_TIMEOUT'
}

interface WireError {
  code: WireErrorCode;
  message: string;
  wireId?: string;
}
```

---

## Test Scenarios

### Scenario 1: Create wire and verify initial color
```typescript
test('new wire starts in HI_Z state with grey color', () => {
  const wire = createWire({
    sourceComponent: 'power',
    sourcePin: 'out',
    destinationComponent: 'gate-1',
    destinationPin: 'in1'
  });
  
  expect(wire.initialState).toBe(LogicLevel.HI_Z);
  expect(wire.color).toBe('#808080');
});
```

### Scenario 2: Update wire state and verify color change
```typescript
test('wire color changes when state transitions to HIGH', () => {
  const result = updateWireState({
    wireId: 'w-123',
    newState: LogicLevel.HIGH
  });
  
  expect(result.newColor).toBe('#CC0000');  // Red
  expect(result.hasConflict).toBe(false);
});
```

### Scenario 3: Detect conflict when multiple sources drive different values
```typescript
test('wire shows CONFLICT when two gates output different states', () => {
  // Simulate two gates driving same wire
  updateWireState({ wireId: 'w-456', newState: LogicLevel.HIGH, sourceComponent: 'gate-1' });
  updateWireState({ wireId: 'w-456', newState: LogicLevel.LOW, sourceComponent: 'gate-2' });
  
  const conflict = detectWireConflict({ wireId: 'w-456' });
  
  expect(conflict.hasConflict).toBe(true);
  expect(conflict.resolvedState).toBe(LogicLevel.CONFLICT);
});
```

### Scenario 4: Bulk update performance
```typescript
test('bulk update handles 100 wires in <100ms', () => {
  const updates = Array.from({ length: 100 }, (_, i) => ({
    wireId: `w-${i}`,
    newState: i % 2 === 0 ? LogicLevel.HIGH : LogicLevel.LOW
  }));
  
  const start = performance.now();
  const result = bulkUpdateWireStates({ updates });
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(100);
  expect(result.updatedWires.length).toBe(100);
});
```

---

## Performance Requirements

| Operation | Max Time | Measured By |
|-----------|----------|-------------|
| createWire | 10ms | Single wire creation |
| updateWireState | 100ms | Including conflict detection (SC-002) |
| detectWireConflict | 5ms | Single wire check |
| bulkUpdateWireStates | 100ms | 100 wire updates |
| getWireColor | 1ms | Color lookup |

---

## Summary

**7 API Methods**: createWire, updateWireState, detectWireConflict, getWireColor, deleteWire, bulkUpdateWireStates

**2 Event Types**: wire-state-changed, wire-conflict-detected

**Key Features**:
- Real-time state updates with <100ms latency
- Automatic conflict detection
- WCAG-compliant color scheme
- Batch operations for performance
- Event-driven UI updates

**Validation**: All operations include error handling and validation

**Testing**: Comprehensive test scenarios for each operation
