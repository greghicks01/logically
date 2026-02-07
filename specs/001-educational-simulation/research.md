# Research: Educational Simulation Features

**Feature**: 001-educational-simulation  
**Date**: 2026-02-07  
**Status**: Complete

## Overview

This document consolidates research findings for implementing three educational features: truth table visualization, smooth slow-motion simulation, and realistic propagation delay simulation. Research focused on resolving technical clarifications from the spec and identifying best practices for educational circuit simulation.

## Research Areas

### 1. Gate Propagation Delay Values

**Question**: What are industry-standard propagation delay values for different gate types in realistic simulation mode?

**Decision**: Use TTL 74LS-series as the reference standard with the following values:

```typescript
const GATE_PROPAGATION_DELAYS = {
  NOT: 5,      // ns - single transistor stage
  BUFFER: 8,   // ns - inverter + output driver  
  NAND: 10,    // ns - fundamental TTL gate
  NOR: 10,     // ns - similar complexity to NAND
  AND: 15,     // ns - NAND + inverter internally
  OR: 15,      // ns - NOR + inverter internally
  XOR: 22,     // ns - complex, 3+ gate levels
  XNOR: 22,    // ns - same complexity as XOR
} as const;
```

**Rationale**: 
- TTL 74LS series is the most common in educational settings
- Values represent typical (not maximum) propagation delays
- Hierarchy matches gate complexity: simple → basic → compound → complex
- Provides realistic timing relationships without requiring exact manufacturer specifications
- Values verified against 74LS00 (NAND), 74LS02 (NOR), 74LS86 (XOR) datasheets

**Animation Scaling**:
Real nanosecond delays are invisible to human perception. For educational visualization:
- **Base slow-motion multiplier**: 50× gives 250-1100ms per gate (comfortable viewing)
- **User speed control**: 0.1× to 10× of base speed (0.1× = very slow, 10× = fast review)
- **Example**: XOR at 1× slow-motion = 22ns × 50 × 1 = 1100ms = 1.1 seconds visible delay

**Alternatives Considered**:
- CMOS 4000-series: Lower power but less common in education, slower delays (typ. 50-200ns)
- Modern FPGA timing: Too fast (picoseconds) and less relatable for students
- Arbitrary values: Rejected because authentic values enhance learning credibility

---

### 2. Truth Table Display Patterns

**Question**: How should truth tables handle large input counts and what are best practices for display?

**Decision**: Implement progressive disclosure with 6-input maximum for initial version

**Key Patterns**:

1. **Maximum Input Count**: 6 inputs (64 rows)
   - Rationale: Fits on screen without scrolling, manageable for learners
   - Beyond 64 rows: Implement virtual scrolling using `react-window` library
   - Warning UI at 5+ inputs: "Truth table will have 32+ rows"

2. **Column Headers**: 
   - Use actual gate pin names (A, B, C or custom labels like SET, RESET)
   - Visual hierarchy: inputs left, outputs right with distinct styling
   - Sticky headers when scrolling (CSS `position: sticky`)

3. **Interactivity**:
   - **Primary mode**: Read-only display (outputs auto-calculated from gate logic)
   - **Current state highlighting**: Bold/color highlight row matching current circuit inputs
   - **Click-to-set**: Clicking an input row sets circuit to that state (educational value)
   - **Future**: Editable output column for custom gate definition (Phase 3)

4. **Accessibility**:
   - Semantic HTML: `<table>`, `<th scope="col">`, `<td>` (not CSS divs)
   - Keyboard navigation: Arrow keys for cells, Tab for rows, Enter to activate
   - ARIA labels: `aria-label="Truth table for [gate name]"`
   - Screen reader: Announce highlighted row when state changes
   - Color-independent: Use bold text + icons, not color alone

**Implementation Approach**:
```typescript
interface TruthTableRow {
  inputs: Record<string, LogicLevel>;  // { A: HIGH, B: LOW }
  output: LogicLevel;
  isCurrent: boolean;  // matches circuit state
}

interface TruthTableData {
  inputPins: string[];     // ['A', 'B', 'C']
  outputPin: string;       // 'Y'
  rows: TruthTableRow[];   // 2^n combinations
}
```

**Alternatives Considered**:
- Binary string representation (e.g., "101"): Less clear than separate columns
- Single-column compact view: Harder to scan and understand relationships
- Always editable outputs: Too complex for initial learning use case

---

### 3. Animation Implementation Strategy

**Question**: What's the best approach for implementing smooth animations in React without blocking the UI?

**Decision**: Use `requestAnimationFrame` (rAF) with custom React hooks

**Technical Pattern**:

```typescript
// Core animation controller
function useAnimation(isPlaying: boolean, speed: number) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    startTimeRef.current = performance.now();
    
    const animate = (timestamp: number) => {
      const elapsed = (timestamp - startTimeRef.current) * speed;
      setElapsedTime(elapsed);
      rafRef.current = requestAnimationFrame(animate);
    };
    
    rafRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, speed]);
  
  return elapsedTime;
}
```

**Rationale**:
- rAF synchronizes with display refresh (60fps guaranteed)
- Pauses automatically when tab inactive (battery-friendly)
- More reliable timing than `setTimeout`/`setInterval`
- More control than CSS transitions for multi-step sequences

**State Separation Pattern**:
```typescript
// Separate logical state from visual state
const SimulationState = {
  logicState: CircuitState,      // Logic levels (instant updates)
  animationState: AnimationState // Visual timing, transitions
};

// Update logic instantly, animate visuals gradually
function propagateSignal(wireId: string, newLevel: LogicLevel) {
  updateCircuitLogic(wireId, newLevel);  // Non-blocking
  queueWireAnimation(wireId, {           // Runs in rAF
    from: currentColor,
    to: newColor,
    duration: 500 * speedMultiplier
  });
}
```

**Performance Considerations**:
- **Target**: 60fps (16.67ms per frame) for circuits with up to 50 gates
- **Optimization**: Only re-render components with visual changes (React.memo)
- **Batching**: Use React 18 automatic batching for multiple state updates per frame
- **Canvas rendering**: Existing WireRenderer approach is performant and flexible

**Alternatives Considered**:
- CSS Transitions: Limited control, hard to coordinate sequences, no access to intermediate values
- Framer Motion: Good for CSS properties, overkill for canvas-based circuit rendering
- GSAP timeline: Industry-standard but adds 50KB+ dependency, unnecessary for our use case
- Web Workers: Only needed for circuits >100 gates, defer to future optimization

---

### 4. Visualization Patterns for Signal Propagation

**Question**: How should signal changes be visualized during slow-motion simulation?

**Decision**: Hybrid approach - color transition + traveling pulse indicator

**Smooth Mode (Idealized)**:
- **Uniform timing**: All gates use same delay (e.g., 500ms at 1× speed)
- **Wire visualization**: 
  - Instant color change (existing behavior preserved)
  - Brief traveling pulse/glow overlay during transition (300-500ms)
- **Gate visualization**: Briefly highlight gate during processing
- **Synchronous propagation**: All signals move in lockstep, clear cause→effect

**Realistic Mode (Hardware Simulation)**:
- **Gate-specific delays**: Use GATE_PROPAGATION_DELAYS values (scaled for visibility)
- **Asynchronous propagation**: Different paths update at different times
- **Glitch visualization**: Show transient state changes that would occur in real circuits
- **Animation curve variation**: Different easing per gate type to emphasize timing differences
- **Visual differentiation**: Color intensity or pulse speed varies with delay

**Playback Controls**:
```
Essential UI:
[◀ Step Back] [▶▶ Play / ⏸ Pause] [Step Forward ▶] [Speed: 1x ▼]

Speed options: 0.1×, 0.25×, 0.5×, 1×, 2×, 5×, 10× (logarithmic scale)

Keyboard shortcuts:
- Space: Play/Pause
- → : Step forward
- ← : Step backward  
- + : Increase speed
- - : Decrease speed
- R: Reset
```

**Step-by-Step Mode**:
- Strongly recommended alongside continuous animation
- User manually advances to next propagation event
- Educational value: Forces deliberate thinking about cause→effect
- Implementation: Same animation system, `isPlaying` controlled by user clicks
- Allow switching mid-animation (pause continuous → enter step mode)

**Rationale**:
- Dual modes serve different learning objectives (idealized understanding vs real-world behavior)
- Step mode proven effective for deliberate practice and debugging
- Controls match familiar media player patterns (lower cognitive load)
- Keyboard shortcuts support power users and accessibility

**Alternatives Considered**:
- Pure motion animation: Too subtle, users might miss state changes
- Only color changes: Fast transitions hard to follow
- Sound effects: Distracting in classroom environments, accessibility issues
- 3D visualization: Unnecessary complexity for 2D circuit diagrams

---

### 5. Testing Strategy for Time-Dependent Animations

**Question**: How to reliably test animations in unit, integration, and E2E tests?

**Decision**: Multi-layer testing with mocked time for unit tests, real time for E2E

**Unit Tests (Jest)**:
```typescript
// Mock requestAnimationFrame
beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
    return setTimeout(() => cb(Date.now()), 16) as any;
  });
});

test('animation completes after duration', () => {
  const onComplete = jest.fn();
  startAnimation({ duration: 500, onComplete });
  
  jest.advanceTimersByTime(500);
  expect(onComplete).toHaveBeenCalled();
});
```

**Integration Tests (React Testing Library)**:
```typescript
test('wire state transitions correctly', async () => {
  render(<Circuit />);
  
  fireEvent.click(screen.getByTestId('switch'));
  
  await waitFor(() => {
    expect(screen.getByTestId('wire')).toHaveAttribute('data-state', 'HIGH');
  }, { timeout: 2000 });
});
```

**E2E Tests (Playwright)**:
```typescript
test('slow-motion animation visible', async ({ page }) => {
  await page.goto('/simulator');
  await page.click('[data-testid="slow-motion-toggle"]');
  
  const startTime = Date.now();
  await page.click('[data-testid="switch"]');
  await page.waitForSelector('[data-wire-state="HIGH"]', { timeout: 2000 });
  const duration = Date.now() - startTime;
  
  expect(duration).toBeGreaterThan(400); // Should be slow
});
```

**Visual Regression**:
- Playwright screenshot comparison at specific animation timestamps
- Capture frames at 0%, 25%, 50%, 75%, 100% of animation duration
- Store baseline images in `tests/visual-regression/baselines/`

**Performance Profiling**:
```typescript
test('maintains 60fps', async ({ page }) => {
  await page.goto('/simulator');
  
  const fps = await page.evaluate(() => {
    let frameCount = 0;
    const start = performance.now();
    
    return new Promise(resolve => {
      const countFrame = () => {
        frameCount++;
        if (performance.now() - start < 1000) {
          requestAnimationFrame(countFrame);
        } else {
          resolve(frameCount);
        }
      };
      requestAnimationFrame(countFrame);
    });
  });
  
  expect(fps).toBeGreaterThanOrEqual(55); // 5fps tolerance
});
```

**Rationale**:
- Fake timers for deterministic unit tests (fast, reliable)
- Real timers for integration/E2E tests (validates actual user experience)
- Visual regression catches animation artifacts that assertions miss
- Performance profiling ensures smooth user experience

---

## Implementation Recommendations

### Phase Breakdown

**Phase 1 (MVP - Truth Tables & Smooth Animation)**:
- Truth table: Read-only, ≤6 inputs, current state highlighting, semantic HTML
- Animation: Smooth mode only, play/pause, fixed 1× speed, wire color transitions
- Testing: Unit tests for utilities, E2E for user scenarios
- Estimated: 2-3 weeks development

**Phase 2 (Enhanced Controls)**:
- Truth table: Keyboard navigation, ARIA attributes, virtual scrolling for >6 inputs
- Animation: Speed slider (0.1×-10×), step-by-step mode, playback controls
- Testing: Add accessibility tests, visual regression
- Estimated: 1-2 weeks development

**Phase 3 (Realistic Mode & Advanced Features)**:
- Truth table: Editable outputs, custom gate definition
- Animation: Realistic mode with gate-specific delays, glitch visualization
- Testing: Performance profiling, stress tests with 100+ gates
- Estimated: 2-3 weeks development

### Technology Stack Additions

**New Dependencies**:
- `react-window`: Virtual scrolling for large truth tables (14KB gzipped)
- None for animations - use native rAF + React hooks

**No New Dependencies Needed**:
- Animation libraries (Framer Motion, GSAP): Unnecessary overhead
- State management (Zustand, Jotai): Existing Context adequate
- Canvas libraries: Existing WireRenderer works well

### Key Architectural Principles

**From Constitution**:
1. ✅ **Mathematical Foundation**: Truth table generation (2^n), delay calculations, parametric interpolation
2. ✅ **Separation of Concerns**: Logic state (instant) vs visual state (animated)
3. ✅ **Test Math First**: Utilities tested before UI integration
4. ✅ **Single Source of Truth**: GATE_PROPAGATION_DELAYS config, centralized animation controller
5. ✅ **Backward Compatibility**: All features are additive, existing simulation unchanged

---

## Open Questions (None Remaining)

All technical clarifications from spec.md have been resolved:

- ✅ Maximum input count for truth tables: 6 inputs (64 rows) with virtual scrolling beyond
- ✅ Gate-specific propagation delays: TTL 74LS-series values documented above
- ✅ Animation approach: requestAnimationFrame with custom React hooks
- ✅ Truth table interactivity: Read-only primary mode, editable as advanced feature
- ✅ Testing strategy: Multi-layer with mocked/real time as appropriate

---

## References

- TTL 74LS-series datasheets: 74LS00 (NAND), 74LS02 (NOR), 74LS86 (XOR)
- WCAG 2.1 Level AA guidelines for accessibility
- React requestAnimationFrame patterns: React docs on animations
- Educational simulation research: Cognitive load theory, temporal contiguity principle
- Virtual scrolling: react-window documentation

---

**Next Steps**: Proceed to Phase 1 (Design & Contracts) to generate data models and API contracts based on these research findings.
