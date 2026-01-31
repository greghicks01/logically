# API Contract: Interactive Components (Push Buttons & Lights)

**Feature**: 002-wire-logic-display  
**Version**: 1.0  
**Format**: TypeScript Interface Definitions

## Overview

This contract defines the API for push button and light indicator components, enabling interactive circuit testing and output visualization.

---

## Push Button Operations API

### createPushButton

Creates a new push button component.

```typescript
interface CreatePushButtonRequest {
  type: 'toggle' | 'momentary';
  position: Point;
  label?: string;
  initialState?: 'pressed' | 'released';
}

interface CreatePushButtonResponse {
  buttonId: string;
  type: 'toggle' | 'momentary';
  outputPinId: string;  // Pin for wire connections
  outputState: LogicLevel;  // Current output value
}

function createPushButton(request: CreatePushButtonRequest): CreatePushButtonResponse;
```

**Behavior**:
- **Toggle**: Click to switch state (stays until next click)
- **Momentary**: Active only while mouse/touch pressed
- Default state: 'released' (outputting LOW)

**Example**:
```typescript
const button = createPushButton({
  type: 'toggle',
  position: { x: 50, y: 50 },
  label: 'START'
});
// Returns: {
//   buttonId: 'btn-1',
//   type: 'toggle',
//   outputPinId: 'btn-1-out',
//   outputState: LogicLevel.LOW
// }
```

---

### pressPushButton

Activates a push button (user interaction).

```typescript
interface PressPushButtonRequest {
  buttonId: string;
}

interface PressPushButtonResponse {
  buttonId: string;
  previousState: 'pressed' | 'released';
  newState: 'pressed' | 'released';
  outputState: LogicLevel;
  affectedWires: string[];  // Wires connected to this button
}

function pressPushButton(request: PressPushButtonRequest): PressPushButtonResponse;
```

**Business Logic**:
- **Toggle mode**: Each call toggles state
- **Momentary mode**: Sets state to 'pressed' (must call releasePushButton)
- outputState = HIGH when pressed, LOW when released
- Triggers wire state propagation

**Performance**: Must update connected wires within 50ms (SC-008)

**Example**:
```typescript
const result = pressPushButton({ buttonId: 'btn-1' });
// Toggle mode:
// Returns: {
//   buttonId: 'btn-1',
//   previousState: 'released',
//   newState: 'pressed',
//   outputState: LogicLevel.HIGH,
//   affectedWires: ['w-100', 'w-101']
// }
```

---

### releasePushButton

Deactivates a momentary push button.

```typescript
interface ReleasePushButtonRequest {
  buttonId: string;
}

interface ReleasePushButtonResponse {
  buttonId: string;
  newState: 'released';
  outputState: LogicLevel;
  affectedWires: string[];
}

function releasePushButton(request: ReleasePushButtonRequest): ReleasePushButtonResponse;
```

**Behavior**:
- Only applies to momentary buttons
- Toggle buttons ignore this call
- Sets output to LOW

**Example**:
```typescript
const result = releasePushButton({ buttonId: 'btn-2' });
// Momentary button releases:
// Returns: {
//   buttonId: 'btn-2',
//   newState: 'released',
//   outputState: LogicLevel.LOW,
//   affectedWires: ['w-200']
// }
```

---

### getPushButtonState

Retrieves current button state.

```typescript
interface GetButtonStateRequest {
  buttonId: string;
}

interface GetButtonStateResponse {
  buttonId: string;
  type: 'toggle' | 'momentary';
  state: 'pressed' | 'released';
  outputState: LogicLevel;
}

function getPushButtonState(request: GetButtonStateRequest): GetButtonStateResponse;
```

---

### deletePushButton

Removes a push button component.

```typescript
interface DeleteButtonRequest {
  buttonId: string;
}

interface DeleteButtonResponse {
  buttonId: string;
  deleted: boolean;
  wiresDisconnected: string[];
}

function deletePushButton(request: DeleteButtonRequest): DeleteButtonResponse;
```

**Side Effects**:
- Connected wires return to HI_Z
- Button removed from canvas

---

## Light Indicator Operations API

### createLightIndicator

Creates a new light indicator component.

```typescript
interface CreateLightIndicatorRequest {
  position: Point;
  size?: number;  // Radius in pixels
  label?: string;
}

interface CreateLightIndicatorResponse {
  lightId: string;
  inputPinId: string;  // Pin for wire connections
  state: 'off';  // Initial state
}

function createLightIndicator(request: CreateLightIndicatorRequest): CreateLightIndicatorResponse;
```

**Example**:
```typescript
const light = createLightIndicator({
  position: { x: 300, y: 100 },
  size: 10,
  label: 'OUTPUT'
});
// Returns: {
//   lightId: 'light-1',
//   inputPinId: 'light-1-in',
//   state: 'off'
// }
```

---

### updateLightState

Updates light display based on input signal.

```typescript
interface UpdateLightStateRequest {
  lightId: string;
  inputSignal: LogicLevel;
}

interface UpdateLightStateResponse {
  lightId: string;
  inputSignal: LogicLevel;
  displayState: 'on' | 'off' | 'dimmed';
  color: string;
  pattern?: 'solid' | 'diagonal-stripes';
}

function updateLightState(request: UpdateLightStateRequest): UpdateLightStateResponse;
```

**Display Logic**:
- **HIGH**: state='on', color='#FFFF00' (yellow), pattern='solid'
- **LOW**: state='off', color='#333333' (dark grey), pattern='solid'
- **HI_Z**: state='dimmed', color='#666666', pattern='diagonal-stripes'
- **CONFLICT**: state='on', color='#FF6600' (orange), pattern='solid'

**Example**:
```typescript
const result = updateLightState({
  lightId: 'light-1',
  inputSignal: LogicLevel.HIGH
});
// Returns: {
//   lightId: 'light-1',
//   inputSignal: LogicLevel.HIGH,
//   displayState: 'on',
//   color: '#FFFF00',
//   pattern: 'solid'
// }
```

---

### getLightState

Retrieves current light display state.

```typescript
interface GetLightStateRequest {
  lightId: string;
}

interface GetLightStateResponse {
  lightId: string;
  inputSignal: LogicLevel;
  displayState: 'on' | 'off' | 'dimmed';
  color: string;
}

function getLightState(request: GetLightStateRequest): GetLightStateResponse;
```

---

### deleteLightIndicator

Removes a light indicator component.

```typescript
interface DeleteLightRequest {
  lightId: string;
}

interface DeleteLightResponse {
  lightId: string;
  deleted: boolean;
  wiresDisconnected: string[];
}

function deleteLightIndicator(request: DeleteLightRequest): DeleteLightResponse;
```

---

## Events

```typescript
interface ButtonPressedEvent {
  type: 'button-pressed';
  buttonId: string;
  buttonType: 'toggle' | 'momentary';
  outputState: LogicLevel;
  timestamp: number;
}

interface ButtonReleasedEvent {
  type: 'button-released';
  buttonId: string;
  buttonType: 'momentary';
  outputState: LogicLevel;
  timestamp: number;
}

interface LightStateChangedEvent {
  type: 'light-state-changed';
  lightId: string;
  inputSignal: LogicLevel;
  displayState: 'on' | 'off' | 'dimmed';
  timestamp: number;
}

type InteractiveComponentEvent = 
  | ButtonPressedEvent 
  | ButtonReleasedEvent 
  | LightStateChangedEvent;
```

---

## Error Codes

```typescript
enum InteractiveComponentErrorCode {
  BUTTON_NOT_FOUND = 'BUTTON_NOT_FOUND',
  LIGHT_NOT_FOUND = 'LIGHT_NOT_FOUND',
  INVALID_BUTTON_TYPE = 'INVALID_BUTTON_TYPE',
  CANNOT_RELEASE_TOGGLE = 'CANNOT_RELEASE_TOGGLE'
}

interface InteractiveComponentError {
  code: InteractiveComponentErrorCode;
  message: string;
  componentId?: string;
}
```

---

## Test Scenarios

### Scenario 1: Toggle button behavior
```typescript
test('toggle button switches state on each press', () => {
  const button = createPushButton({ type: 'toggle', position: { x: 0, y: 0 } });
  
  // First press
  let result = pressPushButton({ buttonId: button.buttonId });
  expect(result.newState).toBe('pressed');
  expect(result.outputState).toBe(LogicLevel.HIGH);
  
  // Second press (toggle)
  result = pressPushButton({ buttonId: button.buttonId });
  expect(result.newState).toBe('released');
  expect(result.outputState).toBe(LogicLevel.LOW);
});
```

### Scenario 2: Momentary button behavior
```typescript
test('momentary button only active while pressed', () => {
  const button = createPushButton({ type: 'momentary', position: { x: 0, y: 0 } });
  
  // Press
  let result = pressPushButton({ buttonId: button.buttonId });
  expect(result.outputState).toBe(LogicLevel.HIGH);
  
  // Release
  result = releasePushButton({ buttonId: button.buttonId });
  expect(result.outputState).toBe(LogicLevel.LOW);
});
```

### Scenario 3: Light displays Hi-Z distinctly from LOW
```typescript
test('light shows dimmed pattern for Hi-Z state', () => {
  const light = createLightIndicator({ position: { x: 100, y: 100 } });
  
  // Unconnected (Hi-Z)
  const hiZState = updateLightState({
    lightId: light.lightId,
    inputSignal: LogicLevel.HI_Z
  });
  expect(hiZState.displayState).toBe('dimmed');
  expect(hiZState.pattern).toBe('diagonal-stripes');
  
  // Connected to LOW
  const lowState = updateLightState({
    lightId: light.lightId,
    inputSignal: LogicLevel.LOW
  });
  expect(lowState.displayState).toBe('off');
  expect(lowState.pattern).toBe('solid');
  
  // States are visually distinct
  expect(hiZState.color).not.toBe(lowState.color);
});
```

### Scenario 4: Button press updates wires in <50ms
```typescript
test('button press propagates to wires within 50ms', async () => {
  const button = createPushButton({ type: 'toggle', position: { x: 0, y: 0 } });
  const wire = createWire({ sourceComponent: button.buttonId, sourcePin: button.outputPinId, ... });
  
  const start = performance.now();
  pressPushButton({ buttonId: button.buttonId });
  
  // Wait for propagation
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const wireState = getWireState(wire.wireId);
  const duration = performance.now() - start;
  
  expect(wireState.logicLevel).toBe(LogicLevel.HIGH);
  expect(duration).toBeLessThan(50);  // SC-008
});
```

### Scenario 5: Components work in composite ICs
```typescript
test('button and light function correctly inside composite IC', () => {
  // Create circuit with button and light
  const circuit = createCircuit();
  const button = createPushButton({ type: 'toggle', position: { x: 50, y: 50 } });
  const light = createLightIndicator({ position: { x: 200, y: 50 } });
  const wire = createWire({ sourceComponent: button.buttonId, destinationComponent: light.lightId, ... });
  
  // Wrap in composite IC
  const ic = createCompositeIC({
    name: 'TEST_MODULE',
    sourceCircuit: circuit,
    pinMappings: { inputs: [], outputs: [] }
  });
  
  // Instantiate
  const instance = instantiateCompositeIC({ icId: ic.icId, position: { x: 0, y: 0 } });
  
  // Button press should light the LED
  pressPushButton({ buttonId: button.buttonId });
  const lightState = getLightState({ lightId: light.lightId });
  expect(lightState.displayState).toBe('on');
});
```

---

## Performance Requirements

| Operation | Max Time | Measured By |
|-----------|----------|-------------|
| createPushButton | 10ms | Single button creation |
| pressPushButton | 50ms | Including wire propagation (SC-008) |
| createLightIndicator | 10ms | Single light creation |
| updateLightState | 5ms | State update and render |

---

## Integration with Composite ICs

**FR-021**: Push buttons and lights MUST be savable as part of composite IC pin definitions

```typescript
// Example: Save composite IC with interactive components
const testableIC = createCompositeIC({
  name: 'TESTABLE_CIRCUIT',
  sourceCircuit: {
    components: [
      { type: 'PushButton', ...config },
      { type: 'LightIndicator', ...config },
      { type: 'LogicGate', ...config }
    ],
    wires: [...]
  },
  pinMappings: {
    inputs: [],  // Button provides input
    outputs: []  // Light shows output
  }
});

// When instantiated, buttons and lights remain functional
const instance = instantiateCompositeIC({ icId: testableIC.icId, ... });
// Users can press buttons and see lights within the IC instance
```

---

## Summary

**Push Buttons**:
- 5 API methods: create, press, release, getState, delete
- 2 types: toggle (persistent) and momentary (press-and-hold)
- Output HIGH when pressed, LOW when released
- <50ms propagation time

**Light Indicators**:
- 4 API methods: create, updateState, getState, delete
- 4 display states: on (HIGH), off (LOW), dimmed (Hi-Z), conflict (CONFLICT)
- Visual distinction between off and Hi-Z via pattern
- Real-time updates synchronized with wire state changes

**Key Features**:
- Both components work within composite ICs
- Event-driven updates for reactive UI
- WCAG-compliant color scheme
- Performance optimized for interactive testing

**Use Cases**: User Story 5 (Interactive Pin Components)
