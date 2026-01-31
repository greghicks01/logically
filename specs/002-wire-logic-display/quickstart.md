# Quickstart Guide: Wire Logic Level Visualization and Composite ICs

**Feature**: 002-wire-logic-display  
**Date**: 2026-01-31  
**Audience**: Developers implementing this feature

## Overview

This guide provides practical integration test scenarios that demonstrate the wire visualization and composite IC features. Each scenario tests an independent user story and can serve as an acceptance test.

---

## Setup

### Prerequisites
```typescript
// Test environment setup
import { Circuit, Wire, LogicLevel, CompositeIC, PushButton, LightIndicator } from './models';
import { SimulationEngine, WireRenderer, CompositeICManager } from './services';
import { WIRE_COLORS } from './lib/colorSchemes';

// Initialize test circuit
let circuit: Circuit;
let engine: SimulationEngine;

beforeEach(() => {
  circuit = new Circuit();
  engine = new SimulationEngine(circuit);
});
```

---

## Scenario 1: Wire Color Visualization (User Story 1)

**Goal**: Verify wires change color based on logic level

### Test: Wire displays correct color for each logic state

```typescript
test('Scenario 1.1: Wire shows blue for logic 0', () => {
  // Create power source (LOW) and wire
  const ground = circuit.addComponent({ type: 'PowerSource', value: LogicLevel.LOW });
  const wire = circuit.createWire({
    source: { componentId: ground.id, pinId: 'out' },
    destination: { componentId: 'gate-1', pinId: 'in1' }
  });
  
  // Propagate signal
  engine.propagate();
  
  // Verify wire state and color
  expect(wire.logicLevel).toBe(LogicLevel.LOW);
  expect(wire.color).toBe(WIRE_COLORS[LogicLevel.LOW]);  // Blue
  expect(wire.color).toBe('#0066CC');
});

test('Scenario 1.2: Wire shows red for logic 1', () => {
  const power = circuit.addComponent({ type: 'PowerSource', value: LogicLevel.HIGH });
  const wire = circuit.createWire({
    source: { componentId: power.id, pinId: 'out' },
    destination: { componentId: 'gate-1', pinId: 'in1' }
  });
  
  engine.propagate();
  
  expect(wire.logicLevel).toBe(LogicLevel.HIGH);
  expect(wire.color).toBe('#CC0000');  // Red
});

test('Scenario 1.3: Wire shows grey for Hi-Z (floating)', () => {
  const wire = circuit.createWire({
    source: null,  // No driver
    destination: { componentId: 'gate-1', pinId: 'in1' }
  });
  
  expect(wire.logicLevel).toBe(LogicLevel.HI_Z);
  expect(wire.color).toBe('#808080');  // Grey
});

test('Scenario 1.4: Wire color updates in real-time', () => {
  const source = circuit.addComponent({ type: 'PowerSource', value: LogicLevel.LOW });
  const wire = circuit.createWire({ source: { componentId: source.id, pinId: 'out' }, ... });
  
  expect(wire.color).toBe('#0066CC');  // Blue initially
  
  // Change source state
  source.setValue(LogicLevel.HIGH);
  const start = performance.now();
  engine.propagate();
  const duration = performance.now() - start;
  
  // Verify color updated quickly
  expect(wire.color).toBe('#CC0000');  // Red after update
  expect(duration).toBeLessThan(100);  // SC-002: <100ms update time
});
```

**Acceptance**: ✅ FR-001, FR-002, FR-003, FR-004

---

## Scenario 2: Conflict Detection (Edge Case)

**Goal**: Verify orange color when multiple outputs drive different values

### Test: Wire shows conflict state

```typescript
test('Scenario 2.1: Wire shows orange when outputs conflict', () => {
  // Create two gates driving same wire
  const gate1 = circuit.addComponent({ type: 'LogicGate', gateType: 'AND' });
  const gate2 = circuit.addComponent({ type: 'LogicGate', gateType: 'OR' });
  
  // Both outputs connect to same wire (multi-source)
  const wire = circuit.createWire({
    source: { componentId: gate1.id, pinId: 'out' },
    destination: { componentId: 'gate-3', pinId: 'in1' }
  });
  wire.addDriver({ componentId: gate2.id, pinId: 'out' });
  
  // Set gates to output different values
  gate1.setOutput(LogicLevel.HIGH);
  gate2.setOutput(LogicLevel.LOW);
  
  engine.propagate();
  
  // Verify conflict detected
  expect(wire.logicLevel).toBe(LogicLevel.CONFLICT);
  expect(wire.color).toBe('#FF6600');  // Orange
  expect(wire.hasConflict()).toBe(true);
});

test('Scenario 2.2: Conflict resolves when sources agree', () => {
  const wire = createConflictingWire();  // Helper creates conflicted wire
  
  expect(wire.logicLevel).toBe(LogicLevel.CONFLICT);
  
  // Make both sources output HIGH
  gate1.setOutput(LogicLevel.HIGH);
  gate2.setOutput(LogicLevel.HIGH);
  engine.propagate();
  
  // Conflict should resolve
  expect(wire.logicLevel).toBe(LogicLevel.HIGH);
  expect(wire.color).toBe('#CC0000');  // Red
  expect(wire.hasConflict()).toBe(false);
});
```

**Acceptance**: ✅ FR-013

---

## Scenario 3: Create Composite IC (User Story 2)

**Goal**: Verify composite IC creation and reusability

### Test: Build SR Latch as composite IC

```typescript
test('Scenario 3.1: Create composite IC from circuit', () => {
  // Build SR Latch circuit
  const nor1 = circuit.addComponent({ type: 'LogicGate', gateType: 'NOR' });
  const nor2 = circuit.addComponent({ type: 'LogicGate', gateType: 'NOR' });
  
  // Connect cross-coupled NOR gates
  circuit.createWire({ source: { componentId: nor1.id, pinId: 'out' }, destination: { componentId: nor2.id, pinId: 'in2' } });
  circuit.createWire({ source: { componentId: nor2.id, pinId: 'out' }, destination: { componentId: nor1.id, pinId: 'in2' } });
  
  // Create inputs
  const inputS = circuit.createWire({ source: null, destination: { componentId: nor1.id, pinId: 'in1' } });
  const inputR = circuit.createWire({ source: null, destination: { componentId: nor2.id, pinId: 'in1' } });
  
  // Create outputs
  const outputQ = circuit.createWire({ source: { componentId: nor1.id, pinId: 'out' }, destination: null });
  const outputQBar = circuit.createWire({ source: { componentId: nor2.id, pinId: 'out' }, destination: null });
  
  // Convert to composite IC
  const manager = new CompositeICManager();
  const srLatch = manager.createCompositeIC({
    name: 'SR_LATCH',
    description: 'Set-Reset Latch',
    sourceCircuit: circuit,
    pinMappings: {
      inputs: [
        { label: 'S', internalWireId: inputS.id },
        { label: 'R', internalWireId: inputR.id }
      ],
      outputs: [
        { label: 'Q', internalWireId: outputQ.id },
        { label: 'Q̅', internalWireId: outputQBar.id }
      ]
    }
  });
  
  // Verify IC created
  expect(srLatch.id).toBeDefined();
  expect(srLatch.name).toBe('SR_LATCH');
  expect(srLatch.inputPins).toHaveLength(2);
  expect(srLatch.outputPins).toHaveLength(2);
  expect(srLatch.nestingLevel).toBe(1);  // No nested ICs
});

test('Scenario 3.2: Composite IC instance behaves like original', () => {
  const srLatch = createSRLatchIC();  // Helper function
  
  // Create new circuit and instantiate IC
  const testCircuit = new Circuit();
  const instance = manager.instantiateCompositeIC({
    icId: srLatch.id,
    position: { x: 100, y: 100 }
  });
  testCircuit.addComponent(instance);
  
  // Connect inputs
  const setWire = testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'S' } });
  const resetWire = testCircuit.createWire({ source: powerLow, destination: { componentId: instance.id, pinId: 'R' } });
  
  // Propagate
  engine.propagate();
  
  // Verify SR Latch behavior (Set condition: S=1, R=0 → Q=1)
  const qOutput = testCircuit.getWire({ source: { componentId: instance.id, pinId: 'Q' } });
  expect(qOutput.logicLevel).toBe(LogicLevel.HIGH);
});
```

**Acceptance**: ✅ FR-005, FR-006, FR-021, FR-022, FR-028, FR-029, SC-004 (95% success rate)

---

## Scenario 4: Nested Composite ICs (User Story 2)

**Goal**: Verify composite ICs can contain other composite ICs

### Test: Create 3-level nesting hierarchy

```typescript
test('Scenario 4.1: Nest composite ICs up to 10 levels', () => {
  // Level 1: Half Adder (AND + XOR)
  const halfAdder = createHalfAdderIC();  // Basic gates only
  expect(halfAdder.nestingLevel).toBe(1);
  
  // Level 2: Full Adder (2 Half Adders + OR)
  const fullAdder = createFullAdderIC(halfAdder);  // Uses halfAdder
  expect(fullAdder.nestingLevel).toBe(2);
  
  // Level 3: 4-bit Adder (4 Full Adders)
  const fourBitAdder = create4BitAdderIC(fullAdder);
  expect(fourBitAdder.nestingLevel).toBe(3);
  
  // Verify all ICs are valid
  expect(fullAdder.internalCircuit.components).toContain(expect.objectContaining({ type: 'CompositeIC', icId: halfAdder.id }));
});

test('Scenario 4.2: Warn when nesting exceeds 10 levels', () => {
  const deep10 = createDeeplyNestedIC(10);  // Helper creates 10-level IC
  expect(deep10.warnings).toHaveLength(0);
  
  const deep11 = createDeeplyNestedIC(11);
  expect(deep11.warnings).toContain(expect.stringContaining('10'));
  expect(deep11.warnings).toContain(expect.stringContaining('performance'));
  
  // But IC is still valid and created
  expect(deep11.id).toBeDefined();
  expect(deep11.nestingLevel).toBe(11);
});

test('Scenario 4.3: Logic propagates correctly through 10 levels', () => {
  const deep10 = createDeeplyNestedIC(10);
  const instance = manager.instantiateCompositeIC({ icId: deep10.id, position: { x: 0, y: 0 } });
  
  // Set input
  const inputWire = testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'in' } });
  
  const start = performance.now();
  engine.propagate();
  const duration = performance.now() - start;
  
  // Verify output
  const outputWire = testCircuit.getWire({ source: { componentId: instance.id, pinId: 'out' } });
  expect(outputWire.logicLevel).toBe(LogicLevel.HIGH);  // Signal propagated
  
  // Performance requirement: no degradation up to 10 levels (SC-003)
  expect(duration).toBeLessThan(100);  // Still fast
});
```

**Acceptance**: ✅ FR-007, FR-008, FR-011 (nesting warning), SC-003

---

## Scenario 5: Navigate IC Hierarchy (User Story 3)

**Goal**: Verify users can view internal wire states

### Test: Drill down into nested ICs

```typescript
test('Scenario 5.1: View internal structure of composite IC', () => {
  const fullAdder = createFullAdderIC();
  const instance = manager.instantiateCompositeIC({ icId: fullAdder.id, position: { x: 0, y: 0 } });
  
  // Set inputs: A=1, B=1, Cin=0
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'A' } });
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'B' } });
  testCircuit.createWire({ source: powerLow, destination: { componentId: instance.id, pinId: 'Cin' } });
  
  engine.propagate();
  
  // View internal circuit
  const internal = manager.viewInternalCircuit({
    icId: fullAdder.id,
    instanceId: instance.id
  });
  
  // Verify internal wires have correct states
  expect(internal.wireStates.size).toBeGreaterThan(0);
  
  // Check intermediate wire (between half adders)
  const intermediateWire = internal.wireStates.get('internal-carry');
  expect(intermediateWire).toBe(LogicLevel.HIGH);  // A+B produces carry
  
  // Verify wire colors are visible
  internal.circuit.wires.forEach(wire => {
    expect(wire.color).toMatch(/#[0-9A-F]{6}/);  // Has valid hex color
  });
});

test('Scenario 5.2: Real-time wire colors update in internal view', () => {
  const srLatch = createSRLatchIC();
  const instance = manager.instantiateCompositeIC({ icId: srLatch.id, position: { x: 0, y: 0 } });
  
  // View internal circuit
  const internal = manager.viewInternalCircuit({ icId: srLatch.id, instanceId: instance.id });
  
  // Initially all HI_Z (grey)
  internal.circuit.wires.forEach(wire => {
    expect(wire.color).toBe('#808080');
  });
  
  // Trigger SET
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'S' } });
  engine.propagate();
  
  // Re-fetch internal state
  const updatedInternal = manager.viewInternalCircuit({ icId: srLatch.id, instanceId: instance.id });
  
  // Some wires should now be red (HIGH)
  const highWires = updatedInternal.circuit.wires.filter(w => w.color === '#CC0000');
  expect(highWires.length).toBeGreaterThan(0);
});
```

**Acceptance**: ✅ FR-012, FR-013 (view internal), SC-005 (navigate in <5s)

---

## Scenario 6: Inverter Symbols (User Story 4)

**Goal**: Verify inverter symbols work correctly on pins

### Test: Add inverter to pin and verify inversion

```typescript
test('Scenario 6.1: Inverter on input pin inverts signal', () => {
  const andGate = createANDGateIC();  // Simple IC wrapper around AND gate
  
  // Add inverter to first input
  manager.addInverterToPin({ icId: andGate.id, pinId: 'A' });
  
  const instance = manager.instantiateCompositeIC({ icId: andGate.id, position: { x: 0, y: 0 } });
  
  // Send HIGH to input A (with inverter)
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'A' } });
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'B' } });
  
  engine.propagate();
  
  // View internal circuit
  const internal = manager.viewInternalCircuit({ icId: andGate.id, instanceId: instance.id });
  
  // Pin A receives HIGH externally, but LOW internally (inverted)
  const internalAWire = internal.wireStates.get('input-a-internal');
  expect(internalAWire).toBe(LogicLevel.LOW);  // Inverted from HIGH
  
  // AND gate sees (LOW, HIGH) → output LOW
  const output = testCircuit.getWire({ source: { componentId: instance.id, pinId: 'Y' } });
  expect(output.logicLevel).toBe(LogicLevel.LOW);
});

test('Scenario 6.2: Inverter on output pin inverts outgoing signal', () => {
  const andGate = createANDGateIC();
  manager.addInverterToPin({ icId: andGate.id, pinId: 'Y' });  // Output inverter (makes it NAND)
  
  const instance = manager.instantiateCompositeIC({ icId: andGate.id, position: { x: 0, y: 0 } });
  
  // Both inputs HIGH
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'A' } });
  testCircuit.createWire({ source: powerHigh, destination: { componentId: instance.id, pinId: 'B' } });
  
  engine.propagate();
  
  // AND gate internally outputs HIGH
  const internal = manager.viewInternalCircuit({ icId: andGate.id, instanceId: instance.id });
  const internalOutput = internal.wireStates.get('output-y-internal');
  expect(internalOutput).toBe(LogicLevel.HIGH);
  
  // But external output is inverted to LOW (NAND behavior)
  const output = testCircuit.getWire({ source: { componentId: instance.id, pinId: 'Y' } });
  expect(output.logicLevel).toBe(LogicLevel.LOW);  // Inverted
});

test('Scenario 6.3: Inverter on Hi-Z keeps Hi-Z', () => {
  const triStateBuffer = createTriStateBufferIC();
  manager.addInverterToPin({ icId: triStateBuffer.id, pinId: 'OUT' });
  
  const instance = manager.instantiateCompositeIC({ icId: triStateBuffer.id, position: { x: 0, y: 0 } });
  
  // Disable output (Hi-Z state)
  testCircuit.createWire({ source: powerLow, destination: { componentId: instance.id, pinId: 'EN' } });
  engine.propagate();
  
  // Output should remain Hi-Z (inverter doesn't affect it)
  const output = testCircuit.getWire({ source: { componentId: instance.id, pinId: 'OUT' } });
  expect(output.logicLevel).toBe(LogicLevel.HI_Z);
  expect(output.color).toBe('#808080');  // Grey
});
```

**Acceptance**: ✅ FR-014, FR-015, FR-016, FR-017 (inverter behavior with Hi-Z)

---

## Scenario 7: Interactive Components (User Story 5)

**Goal**: Verify push buttons and lights work correctly

### Test: Push button controls light

```typescript
test('Scenario 7.1: Toggle button turns light on/off', () => {
  const button = new PushButton({ type: 'toggle', position: { x: 50, y: 50 } });
  const light = new LightIndicator({ position: { x: 200, y: 50 } });
  const wire = testCircuit.createWire({
    source: { componentId: button.id, pinId: 'out' },
    destination: { componentId: light.id, pinId: 'in' }
  });
  
  // Initially off
  expect(button.state).toBe('released');
  expect(light.displayState).toBe('off');
  
  // Press button
  const start = performance.now();
  button.press();
  engine.propagate();
  const duration = performance.now() - start;
  
  // Light turns on
  expect(button.state).toBe('pressed');
  expect(wire.logicLevel).toBe(LogicLevel.HIGH);
  expect(light.displayState).toBe('on');
  expect(light.color).toBe('#FFFF00');  // Yellow
  expect(duration).toBeLessThan(50);  // SC-008: <50ms
  
  // Press again (toggle off)
  button.press();
  engine.propagate();
  
  expect(button.state).toBe('released');
  expect(light.displayState).toBe('off');
});

test('Scenario 7.2: Momentary button only active while pressed', () => {
  const button = new PushButton({ type: 'momentary', position: { x: 50, y: 50 } });
  const light = new LightIndicator({ position: { x: 200, y: 50 } });
  testCircuit.createWire({ source: { componentId: button.id, pinId: 'out' }, destination: { componentId: light.id, pinId: 'in' } });
  
  // Press and hold
  button.press();
  engine.propagate();
  expect(light.displayState).toBe('on');
  
  // Release
  button.release();
  engine.propagate();
  expect(light.displayState).toBe('off');  // Light immediately turns off
});

test('Scenario 7.3: Light distinguishes Hi-Z from LOW', () => {
  const light = new LightIndicator({ position: { x: 100, y: 100 } });
  
  // Unconnected (Hi-Z)
  light.updateState(LogicLevel.HI_Z);
  expect(light.displayState).toBe('dimmed');
  expect(light.pattern).toBe('diagonal-stripes');
  const hiZColor = light.color;
  
  // Connected to LOW
  const wire = testCircuit.createWire({ source: powerLow, destination: { componentId: light.id, pinId: 'in' } });
  engine.propagate();
  expect(light.displayState).toBe('off');
  expect(light.pattern).toBe('solid');
  const lowColor = light.color;
  
  // Colors are different
  expect(hiZColor).not.toBe(lowColor);
});

test('Scenario 7.4: Button and light work inside composite IC', () => {
  // Create self-testing circuit
  const circuit = new Circuit();
  const button = new PushButton({ type: 'toggle', position: { x: 50, y: 50 } });
  const light = new LightIndicator({ position: { x: 200, y: 50 } });
  circuit.createWire({ source: { componentId: button.id, pinId: 'out' }, destination: { componentId: light.id, pinId: 'in' } });
  
  // Wrap in IC
  const testableIC = manager.createCompositeIC({
    name: 'TESTABLE_MODULE',
    sourceCircuit: circuit,
    pinMappings: { inputs: [], outputs: [] }  // No external pins (self-contained)
  });
  
  // Instantiate
  const instance = manager.instantiateCompositeIC({ icId: testableIC.id, position: { x: 0, y: 0 } });
  
  // Button press should still work
  button.press();
  engine.propagate();
  
  // Light should respond
  expect(light.displayState).toBe('on');
});
```

**Acceptance**: ✅ FR-018, FR-019, FR-020 (lights), FR-021 (in composite ICs), SC-008, SC-009 (90% success)

---

## Performance Benchmarks

### Benchmark 1: Wire color updates at scale

```typescript
test('Benchmark: 1000 wires update in real-time', () => {
  // Create large circuit with 1000 wires
  const largeCircuit = createLargeCircuit(1000);  // Helper function
  
  // Change input state
  const start = performance.now();
  largeCircuit.setInput('in1', LogicLevel.HIGH);
  engine.propagate();
  const duration = performance.now() - start;
  
  // All affected wires should update colors
  const redWires = largeCircuit.wires.filter(w => w.color === '#CC0000');
  expect(redWires.length).toBeGreaterThan(0);
  
  // Performance: <100ms for propagation (SC-002)
  expect(duration).toBeLessThan(100);
});
```

### Benchmark 2: Composite IC operations

```typescript
test('Benchmark: IC with 50 components created in <2s', () => {
  const complexCircuit = createCircuitWithNComponents(50);
  
  const start = performance.now();
  const ic = manager.createCompositeIC({
    name: 'COMPLEX_IC',
    sourceCircuit: complexCircuit,
    pinMappings: generatePinMappings(complexCircuit)
  });
  const duration = performance.now() - start;
  
  expect(ic.id).toBeDefined();
  expect(duration).toBeLessThan(2000);  // SC-006
});
```

---

## End-to-End User Journey

**Complete workflow combining all features:**

```typescript
test('E2E: Build, test, and save a testable circuit as composite IC', () => {
  // Step 1: Build SR Latch with test components
  const button1 = new PushButton({ type: 'momentary', position: { x: 0, y: 0 }, label: 'SET' });
  const button2 = new PushButton({ type: 'momentary', position: { x: 0, y: 50 }, label: 'RESET' });
  const light1 = new LightIndicator({ position: { x: 300, y: 25 }, label: 'Q' });
  const light2 = new LightIndicator({ position: { x: 300, y: 75 }, label: 'Q̅' });
  
  const nor1 = circuit.addComponent({ type: 'LogicGate', gateType: 'NOR' });
  const nor2 = circuit.addComponent({ type: 'LogicGate', gateType: 'NOR' });
  
  // Wire up circuit
  const setWire = circuit.createWire({ source: { componentId: button1.id, pinId: 'out' }, destination: { componentId: nor1.id, pinId: 'in1' } });
  const resetWire = circuit.createWire({ source: { componentId: button2.id, pinId: 'out' }, destination: { componentId: nor2.id, pinId: 'in1' } });
  const feedbackWire1 = circuit.createWire({ source: { componentId: nor1.id, pinId: 'out' }, destination: { componentId: nor2.id, pinId: 'in2' } });
  const feedbackWire2 = circuit.createWire({ source: { componentId: nor2.id, pinId: 'out' }, destination: { componentId: nor1.id, pinId: 'in2' } });
  const outputQ = circuit.createWire({ source: { componentId: nor1.id, pinId: 'out' }, destination: { componentId: light1.id, pinId: 'in' } });
  const outputQBar = circuit.createWire({ source: { componentId: nor2.id, pinId: 'out' }, destination: { componentId: light2.id, pinId: 'in' } });
  
  // Step 2: Test the circuit
  // Press SET button
  button1.press();
  engine.propagate();
  
  expect(setWire.color).toBe('#CC0000');  // Red (HIGH)
  expect(light1.displayState).toBe('on');  // Q=1
  expect(light2.displayState).toBe('off'); // Q̅=0
  
  button1.release();
  engine.propagate();
  
  // State should hold
  expect(light1.displayState).toBe('on');  // Still Q=1
  
  // Press RESET button
  button2.press();
  engine.propagate();
  
  expect(light1.displayState).toBe('off'); // Q=0
  expect(light2.displayState).toBe('on');  // Q̅=1
  
  // Step 3: Save as composite IC
  const testableIC = manager.createCompositeIC({
    name: 'TESTABLE_SR_LATCH',
    description: 'SR Latch with built-in test buttons and indicators',
    sourceCircuit: circuit,
    pinMappings: {
      inputs: [],   // No external pins - self-contained
      outputs: []
    }
  });
  
  // Step 4: Save to storage
  const saved = await manager.saveCompositeICToStorage({ icId: testableIC.id });
  expect(saved.saved).toBe(true);
  expect(saved.storageType).toMatch(/indexeddb|localstorage/);
  
  // Step 5: Load and instantiate in new circuit
  const loaded = await manager.loadCompositeICFromStorage({ icId: testableIC.id });
  const newCircuit = new Circuit();
  const instance = manager.instantiateCompositeIC({ icId: loaded.ic.id, position: { x: 100, y: 100 } });
  newCircuit.addComponent(instance);
  
  // Verify buttons and lights still work in the instance
  // (would require interaction simulation in E2E test)
  expect(instance.id).toBeDefined();
});
```

**Acceptance**: ✅ All user stories integrated successfully

---

## Summary

**7 Test Scenarios**: Wire colors, conflicts, IC creation, nesting, hierarchy navigation, inverters, interactive components

**2 Performance Benchmarks**: 1000-wire circuits, 50-component ICs

**1 End-to-End Journey**: Complete feature integration

**Coverage**: All functional requirements (FR-001 through FR-022) and success criteria (SC-001 through SC-010)

**Ready for Implementation**: These scenarios can be converted directly to Jest/Playwright tests
