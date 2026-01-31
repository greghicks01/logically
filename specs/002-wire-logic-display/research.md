# Research: Wire Logic Level Visualization and Composite ICs

**Feature**: 002-wire-logic-display  
**Date**: 2026-01-31  
**Tech Stack**: TypeScript 5.0+, React 18+, Canvas API, Jest, Playwright

## Overview

This document captures technology research and design decisions for implementing wire color visualization and composite IC features in a TypeScript/React circuit simulator using Canvas API.

## Technology Decisions

### 1. Wire Color Rendering with Canvas API

**Decision**: Use HTML5 Canvas 2D context with optimized redraw strategies

**Rationale**:
- Canvas provides direct pixel manipulation for 1000+ wires
- Supports smooth color transitions at 60 FPS (16ms frame budget)
- Lower memory overhead than SVG DOM for large wire counts
- Can leverage `requestAnimationFrame` for efficient updates
- Potential WebGL upgrade path if needed

**Implementation Pattern**:
```typescript
// Efficient wire rendering with dirty rectangle tracking
class WireRenderer {
  private ctx: CanvasRenderingContext2D;
  private dirtyRegions: Set<WireSegment> = new Set();
  
  updateWireColor(wire: Wire, newState: LogicLevel) {
    // Mark only changed wire segments as dirty
    this.dirtyRegions.add(wire.segment);
    // Batch updates using requestAnimationFrame
    requestAnimationFrame(() => this.render());
  }
  
  render() {
    // Redraw only dirty regions for performance
    this.dirtyRegions.forEach(segment => {
      this.ctx.strokeStyle = getColorForState(segment.state);
      this.ctx.stroke(segment.path);
    });
    this.dirtyRegions.clear();
  }
}
```

**Alternatives Considered**:
- **SVG**: Rejected due to DOM overhead for 1000 wires (performance degradation)
- **WebGL**: Overkill for initial implementation; Canvas 2D sufficient for MVP
- **CSS Transitions**: Cannot handle complex wire routing and dynamic paths

**Performance Strategy**:
- Use offscreen canvas for complex ICs to cache rendered components
- Implement spatial indexing (quadtree) for hover/click detection
- Batch color updates to minimize redraws
- Use `CanvasRenderingContext2D.resetTransform()` for efficient coordinate transforms

---

### 2. React State Management for Circuit Simulation

**Decision**: React Context API with custom hooks for simulation state

**Rationale**:
- Avoids Redux boilerplate for MVP
- Sufficient for managing circuit state and IC definitions
- Easy to upgrade to Zustand/Redux if complexity grows
- Works well with TypeScript for type-safe state access

**Implementation Pattern**:
```typescript
// Circuit context for global simulation state
interface CircuitContextType {
  wires: Map<string, Wire>;
  compositeICs: Map<string, CompositeIC>;
  activeSimulation: boolean;
  updateWireState: (wireId: string, state: LogicLevel) => void;
}

const CircuitContext = createContext<CircuitContextType>(null!);

// Custom hook for wire state management
function useWireState(wireId: string) {
  const { wires, updateWireState } = useContext(CircuitContext);
  const wire = wires.get(wireId);
  
  return {
    state: wire?.logicLevel ?? LogicLevel.HiZ,
    updateState: (newState: LogicLevel) => updateWireState(wireId, newState),
    color: getWireColor(wire?.logicLevel)
  };
}
```

**Alternatives Considered**:
- **Redux**: Too heavy for initial scope; can migrate later if needed
- **Zustand**: Good lightweight option, but Context API sufficient for now
- **Component-local state**: Doesn't scale for 1000-wire circuits with global propagation

---

### 3. Composite IC Storage

**Decision**: IndexedDB with LocalStorage fallback

**Rationale**:
- IndexedDB supports storing complex IC definitions (>5MB limit)
- Asynchronous API won't block UI during save/load
- LocalStorage as fallback for older browsers
- Enables offline-first circuit design workflow

**Implementation Pattern**:
```typescript
class CompositeICStorage {
  private db: IDBDatabase;
  
  async saveIC(ic: CompositeIC): Promise<void> {
    const tx = this.db.transaction('compositeICs', 'readwrite');
    await tx.objectStore('compositeICs').put({
      id: ic.id,
      name: ic.name,
      definition: ic.serialize(),
      timestamp: Date.now()
    });
  }
  
  async loadIC(id: string): Promise<CompositeIC | null> {
    const tx = this.db.transaction('compositeICs', 'readonly');
    const data = await tx.objectStore('compositeICs').get(id);
    return data ? CompositeIC.deserialize(data.definition) : null;
  }
}
```

**Alternatives Considered**:
- **LocalStorage only**: 5-10MB limit too restrictive for complex circuits
- **Server storage**: Out of scope for MVP; local-first is priority
- **File system API**: Requires user permission; worse UX than automatic persistence

---

### 4. Logic Propagation Algorithm

**Decision**: Event-driven propagation with topological sorting

**Rationale**:
- Avoids recalculating entire circuit on each change
- Handles 50+ gates in <100ms (per SC-002 requirement)
- Supports both combinational and sequential logic
- Detects cycles for conflict/oscillation warnings

**Implementation Pattern**:
```typescript
class SimulationEngine {
  private propagationQueue: Wire[] = [];
  
  propagateSignal(sourceWire: Wire, newState: LogicLevel) {
    // Mark wire and dependent gates as dirty
    sourceWire.setState(newState);
    this.enqueueAffectedGates(sourceWire);
    
    // Process queue in topological order
    while (this.propagationQueue.length > 0) {
      const wire = this.propagationQueue.shift()!;
      const outputState = this.evaluateGate(wire.destination);
      
      if (outputState !== wire.state) {
        wire.setState(outputState);
        this.enqueueAffectedGates(wire);
      }
    }
  }
  
  detectConflict(wire: Wire): boolean {
    const drivers = wire.getDrivers();
    if (drivers.length > 1) {
      const states = new Set(drivers.map(d => d.outputState));
      return states.size > 1 && !states.has(LogicLevel.HiZ);
    }
    return false;
  }
}
```

**Alternatives Considered**:
- **Full recalculation**: Too slow for 1000-wire circuits
- **Clock-based simulation**: Overkill; event-driven sufficient for combinational logic
- **Reactive observables**: Added complexity; plain propagation queue works

---

### 5. Composite IC Nesting Strategy

**Decision**: Hierarchical component tree with lazy expansion

**Rationale**:
- Supports 10-level nesting without performance issues
- Only renders visible hierarchy levels (lazy loading)
- Uses immutable data structures to prevent circular references
- Warning at 10 levels prevents infinite nesting

**Implementation Pattern**:
```typescript
interface CompositeIC {
  id: string;
  name: string;
  pins: ICPin[];
  internalCircuit: Circuit;  // Encapsulated circuit
  nestingLevel: number;      // Track depth
}

class CompositeICManager {
  validateNesting(ic: CompositeIC): ValidationResult {
    const depth = this.calculateNestingDepth(ic);
    
    if (depth > 10) {
      return {
        valid: true,
        warning: `IC nested ${depth} levels deep. Performance may degrade beyond 10 levels.`
      };
    }
    
    return { valid: true };
  }
  
  calculateNestingDepth(ic: CompositeIC, visited = new Set()): number {
    if (visited.has(ic.id)) return 0; // Prevent circular
    visited.add(ic.id);
    
    const childDepths = ic.internalCircuit.components
      .filter(c => c instanceof CompositeIC)
      .map(child => this.calculateNestingDepth(child as CompositeIC, visited));
    
    return childDepths.length > 0 ? 1 + Math.max(...childDepths) : 1;
  }
}
```

**Alternatives Considered**:
- **Hard limit at 10**: Too restrictive; warning is better UX
- **Flattened hierarchy**: Loses debugging capability
- **Separate nesting validation**: Integrated check is more efficient

---

### 6. WCAG-Compliant Wire Colors

**Decision**: Use distinct hues with sufficient contrast ratios

**Rationale**:
- Must support users with color vision deficiencies
- Orange conflict color meets WCAG AA contrast (4.5:1 minimum)
- Provide optional high-contrast mode for accessibility

**Color Scheme**:
```typescript
enum LogicLevel {
  LOW = 0,
  HIGH = 1,
  HI_Z = 2,
  CONFLICT = 3
}

const WIRE_COLORS = {
  [LogicLevel.LOW]: '#0066CC',    // Blue (WCAG AA on white)
  [LogicLevel.HIGH]: '#CC0000',   // Red (WCAG AA on white)
  [LogicLevel.HI_Z]: '#808080',   // Grey (WCAG AA on white)
  [LogicLevel.CONFLICT]: '#FF6600' // Orange (WCAG AA on white)
};

// High contrast mode for accessibility
const HIGH_CONTRAST_COLORS = {
  [LogicLevel.LOW]: '#0000FF',
  [LogicLevel.HIGH]: '#FF0000',
  [LogicLevel.HI_Z]: '#404040',
  [LogicLevel.CONFLICT]: '#FF8C00'
};
```

**Accessibility Features**:
- Wire thickness increases on hover for better visibility
- Optional pattern overlays for color-blind users (dots/stripes)
- State labels on hover (e.g., "Logic 0", "Conflict")

**Alternatives Considered**:
- **Pattern-only**: Rejected; color is faster to parse visually
- **Brightness-based**: Insufficient differentiation for 4 states
- **Custom user colors**: Too complex for MVP

---

### 7. Interactive Component Design

**Decision**: React components with Canvas hit detection

**Rationale**:
- Push buttons and lights integrate seamlessly with React
- Canvas handles visual rendering, React handles interaction state
- Supports both toggle and momentary button modes
- Light component clearly differentiates on/off/Hi-Z states

**Implementation Pattern**:
```typescript
interface PushButtonProps {
  id: string;
  type: 'toggle' | 'momentary';
  onStateChange: (state: LogicLevel) => void;
  position: { x: number; y: number };
}

const PushButton: React.FC<PushButtonProps> = ({ id, type, onStateChange, position }) => {
  const [pressed, setPressed] = useState(false);
  
  const handleMouseDown = () => {
    setPressed(true);
    onStateChange(LogicLevel.HIGH);
  };
  
  const handleMouseUp = () => {
    if (type === 'momentary') {
      setPressed(false);
      onStateChange(LogicLevel.LOW);
    } else {
      // Toggle mode: state persists until next click
      setPressed(!pressed);
      onStateChange(pressed ? LogicLevel.LOW : LogicLevel.HIGH);
    }
  };
  
  // Render on canvas at position
  useCanvasRenderer(position, pressed);
  
  return null; // No DOM element, pure canvas rendering
};
```

**Light Component States**:
- Logic 1 (HIGH): Bright/filled circle
- Logic 0 (LOW): Dim/outline circle
- Hi-Z: Dimmed with diagonal stripe pattern (visually distinct)

---

### 8. Testing Strategy

**Decision**: Three-tier testing with Jest and Playwright

**Jest (Unit + Integration)**:
```typescript
// Unit test: Wire state logic
describe('Wire', () => {
  it('should update color when logic level changes', () => {
    const wire = new Wire('w1');
    wire.setState(LogicLevel.HIGH);
    expect(wire.color).toBe(WIRE_COLORS[LogicLevel.HIGH]);
  });
  
  it('should detect multi-source conflicts', () => {
    const wire = new Wire('w1');
    wire.addDriver({ outputState: LogicLevel.HIGH });
    wire.addDriver({ outputState: LogicLevel.LOW });
    expect(wire.hasConflict()).toBe(true);
  });
});

// Integration test: Simulation propagation
describe('SimulationEngine', () => {
  it('should propagate signal through 10 gates in <100ms', () => {
    const circuit = createChainOfGates(10);
    const start = performance.now();
    
    circuit.setInput('in1', LogicLevel.HIGH);
    engine.propagate(circuit);
    
    expect(performance.now() - start).toBeLessThan(100);
    expect(circuit.getOutput('out10')).toBe(LogicLevel.HIGH);
  });
});
```

**Playwright (E2E)**:
```typescript
// E2E test: Wire color visualization
test('wire changes color when logic state changes', async ({ page }) => {
  await page.goto('/simulator');
  
  // Place power source and wire
  await page.click('[data-component="power-high"]');
  await page.click('#canvas', { position: { x: 100, y: 100 } });
  
  // Verify wire is red (HIGH)
  const wireColor = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const pixel = ctx.getImageData(150, 100, 1, 1).data;
    return `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
  });
  
  expect(wireColor).toBe('rgb(204, 0, 0)'); // Red for HIGH
});
```

**Test Coverage Goals**:
- Unit tests: >90% coverage for models and services
- Integration tests: All user stories tested independently
- E2E tests: Critical paths (wire color, IC creation, nesting)

---

## Key Technical Risks

### 1. Canvas Performance with 1000 Wires
**Risk**: Redrawing all wires on every state change may cause frame drops

**Mitigation**:
- Implement dirty rectangle tracking (only redraw changed regions)
- Use offscreen canvas for complex composite ICs
- Profile with Chrome DevTools to identify bottlenecks
- Have WebGL fallback ready if Canvas 2D insufficient

**Acceptance**: If 60 FPS cannot be maintained, reduce wire count limit or implement progressive rendering

---

### 2. Nesting Depth Performance
**Risk**: 10-level IC nesting may cause stack overflow or slow propagation

**Mitigation**:
- Iterative (not recursive) nesting depth calculation
- Lazy rendering of nested ICs (only expand when viewed)
- Flatten internal circuits during propagation for performance

**Acceptance**: Warning at 10 levels is sufficient; users can proceed at own risk

---

### 3. IndexedDB Browser Compatibility
**Risk**: Older browsers may not support IndexedDB fully

**Mitigation**:
- LocalStorage fallback for simple IC definitions
- Feature detection on app load
- Clear error messages if storage unavailable
- Export/import IC definitions as JSON files

**Acceptance**: Works in Chrome/Firefox/Safari 90+; graceful degradation for older browsers

---

## Performance Benchmarks

### Target Metrics (from Success Criteria)
- Wire color update: < 100ms (SC-002)
- Visual frame rate: 60 FPS (inherited from 001)
- Circuit evaluation: < 100ms for 50 gates
- IC operations: < 2s for 50 internal components (SC-006)

### Testing Plan
1. Create test circuit with 1000 wires
2. Measure frame time during continuous state changes
3. Profile with Chrome DevTools Performance panel
4. Verify memory usage stays < 200MB for complex circuits

---

## Dependencies

### NPM Packages
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0"
  }
}
```

### Browser APIs Used
- Canvas 2D Context API
- IndexedDB API
- LocalStorage API (fallback)
- requestAnimationFrame

---

## Summary

**Technology Stack Validated**: TypeScript + React + Canvas is appropriate for this feature

**Key Patterns**:
- Dirty rectangle rendering for Canvas performance
- Event-driven logic propagation
- React Context for state management
- IndexedDB for persistent storage
- Hierarchical IC tree with lazy rendering

**Risks Identified**: Canvas performance, nesting depth, browser compatibility

**Mitigations in Place**: Optimized rendering, iterative algorithms, storage fallbacks

**Ready for Phase 1**: Design artifacts (data model, contracts, quickstart)
