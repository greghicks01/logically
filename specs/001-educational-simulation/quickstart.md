# Quickstart Guide: Educational Simulation Features

**Feature**: 001-educational-simulation  
**For**: Developers implementing the feature  
**Date**: 2026-02-07

## Overview

This guide provides a quick reference for developers implementing truth table visualization and slow-motion simulation features. Follow the implementation order below to build features incrementally while maintaining the constitutional principles.

---

## Implementation Phases

### Phase 1: MVP - Truth Tables & Smooth Animation (2-3 weeks)

**Goal**: Enable basic truth table display and smooth slow-motion mode

**Tasks**:

1. **Create data models** (`src/models/`)
   - `TruthTable.ts` - Truth table data structure
   - `SimulationMode.ts` - Mode type and config
   - `PropagationEvent.ts` - Event representation

2. **Build utility functions** (`src/lib/`)
   - `truthTableUtils.ts` - Generate combinations, validate inputs
   - `timingUtils.ts` - Delay calculations
   - `animationUtils.ts` - Interpolation functions

3. **Unit test utilities** (`tests/unit/`)
   - Test all edge cases (0 inputs, max inputs, boundary values)
   - Verify mathematical correctness (2^n rows, delay formulas)
   - Target 100% coverage for utilities

4. **Implement services** (`src/services/`)
   - `TruthTableGenerator.ts` - Generate truth tables from gates
   - `AnimationController.ts` - rAF-based animation loop
   - Extend `SimulationEngine.ts` - Add smooth mode support

5. **Create UI components** (`src/components/`)
   - `TruthTablePanel/` - Display truth table with current row highlighting
   - `SimulationControls/` - Play/pause toggle for smooth mode
   - Keep styling simple (semantic HTML + CSS)

6. **Integration testing** (`tests/integration/`)
   - Test truth table generation + gate interaction
   - Test smooth animation start/stop

7. **E2E testing** (`tests/e2e/`)
   - User can enable truth table for gate (User Story 1, Scenario 1)
   - User can enable smooth slow-motion mode (User Story 2, Scenario 1)

**Deliverables**:
- ✅ Truth tables work for gates with 1-6 inputs
- ✅ Smooth mode animates signal propagation at uniform speed
- ✅ Play/pause control functional
- ✅ All tests passing

---

### Phase 2: Enhanced Controls (1-2 weeks)

**Goal**: Add speed control, step mode, and accessibility

**Tasks**:

1. **Enhance SimulationControls**
   - Speed slider (0.1× to 10×, logarithmic scale)
   - Step forward/backward buttons
   - Keyboard shortcuts (Space, arrows, +/-)

2. **Add step-by-step mode**
   - `PropagationScheduler.ts` - Event queue management
   - Manual event processing on button click
   - History tracking for step backward

3. **Accessibility improvements**
   - ARIA labels and roles
   - Keyboard navigation for truth table
   - Screen reader announcements for state changes
   - High contrast mode support

4. **Truth table enhancements**
   - Virtual scrolling for >6 inputs (use `react-window`)
   - Auto-scroll to current row
   - Display preferences (binary vs symbolic)

5. **E2E testing**
   - Speed control changes animation speed (User Story 2, Scenario 4)
   - Step mode allows manual advancement
   - Keyboard shortcuts work

**Deliverables**:
- ✅ Speed slider functional
- ✅ Step-by-step mode works
- ✅ Accessibility compliance (WCAG AA)
- ✅ Truth tables handle up to 10 inputs

---

### Phase 3: Realistic Mode & Advanced Features (2-3 weeks)

**Goal**: Implement realistic propagation delays and glitch visualization

**Tasks**:

1. **Add realistic mode**
   - `DelayCalculator.ts` - Gate-specific delay calculations
   - Update `PropagationScheduler` for async event processing
   - Glitch detection and visualization

2. **Gate delay configuration**
   - `GATE_PROPAGATION_DELAYS` constant (from research.md)
   - Support for different IC families (future: CMOS, ECL)

3. **Visualization enhancements**
   - Different animation curves per gate type
   - Glitch highlighting (brief color flash)
   - Timing diagram overlay (optional)

4. **Advanced truth table features**
   - Editable output column (custom gate definition)
   - Click row to set circuit inputs
   - Export truth table to CSV/image

5. **Performance optimization**
   - Profile with >50 gates
   - Optimize rendering (Canvas batching, memoization)
   - Consider Web Workers for heavy calculations

6. **E2E testing**
   - Realistic mode shows different delays (User Story 3, Scenario 1)
   - Glitches visible in hazard circuits (User Story 3, Scenario 2)

**Deliverables**:
- ✅ Realistic mode functional with gate-specific delays
- ✅ Glitches displayed correctly
- ✅ Performance <100ms lag with 50 gates
- ✅ All acceptance scenarios passing

---

## Quick Reference

### File Structure

```
src/
├── models/
│   ├── TruthTable.ts          # CREATE
│   ├── SimulationMode.ts      # CREATE
│   └── PropagationEvent.ts    # CREATE
│
├── services/
│   ├── TruthTableGenerator.ts # CREATE
│   ├── PropagationScheduler.ts # CREATE
│   ├── AnimationController.ts  # CREATE
│   └── SimulationEngine.ts     # EXTEND
│
├── lib/
│   ├── truthTableUtils.ts     # CREATE - Math utilities
│   ├── timingUtils.ts         # CREATE - Delay calculations
│   └── animationUtils.ts      # CREATE - Interpolation
│
└── components/
    ├── TruthTablePanel/       # CREATE
    └── SimulationControls/    # CREATE

tests/
├── unit/
│   ├── truthTableUtils.test.ts
│   ├── timingUtils.test.ts
│   └── animationUtils.test.ts
│
├── integration/
│   ├── truthTable.test.tsx
│   └── slowMotion.test.tsx
│
└── e2e/
    ├── truthTable.spec.ts
    ├── smoothSimulation.spec.ts
    └── realisticSimulation.spec.ts
```

---

### Key Code Snippets

#### 1. Generate Truth Table

```typescript
// src/lib/truthTableUtils.ts
export function generateInputCombinations(inputCount: number): boolean[][] {
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

// src/services/TruthTableGenerator.ts
export function generateTruthTable(gate: Gate): TruthTable {
  const inputPins = gate.inputPins.map(p => p.name);
  const combinations = generateInputCombinations(inputPins.length);
  
  const rows: TruthTableRow[] = combinations.map((combo, index) => {
    const inputs: Record<string, LogicLevel> = {};
    inputPins.forEach((name, i) => {
      inputs[name] = combo[i] ? LogicLevel.HIGH : LogicLevel.LOW;
    });
    
    const output = gate.evaluateOutput(inputs);
    
    return {
      id: combo.map(b => b ? '1' : '0').join(''),
      inputs,
      output,
      isCurrent: false
    };
  });
  
  return {
    gateId: gate.id,
    inputPins,
    outputPin: gate.outputPins[0].name,
    rows,
    isVisible: false,
    generatedAt: Date.now()
  };
}
```

---

#### 2. Animation Controller with rAF

```typescript
// src/services/AnimationController.ts
export class AnimationController {
  private rafId: number | null = null;
  private startTime: number = 0;
  private speed: number = 1.0;
  private isPaused: boolean = false;
  private pausedTime: number = 0;
  
  start(onFrame: (elapsed: number) => void): void {
    if (this.rafId !== null) {
      throw new Error('Animation already running');
    }
    
    this.startTime = performance.now();
    this.isPaused = false;
    
    const animate = (timestamp: number) => {
      if (this.isPaused) return;
      
      const elapsed = (timestamp - this.startTime) * this.speed;
      onFrame(elapsed);
      
      this.rafId = requestAnimationFrame(animate);
    };
    
    this.rafId = requestAnimationFrame(animate);
  }
  
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
  
  setSpeed(multiplier: number): void {
    this.speed = Math.max(0.1, Math.min(10.0, multiplier)); // Clamp
  }
  
  pause(): void {
    this.isPaused = true;
    this.pausedTime = performance.now();
  }
  
  resume(): void {
    if (this.isPaused) {
      const pauseDuration = performance.now() - this.pausedTime;
      this.startTime += pauseDuration; // Adjust start time
      this.isPaused = false;
      
      // Restart animation loop
      if (this.rafId === null) {
        // Recreate animation loop...
      }
    }
  }
}
```

---

#### 3. Calculate Delay

```typescript
// src/lib/timingUtils.ts
export const GATE_PROPAGATION_DELAYS = {
  NOT: 5,
  BUFFER: 8,
  NAND: 10,
  NOR: 10,
  AND: 15,
  OR: 15,
  XOR: 22,
  XNOR: 22
} as const;

export function calculateDelay(
  gateType: GateType,
  mode: SimulationModeType,
  config: SimulationModeConfig
): number {
  switch (mode) {
    case SimulationModeType.INSTANT:
      return 0;
    
    case SimulationModeType.SMOOTH:
      return config.smoothModeDelay * config.speed;
    
    case SimulationModeType.REALISTIC:
      const delayNs = GATE_PROPAGATION_DELAYS[gateType] || 0;
      const delayMs = delayNs * config.realisticScaleFactor / 1_000_000;
      return delayMs * config.speed;
    
    default:
      return 0;
  }
}
```

---

#### 4. React Hook for Animation

```typescript
// src/hooks/useAnimation.ts
export function useAnimation(isPlaying: boolean, speed: number) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }
    
    startTimeRef.current = performance.now();
    
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTimeRef.current) * speed;
      setElapsedTime(elapsed);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPlaying, speed]);
  
  return elapsedTime;
}

// Usage in component:
function SimulationCanvas({ config }: Props) {
  const elapsed = useAnimation(config.isPlaying, config.speed);
  
  useEffect(() => {
    // Process events up to elapsed time
    const events = scheduler.processEvents(elapsed);
    events.forEach(event => {
      animateComponent(event);
    });
  }, [elapsed]);
  
  // ...
}
```

---

#### 5. TruthTablePanel Component

```typescript
// src/components/TruthTablePanel/TruthTablePanel.tsx
export function TruthTablePanel({
  gate,
  currentInputs,
  isVisible,
  onVisibilityChange,
  preferences = DEFAULT_PREFERENCES
}: TruthTablePanelProps) {
  const truthTable = useMemo(() => generateTruthTable(gate), [gate]);
  const updatedTable = useMemo(
    () => updateCurrentState(truthTable, currentInputs),
    [truthTable, currentInputs]
  );
  
  const currentRowRef = useRef<HTMLTableRowElement | null>(null);
  
  // Auto-scroll to current row
  useEffect(() => {
    if (preferences.autoScroll && currentRowRef.current) {
      currentRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentInputs, preferences.autoScroll]);
  
  if (!isVisible) return null;
  
  return (
    <div className="truth-table-panel" role="region" aria-label={`Truth table for ${gate.type}`}>
      <table>
        <thead>
          <tr>
            {updatedTable.inputPins.map(pin => (
              <th key={pin} scope="col">{pin}</th>
            ))}
            <th scope="col">{updatedTable.outputPin}</th>
          </tr>
        </thead>
        <tbody>
          {updatedTable.rows.map(row => (
            <tr
              key={row.id}
              ref={row.isCurrent ? currentRowRef : null}
              className={row.isCurrent ? 'current-row' : ''}
              aria-current={row.isCurrent ? 'true' : undefined}
            >
              {updatedTable.inputPins.map(pin => (
                <td key={pin}>
                  {formatLogicLevel(row.inputs[pin], preferences.displayFormat)}
                </td>
              ))}
              <td>{formatLogicLevel(row.output, preferences.displayFormat)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

### Testing Examples

#### Unit Test (Mathematical Utilities)

```typescript
// tests/unit/truthTableUtils.test.ts
describe('generateInputCombinations', () => {
  it('generates 2^n combinations for n inputs', () => {
    expect(generateInputCombinations(0)).toHaveLength(1);  // 2^0 = 1
    expect(generateInputCombinations(1)).toHaveLength(2);  // 2^1 = 2
    expect(generateInputCombinations(3)).toHaveLength(8);  // 2^3 = 8
    expect(generateInputCombinations(6)).toHaveLength(64); // 2^6 = 64
  });
  
  it('covers all binary combinations without duplicates', () => {
    const combos = generateInputCombinations(3);
    const stringified = combos.map(c => c.map(b => b ? '1' : '0').join(''));
    
    expect(new Set(stringified).size).toBe(8); // All unique
    expect(stringified.sort()).toEqual(['000', '001', '010', '011', '100', '101', '110', '111']);
  });
  
  it('maintains correct bit order (MSB first)', () => {
    const combos = generateInputCombinations(2);
    expect(combos[0]).toEqual([false, false]); // 00
    expect(combos[1]).toEqual([false, true]);  // 01
    expect(combos[2]).toEqual([true, false]);  // 10
    expect(combos[3]).toEqual([true, true]);   // 11
  });
});
```

---

#### E2E Test (User Scenario)

```typescript
// tests/e2e/truthTable.spec.ts
import { test, expect } from '@playwright/test';

test('User Story 1, Scenario 1: Enable truth table for gate', async ({ page }) => {
  await page.goto('/');
  
  // Place an AND gate on canvas
  await page.click('[data-testid="component-palette-and-gate"]');
  await page.click('[data-testid="canvas"]', { position: { x: 200, y: 200 } });
  
  // Open gate configuration
  await page.click('[data-testid="gate-and-1"]', { button: 'right' });
  await page.click('[data-testid="menu-configure"]');
  
  // Enable truth table
  await page.check('[data-testid="enable-truth-table"]');
  await page.click('[data-testid="dialog-save"]');
  
  // Verify truth table is displayed
  const truthTable = page.locator('[data-testid="truth-table-gate-and-1"]');
  await expect(truthTable).toBeVisible();
  
  // Verify columns match pin names
  await expect(truthTable.locator('th:has-text("A")')).toBeVisible();
  await expect(truthTable.locator('th:has-text("B")')).toBeVisible();
  await expect(truthTable.locator('th:has-text("Y")')).toBeVisible();
  
  // Verify 4 rows for 2 inputs
  const rows = truthTable.locator('tbody tr');
  await expect(rows).toHaveCount(4);
});

test('User Story 2, Scenario 1: Enable smooth slow-motion mode', async ({ page }) => {
  await page.goto('/');
  
  // Build simple circuit (switch -> inverter -> light)
  // ... (setup code)
  
  // Enable smooth slow-motion
  await page.click('[data-testid="simulation-mode-select"]');
  await page.click('[data-testid="mode-smooth"]');
  
  // Start simulation
  await page.click('[data-testid="play-button"]');
  
  // Toggle switch
  const startTime = Date.now();
  await page.click('[data-testid="switch-1"]');
  
  // Wait for signal to propagate (should be slow, >400ms)
  await page.waitForSelector('[data-wire-state="HIGH"]', { timeout: 2000 });
  const duration = Date.now() - startTime;
  
  expect(duration).toBeGreaterThan(400); // Visible delay
  expect(duration).toBeLessThan(1500);   // Not too slow
});
```

---

## Common Pitfalls

### ❌ Don't: Mix logical state with animation state

```typescript
// BAD: Animation directly modifies circuit state
function animateWire(wireId: string) {
  wire.state = LogicLevel.TRANSITIONING; // No such state!
  setTimeout(() => {
    wire.state = LogicLevel.HIGH;
  }, 500);
}
```

### ✅ Do: Separate logic from animation

```typescript
// GOOD: Logic updates instantly, animation renders separately
function propagateSignal(wireId: string, newLevel: LogicLevel) {
  // Update logic immediately
  circuit.setWireLevel(wireId, newLevel);
  
  // Queue visual animation
  scheduler.scheduleEvent({
    targetId: wireId,
    newLevel,
    animationDuration: calculateDelay(...)
  });
}
```

---

### ❌ Don't: Hardcode delays

```typescript
// BAD: Magic number
setTimeout(() => updateGate(), 500);
```

### ✅ Do: Use configuration and calculations

```typescript
// GOOD: Calculated from gate type and mode
const delay = calculateDelay(gate.type, config.mode, config);
scheduler.scheduleEvent({ scheduledTime: now + delay, ... });
```

---

### ❌ Don't: Mutate truth table rows

```typescript
// BAD: Mutation
truthTable.rows[2].isCurrent = true;
```

### ✅ Do: Immutable updates

```typescript
// GOOD: New array, new object
const updatedTable = {
  ...truthTable,
  rows: truthTable.rows.map((row, i) =>
    i === 2 ? { ...row, isCurrent: true } : { ...row, isCurrent: false }
  )
};
```

---

## Performance Checklist

- [ ] Truth table generation memoized (React.useMemo)
- [ ] Canvas rendering batched (redraw once per frame, not per event)
- [ ] Virtual scrolling for >64 rows
- [ ] requestAnimationFrame used (not setTimeout/setInterval)
- [ ] Component re-renders minimized (React.memo on pure components)
- [ ] Event queue sorted once on insert (not on every read)
- [ ] No memory leaks (cancel rAF in useEffect cleanup)
- [ ] Profiled with Chrome DevTools (<16.67ms frame time)

---

## Acceptance Checklist

### User Story 1: Truth Table

- [ ] Scenario 1: Truth table displays with pin columns ✅
- [ ] Scenario 2: All input combinations shown ✅
- [ ] Scenario 3: Outputs reflect gate logic ✅
- [ ] Scenario 4: Column headers use actual pin names ✅
- [ ] Scenario 5: Truth table can be toggled off ✅

### User Story 2: Smooth Simulation

- [ ] Scenario 1: Signal propagation visually animated ✅
- [ ] Scenario 2: Timing is consistent and predictable ✅
- [ ] Scenario 3: Multiple signals move at same speed ✅
- [ ] Scenario 4: Speed adjustment works ✅
- [ ] Scenario 5: Data flow clearly traceable ✅

### User Story 3: Realistic Simulation

- [ ] Scenario 1: Different gates have different delays ✅
- [ ] Scenario 2: Timing differences create glitches ✅
- [ ] Scenario 3: Transient glitches visible ✅
- [ ] Scenario 4: Delays consistent with gate types ✅
- [ ] Scenario 5: Difference from smooth mode clear ✅

---

## Resources

- **Research**: [research.md](../research.md) - Detailed technical decisions
- **Data Models**: [data-model.md](../data-model.md) - Entity structures
- **API Contracts**: [contracts/api-contracts.md](../contracts/api-contracts.md) - Service interfaces
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md) - Development principles

---

## Getting Help

- **Unclear requirements**: Review feature spec.md and research.md
- **Math questions**: All formulas documented in data-model.md
- **API questions**: Check contracts/api-contracts.md for signatures
- **Constitutional compliance**: Verify against 5 principles in constitution.md
- **Testing patterns**: See examples in this guide + existing test files

---

**Ready to code?** Start with Phase 1, Task 1: Create data models. Good luck! 🚀
