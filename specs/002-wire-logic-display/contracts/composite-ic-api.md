# API Contract: Composite IC Management

**Feature**: 002-wire-logic-display  
**Version**: 1.0  
**Format**: TypeScript Interface Definitions

## Overview

This contract defines the API for creating, managing, and instantiating composite ICs, including nesting validation, pin configuration, and hierarchy navigation.

---

## Composite IC Operations API

### createCompositeIC

Creates a new composite IC from an existing circuit.

```typescript
interface CreateCompositeICRequest {
  name: string;
  description?: string;
  sourceCircuit: Circuit;  // Circuit to encapsulate
  pinMappings: {
    inputs: Array<{
      label: string;          // e.g., "CK", "EN", "D"
      internalWireId: string; // Wire in sourceCircuit
      hasInverter?: boolean;
    }>;
    outputs: Array<{
      label: string;          // e.g., "Q", "Q̅"
      internalWireId: string;
      hasInverter?: boolean;
    }>;
  };
}

interface CreateCompositeICResponse {
  icId: string;
  name: string;
  nestingLevel: number;
  warnings: string[];  // e.g., "10+ levels of nesting"
  createdAt: Date;
}

function createCompositeIC(request: CreateCompositeICRequest): CreateCompositeICResponse;
```

**Validation**:
- `name` must be unique in library
- Pin labels must match pattern `^[A-Z][A-Z0-9̅]*$`
- Internal wires must exist in sourceCircuit
- All components in sourceCircuit must be connected
- Nesting level calculated automatically
- Warning if nestingLevel > 10

**Example**:
```typescript
const ic = createCompositeIC({
  name: 'SR_LATCH',
  description: 'Set-Reset Latch',
  sourceCircuit: myCircuit,
  pinMappings: {
    inputs: [
      { label: 'S', internalWireId: 'w-1' },
      { label: 'R', internalWireId: 'w-2' }
    ],
    outputs: [
      { label: 'Q', internalWireId: 'w-5' },
      { label: 'Q̅', internalWireId: 'w-6', hasInverter: false }  // Already inverted internally
    ]
  }
});
// Returns: {
//   icId: 'ic-789',
//   name: 'SR_LATCH',
//   nestingLevel: 1,
//   warnings: [],
//   createdAt: 2026-01-31T...
// }
```

---

### instantiateCompositeIC

Places a composite IC instance on the canvas.

```typescript
interface InstantiateICRequest {
  icId: string;           // Composite IC definition
  position: Point;        // Canvas position
  instanceName?: string;  // Optional instance identifier
}

interface InstantiateICResponse {
  instanceId: string;
  icId: string;
  position: Point;
  inputPins: Array<{
    pinId: string;
    label: string;
    position: Point;  // Absolute canvas position
  }>;
  outputPins: Array<{
    pinId: string;
    label: string;
    position: Point;
  }>;
}

function instantiateCompositeIC(request: InstantiateICRequest): InstantiateICResponse;
```

**Business Logic**:
- Creates independent instance with own state
- Pin positions calculated relative to IC bounding box
- Instance does not update if IC definition changes (immutable)

**Example**:
```typescript
const instance = instantiateCompositeIC({
  icId: 'ic-789',
  position: { x: 300, y: 200 },
  instanceName: 'latch_1'
});
// Returns instance with pin positions for wire connections
```

---

### calculateNestingDepth

Determines the nesting level of a composite IC.

```typescript
interface CalculateNestingRequest {
  icId: string;
}

interface CalculateNestingResponse {
  icId: string;
  nestingLevel: number;
  nestedICs: Array<{
    icId: string;
    name: string;
    level: number;
  }>;
  exceedsRecommendation: boolean;  // true if > 10 levels
}

function calculateNestingDepth(request: CalculateNestingRequest): CalculateNestingResponse;
```

**Algorithm**:
- Iterative traversal (not recursive) to prevent stack overflow
- Detects circular references (returns error if found)
- Returns full hierarchy tree

**Example**:
```typescript
const depth = calculateNestingDepth({ icId: 'ic-999' });
// Returns: {
//   icId: 'ic-999',
//   nestingLevel: 11,
//   nestedICs: [
//     { icId: 'ic-100', name: 'HALF_ADDER', level: 1 },
//     { icId: 'ic-200', name: 'FULL_ADDER', level: 2 },
//     // ... up to level 11
//   ],
//   exceedsRecommendation: true
// }
```

---

### viewInternalCircuit

Retrieves the internal circuit of a composite IC for visualization.

```typescript
interface ViewInternalCircuitRequest {
  icId: string;
  instanceId?: string;  // Optional: view specific instance state
}

interface ViewInternalCircuitResponse {
  icId: string;
  circuit: Circuit;  // Internal circuit definition
  wireStates: Map<string, LogicLevel>;  // Current state if instanceId provided
  components: Component[];
  pinMappings: {
    inputs: ICPin[];
    outputs: ICPin[];
  };
}

function viewInternalCircuit(request: ViewInternalCircuitRequest): ViewInternalCircuitResponse;
```

**Use Case**: User Story 3 - Navigate hierarchy to debug circuits

**Example**:
```typescript
const internal = viewInternalCircuit({
  icId: 'ic-789',
  instanceId: 'inst-123'  // Include current state
});
// Returns full internal circuit with current wire states
```

---

### updateICPinLabel

Modifies pin labels on a composite IC.

```typescript
interface UpdatePinLabelRequest {
  icId: string;
  pinId: string;
  newLabel: string;
}

interface UpdatePinLabelResponse {
  icId: string;
  pinId: string;
  oldLabel: string;
  newLabel: string;
  validation: {
    valid: boolean;
    errors: string[];
  };
}

function updateICPinLabel(request: UpdatePinLabelRequest): UpdatePinLabelResponse;
```

**Validation**:
- Label must match `^[A-Z][A-Z0-9̅]*$` pattern
- Supports overbar notation (Q̅, EN̅) via Unicode U+0305
- No duplicate labels on same IC

---

### addInverterToPin

Attaches inverter symbol to an IC pin.

```typescript
interface AddInverterRequest {
  icId: string;
  pinId: string;
}

interface AddInverterResponse {
  icId: string;
  pinId: string;
  inverterAdded: boolean;
  visualPosition: Point;  // Where circle should be drawn
}

function addInverterToPin(request: AddInverterRequest): AddInverterResponse;
```

**Business Logic**:
- Inverter inverts logic levels: 0↔1
- Hi-Z remains Hi-Z (per clarification)
- Visual: small filled circle on pin
- Can be on input or output pins

**Example**:
```typescript
const inverter = addInverterToPin({
  icId: 'ic-789',
  pinId: 'pin-s'
});
// Now S pin inverts incoming signal
```

---

### removeInverterFromPin

Removes inverter symbol from an IC pin.

```typescript
interface RemoveInverterRequest {
  icId: string;
  pinId: string;
}

interface RemoveInverterResponse {
  icId: string;
  pinId: string;
  inverterRemoved: boolean;
}

function removeInverterFromPin(request: RemoveInverterRequest): RemoveInverterResponse;
```

---

### deleteCompositeIC

Removes a composite IC definition from the library.

```typescript
interface DeleteCompositeICRequest {
  icId: string;
  force?: boolean;  // Delete even if instances exist
}

interface DeleteCompositeICResponse {
  icId: string;
  deleted: boolean;
  instancesDeleted: string[];  // IDs of instances that were removed
  warnings: string[];  // e.g., "IC is used in other ICs"
}

function deleteCompositeIC(request: DeleteCompositeICRequest): DeleteCompositeICResponse;
```

**Safety Check**:
- Error if IC is used in other ICs (unless force=true)
- Error if IC has active instances (unless force=true)

---

### listCompositeICs

Returns all composite ICs in the library.

```typescript
interface ListCompositeICsRequest {
  filter?: {
    maxNestingLevel?: number;
    nameContains?: string;
  };
  sortBy?: 'name' | 'createdAt' | 'nestingLevel';
}

interface ListCompositeICsResponse {
  ics: Array<{
    icId: string;
    name: string;
    description?: string;
    nestingLevel: number;
    pinCount: { inputs: number; outputs: number };
    createdAt: Date;
  }>;
  totalCount: number;
}

function listCompositeICs(request: ListCompositeICsRequest): ListCompositeICsResponse;
```

---

### saveCompositeICToStorage

Persists a composite IC to IndexedDB.

```typescript
interface SaveICToStorageRequest {
  icId: string;
}

interface SaveICToStorageResponse {
  icId: string;
  saved: boolean;
  storageType: 'indexeddb' | 'localstorage' | 'none';
  sizeBytes: number;
}

function saveCompositeICToStorage(request: SaveICToStorageRequest): SaveICToStorageResponse;
```

**Storage Strategy**:
- Prefer IndexedDB (supports >5MB)
- Fallback to LocalStorage if IndexedDB unavailable
- Serialize to JSON format (see data-model.md)

---

### loadCompositeICFromStorage

Loads a composite IC from IndexedDB.

```typescript
interface LoadICFromStorageRequest {
  icId: string;
}

interface LoadICFromStorageResponse {
  icId: string;
  ic: CompositeIC;
  storageType: 'indexeddb' | 'localstorage';
  loadedAt: Date;
}

function loadCompositeICFromStorage(request: LoadICFromStorageRequest): LoadICFromStorageResponse;
```

---

## Events

```typescript
interface CompositeICCreatedEvent {
  type: 'composite-ic-created';
  icId: string;
  name: string;
  nestingLevel: number;
  timestamp: number;
}

interface CompositeICInstantiatedEvent {
  type: 'composite-ic-instantiated';
  instanceId: string;
  icId: string;
  position: Point;
  timestamp: number;
}

interface NestingDepthWarningEvent {
  type: 'nesting-depth-warning';
  icId: string;
  nestingLevel: number;
  timestamp: number;
}

type CompositeICEvent = 
  | CompositeICCreatedEvent 
  | CompositeICInstantiatedEvent 
  | NestingDepthWarningEvent;
```

---

## Error Codes

```typescript
enum CompositeICErrorCode {
  IC_NOT_FOUND = 'IC_NOT_FOUND',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  INVALID_PIN_LABEL = 'INVALID_PIN_LABEL',
  CIRCULAR_REFERENCE = 'CIRCULAR_REFERENCE',
  MISSING_WIRE = 'MISSING_WIRE',
  STORAGE_FAILED = 'STORAGE_FAILED',
  INSTANCES_EXIST = 'INSTANCES_EXIST'
}

interface CompositeICError {
  code: CompositeICErrorCode;
  message: string;
  icId?: string;
}
```

---

## Test Scenarios

### Scenario 1: Create basic composite IC
```typescript
test('can create composite IC from circuit', () => {
  const ic = createCompositeIC({
    name: 'AND_GATE',
    sourceCircuit: simpleCircuit,
    pinMappings: {
      inputs: [
        { label: 'A', internalWireId: 'w-1' },
        { label: 'B', internalWireId: 'w-2' }
      ],
      outputs: [
        { label: 'Y', internalWireId: 'w-3' }
      ]
    }
  });
  
  expect(ic.icId).toBeDefined();
  expect(ic.nestingLevel).toBe(1);
  expect(ic.warnings).toHaveLength(0);
});
```

### Scenario 2: Detect deep nesting
```typescript
test('warns when nesting exceeds 10 levels', () => {
  const deepIC = createCompositeIC({
    name: 'DEEP_IC',
    sourceCircuit: circuitWith11Levels,
    pinMappings: { inputs: [], outputs: [] }
  });
  
  expect(deepIC.nestingLevel).toBe(11);
  expect(deepIC.warnings).toContain(expect.stringContaining('10'));
});
```

### Scenario 3: Instantiate and connect
```typescript
test('instantiated IC functions identically to original circuit', () => {
  const instance = instantiateCompositeIC({
    icId: 'ic-789',
    position: { x: 100, y: 100 }
  });
  
  // Connect inputs
  createWire({ sourceComponent: 'switch-1', destinationComponent: instance.instanceId, destinationPin: instance.inputPins[0].pinId });
  
  // Verify output
  const output = getWireState(instance.outputPins[0].pinId);
  expect(output.logicLevel).toBe(expectedOutput);
});
```

### Scenario 4: Inverter on pin
```typescript
test('inverter symbol inverts signal at pin', () => {
  addInverterToPin({ icId: 'ic-100', pinId: 'pin-a' });
  
  const instance = instantiateCompositeIC({ icId: 'ic-100', position: { x: 0, y: 0 } });
  
  // Send HIGH to input
  updateWireState({ wireId: getInputWire(instance, 'pin-a'), newState: LogicLevel.HIGH });
  
  // Internal circuit should receive LOW (inverted)
  const internal = viewInternalCircuit({ icId: 'ic-100', instanceId: instance.instanceId });
  expect(internal.wireStates.get('w-1')).toBe(LogicLevel.LOW);
});
```

### Scenario 5: Performance - Create IC in <2s
```typescript
test('IC creation completes in <2 seconds for 50 components', () => {
  const start = performance.now();
  
  const ic = createCompositeIC({
    name: 'LARGE_IC',
    sourceCircuit: circuitWith50Components,
    pinMappings: generatePinMappings()
  });
  
  const duration = performance.now() - start;
  expect(duration).toBeLessThan(2000);  // SC-006
});
```

---

## Performance Requirements

| Operation | Max Time | Measured By |
|-----------|----------|-------------|
| createCompositeIC | 2000ms | 50 internal components (SC-006) |
| instantiateCompositeIC | 500ms | Single instance |
| calculateNestingDepth | 100ms | 10-level hierarchy |
| viewInternalCircuit | 200ms | Complex IC |
| addInverterToPin | 10ms | Single operation |
| saveCompositeICToStorage | 1000ms | Large IC |

---

## Summary

**10 API Methods**: createCompositeIC, instantiateCompositeIC, calculateNestingDepth, viewInternalCircuit, updateICPinLabel, addInverterToPin, removeInverterFromPin, deleteCompositeIC, listCompositeICs, saveCompositeICToStorage, loadCompositeICFromStorage

**3 Event Types**: composite-ic-created, composite-ic-instantiated, nesting-depth-warning

**Key Features**:
- Hierarchical IC composition with unlimited nesting (warning at 10 levels)
- Pin labeling with overbar notation support
- Inverter symbols on pins with proper Hi-Z handling
- Immutable instances (changes to definition don't affect existing instances)
- IndexedDB persistence for complex ICs
- Performance optimized for 50-component ICs

**Validation**: All operations include comprehensive validation and error handling
