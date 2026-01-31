# Implementation Plan: Wire Logic Level Visualization and Composite ICs

**Branch**: `002-wire-logic-display` | **Date**: 2026-01-31 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-wire-logic-display/spec.md`

## Summary

This feature extends the digital logic circuit simulator with visual wire state indication (blue=0, red=1, grey=Hi-Z) and hierarchical IC composition. Users can create composite ICs from existing circuits, nest them arbitrarily, and debug circuits by viewing internal wire states at each hierarchy level. Interactive components (toggle/momentary push buttons and state-aware lights) enable self-contained testable circuits.

## Technical Context

**Language/Version**: TypeScript 5.0+ (ES2020+ target)  
**Primary Dependencies**: React 18+, Canvas API for wire rendering  
**Storage**: Browser LocalStorage or IndexedDB for composite IC definitions and circuit persistence  
**Testing**: Jest for unit/integration tests, Playwright for E2E UI testing  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)  
**Project Type**: Single-page web application (frontend-only)  
**Performance Goals**: 

- Wire color updates within 100ms of logic state change (per SC-002)
- Visual updates at 60 FPS during simulation (inherited from 001 SC-007)
- Support 1000 wires with real-time color updates (from assumptions)
- Composite IC operations complete within 2 seconds for 50 internal components (SC-006)

**Constraints**: 

- Conflict wire color must use orange with WCAG accessibility considerations
- Support 10 levels of IC nesting without performance degradation (SC-003)
- Real-time continuous simulation (no paused states)
- Circuit evaluation < 100ms for 50 gates (inherited from 001 SC-002)

**Scale/Scope**: 

- Support circuits with up to 1000 wires (from assumptions)
- Composite ICs with up to 50 internal components (SC-006)
- 10 levels of nesting depth (SC-003)
- Multiple simultaneous composite IC definitions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ DEFERRED - Constitution can be established later; proceeding with technology-specific research

**Note**: No architectural violations anticipated. Standard React + TypeScript web app pattern. Will validate against constitution once established.

## Project Structure

### Documentation (this feature)

```text
specs/002-wire-logic-display/
├── plan.md              # This file (active)
├── research.md          # Phase 0 output (pending)
├── data-model.md        # Phase 1 output (pending)
├── quickstart.md        # Phase 1 output (pending)
├── contracts/           # Phase 1 output (pending)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/
│   ├── Wire.ts           # Wire entity with logic state and color
│   ├── CompositeIC.ts    # IC composition and nesting
│   ├── LogicLevel.ts     # 0, 1, Hi-Z states
│   └── PinComponent.ts   # Push buttons and lights
├── services/
│   ├── SimulationEngine.ts      # Logic propagation and state updates
│   ├── WireRenderer.ts          # Real-time wire color visualization
│   ├── CompositeICManager.ts    # IC creation, storage, instantiation
│   └── ConflictDetector.ts      # Multi-source conflict detection
├── components/
│   ├── Canvas/                  # Main circuit editor
│   ├── WireComponent/           # Wire rendering with color states
│   ├── CompositeICEditor/       # IC creation dialog
│   ├── HierarchyNavigator/      # Drill-down UI for nested ICs
│   ├── PushButton/              # Interactive button component
│   └── LightIndicator/          # Output display component
├── contexts/
│   └── SimulationContext.tsx    # React Context for simulation state
└── lib/
    ├── colorSchemes.ts          # Color definitions (blue/red/grey/orange)
    └── nestingValidator.ts      # 10-level depth warning

tests/
├── contract/
│   ├── wire-color-api.test.ts
│   └── composite-ic-api.test.ts
├── integration/
│   ├── wire-propagation.test.ts
│   ├── ic-nesting.test.ts
│   └── hierarchy-navigation.test.ts
└── unit/
    ├── Wire.test.ts
    ├── CompositeIC.test.ts
    ├── PinComponent.test.ts
    └── ConflictDetector.test.ts
```

**Structure Decision**: Single frontend web application with model-service-component architecture. Models represent domain entities (Wire, CompositeIC, LogicLevel), services handle business logic (simulation, rendering, IC management), and components provide UI. This extends the existing 001-logic-circuit-simulator structure.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*No violations identified yet - constitution not established. Will update after constitution definition and design phase.*

---

## Phase 0: Research & Technology Clarification

**Status**: ✅ COMPLETE

### Technology Stack Decisions

**Confirmed Stack:**

- **Language**: TypeScript 5.0+ (ES2020+ target)
- **UI Framework**: React 18+ with hooks
- **Rendering**: HTML5 Canvas API (2D context) - will test performance
- **Testing**: Jest (unit/integration) + Playwright (E2E)
- **State Management**: React Context API (evaluate Redux/Zustand if needed)

### Technology Rationale

**Canvas API Selection**: Chosen for wire rendering to enable:

- Direct pixel manipulation for 1000+ wires
- Smooth 60 FPS color transitions
- Efficient redraw of only changed wire segments
- Potential WebGL upgrade path if performance issues arise

### Research Tasks (After Technology Confirmation)

Once technology stack is confirmed, research will cover:

- **Wire Color Rendering**: Best practices for real-time color updates in chosen rendering technology
- **Performance Patterns**: Efficient state propagation for 1000-wire circuits
- **Composite IC Storage**: IndexedDB vs LocalStorage tradeoffs for IC persistence
- **Nesting Strategies**: Techniques for 10-level hierarchy traversal and visualization
- **Accessibility**: WCAG-compliant color schemes for wire states (esp. orange conflict color)
- **Conflict Detection**: Algorithms for multi-source wire conflict identification
- **Interactive Components**: Best practices for button/light component integration

**Output**: `research.md` with technology decisions, patterns, and alternatives considered

---

## Phase 1: Design & Contracts

**Status**: ⏳ PENDING Phase 0 completion

Will generate:

- `data-model.md`: Wire, CompositeIC, LogicLevel, PinComponent, InverterSymbol entities
- `contracts/`: API contracts for wire color updates, IC operations, hierarchy navigation
- `quickstart.md`: Integration test scenarios for wire visualization and IC composition
- Agent context update: Add confirmed technologies to agent files

---

## Phase 2: Task Decomposition

**Status**: ⏳ PENDING Phase 1 completion

Handled by separate `/speckit.tasks` command after design artifacts are complete.

---

## Next Actions

**Phase 0**: ✅ Complete - See research.md
**Phase 1**: 🚀 In Progress - Generating data model and contracts
**Phase 2**: ⏳ Pending - Run `/speckit.tasks` after Phase 1 complete
