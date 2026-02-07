# Implementation Plan: Educational Simulation Features

**Branch**: `001-educational-simulation` | **Date**: 2026-02-07 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-educational-simulation/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement three educational features for the logic circuit simulator: (1) truth table visualization for individual gates to help users understand gate behavior, (2) smooth slow-motion simulation mode for visual learning with consistent timing, and (3) realistic propagation delay simulation to demonstrate real-world circuit behavior including glitches and timing hazards. These features transform the simulator into a comprehensive educational tool while maintaining the existing mathematical foundation and separation of concerns.

## Technical Context

**Language/Version**: TypeScript 5.2+ (ES2020 target)  
**Primary Dependencies**: React 18.2, Vite 5.0 (build), Playwright 1.58 (testing)  
**Storage**: Browser memory (in-memory circuit state, no persistence required for this feature)  
**Testing**: Jest 29.7 (unit tests), Playwright 1.40 (e2e), React Testing Library 14.0  
**Target Platform**: Modern web browsers (Chrome, Firefox, Safari/WebKit) via Vite bundler  
**Project Type**: Single web application (TypeScript/React SPA)  
**Performance Goals**: <100ms UI response, 60 fps canvas rendering, smooth animations at configurable speeds (0.1x-10x)  
**Constraints**: Must maintain <100ms input lag during slow-motion simulation of circuits with up to 50 gates, truth tables capped at 6 inputs (64 rows) for display performance  
**Scale/Scope**: Educational tool for single-user circuits, typically 10-50 gates per circuit, focus on visual clarity over massive scale

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Mathematical Foundation First
**Status**: ✅ **PASS** (with clarifications needed)

**Analysis**: 
- Truth table generation is well-defined mathematically: 2^n combinations for n inputs
- Smooth simulation timing can be expressed as uniform time steps: t_next = t_current + Δt
- Realistic propagation requires gate-specific delay functions: t_output = t_input + delay(gate_type)
- **NEEDS CLARIFICATION**: Specific delay values for each gate type (suggest TTL/CMOS standard timings)
- Animation interpolation follows linear parametric equations: position(t) = start + t * (end - start)

**Requirements Met**:
- Mathematical models can be documented before implementation
- Invariants: truth table rows = 2^inputs, animation t ∈ [0,1]
- Edge cases identified: max input count, feedback loops in simulation

### II. Separation of Logical and Physical Concerns
**Status**: ✅ **PASS**

**Analysis**:
- Truth tables are logical representations (input combinations → outputs) computed from gate logic
- Timing models are logical (delays, propagation order) separate from visual animation
- Physical rendering (table UI, wire animations) will consume logical state without modifying it
- Consistent with existing parametric pin positioning architecture

**Requirements Met**:
- Truth table data structure separate from display component
- Simulation state (logical timing) separate from animation rendering (visual timing)
- No hardcoded positions in models

### III. Test Mathematical Functions, Not Just Features
**Status**: ✅ **PASS**

**Analysis**:
- Core utilities testable in isolation:
  - Truth table generation: generateTruthTable(inputCount) → rows[]
  - Delay calculation: calculatePropagationDelay(gateType) → number
  - Animation interpolation: interpolatePosition(start, end, t) → position
- Numerical precision important for timing calculations
- Integration tests verify composed simulation behavior

**Requirements Met**:
- Follows existing pattern (65 parametric positioning tests)
- Mathematical utilities tested before UI integration
- Edge cases covered (zero gates, single element, boundary timing)

### IV. Single Source of Truth
**Status**: ✅ **PASS**

**Analysis**:
- Truth table logic defined once per gate type (from existing gate logic)
- Propagation delay values defined in single configuration/constants file
- Animation timing controlled by single simulation clock
- No duplication of logic across components

**Requirements Met**:
- Gate logic already centralized (existing models)
- Will create single timing configuration source
- Shared animation utilities prevent duplication

### V. Backward Compatibility During Migration
**Status**: ✅ **PASS**

**Analysis**:
- New features are additions, not replacements
- Existing simulation engine continues to work without slow-motion enabled
- Truth tables are optional overlays, don't modify gate behavior
- Can enable features incrementally per gate

**Requirements Met**:
- Additive design - new simulation modes alongside existing instant simulation
- Optional features don't break existing functionality
- Gradual adoption possible

### Overall Gate Status: ✅ **PROCEED TO PHASE 0**

All constitutional principles aligned. Primary clarification needed: gate-specific delay values for realistic mode.

## Project Structure

### Documentation (this feature)

```text
specs/001-educational-simulation/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (to be generated)
├── data-model.md        # Phase 1 output (to be generated)
├── quickstart.md        # Phase 1 output (to be generated)
├── contracts/           # Phase 1 output (to be generated)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── models/                          # Existing - logical entities
│   ├── Circuit.ts                   # [EXISTING] Circuit state manager
│   ├── [Gate].ts                    # [EXISTING] Gate implementations (AND, OR, etc.)
│   ├── LogicLevel.ts                # [EXISTING] Binary logic representation
│   ├── TruthTable.ts                # [NEW] Truth table data structure
│   ├── SimulationMode.ts            # [NEW] Simulation mode types
│   └── PropagationEvent.ts          # [NEW] Timing event representation
│
├── services/                        # Existing - business logic
│   ├── SimulationEngine.ts          # [EXTEND] Add time-aware simulation
│   ├── TruthTableGenerator.ts       # [NEW] Generate truth tables from gate logic
│   ├── PropagationScheduler.ts      # [NEW] Manage timing events
│   └── AnimationController.ts       # [NEW] Control slow-motion playback
│
├── components/                      # Existing - React UI components
│   ├── Canvas/                      # [EXTEND] Add animation rendering
│   ├── TruthTablePanel/             # [NEW] Truth table display component
│   │   ├── TruthTablePanel.tsx
│   │   └── TruthTablePanel.test.tsx
│   ├── SimulationControls/          # [NEW] Playback controls component
│   │   ├── SimulationControls.tsx
│   │   └── SimulationControls.test.tsx
│   └── [Existing gates]/            # [EXTEND] Add truth table enable option
│
├── lib/                             # Existing - utilities
│   ├── truthTableUtils.ts           # [NEW] Truth table mathematical utilities
│   ├── timingUtils.ts               # [NEW] Propagation delay calculations
│   └── animationUtils.ts            # [NEW] Interpolation and timing functions
│
└── contexts/                        # Existing - React contexts
    └── SimulationContext.tsx        # [EXTEND] Add simulation mode state

tests/
├── unit/                            # Existing - Jest unit tests
│   ├── truthTableUtils.test.ts      # [NEW] Truth table generation tests
│   ├── timingUtils.test.ts          # [NEW] Delay calculation tests
│   └── animationUtils.test.ts       # [NEW] Interpolation tests
│
├── integration/                     # [NEW DIRECTORY] Component integration tests
│   ├── truthTable.test.tsx          # Truth table + gate integration
│   └── slowMotion.test.tsx          # Simulation mode integration
│
└── e2e/                             # Existing - Playwright tests
    ├── truthTable.spec.ts           # [NEW] Truth table user scenarios
    ├── smoothSimulation.spec.ts     # [NEW] Smooth mode scenarios
    └── realisticSimulation.spec.ts  # [NEW] Realistic mode scenarios
```

**Structure Decision**: Single web application structure maintained. New features integrate into existing `src/` layout following established patterns: models for data structures, services for logic, components for UI, lib for mathematical utilities. This preserves the mathematical foundation principle - utilities in `lib/` are pure, testable functions that underpin higher-level services and components.

## Complexity Tracking

> **Status: NOT REQUIRED** - All Constitutional principles pass without violations that need justification.

---

## Post-Design Constitution Check

*Re-evaluation after Phase 1 design (research, data model, contracts, quickstart completed)*

### I. Mathematical Foundation First
**Status**: ✅ **PASS** *(Improved from Phase 0)*

**Analysis**:
- ✅ **Research complete**: All mathematical models documented with formulas
  - Truth table: 2^n rows algorithm defined in data-model.md
  - Gate delays: TTL 74LS-series values researched and specified in GATE_PROPAGATION_DELAYS
  - Animation interpolation: Linear parametric equations documented
  - Delay calculations: Smooth mode (uniform Δt), Realistic mode (gate-specific × scale factor)
- ✅ **Clarifications resolved**: Gate delay values confirmed from datasheets
- ✅ **Invariants identified**: All documented in data-model.md validation rules
- ✅ **Edge cases covered**: Max inputs, feedback loops, simultaneous events, boundary values

**Validation**: All mathematical functions have unit test specifications in quickstart.md. Formulas will be documented in code comments as required.

### II. Separation of Logical and Physical Concerns
**Status**: ✅ **PASS** *(Validated)*

**Analysis**:
- ✅ **Logical models pure**: TruthTable, SimulationMode, PropagationEvent contain no rendering code
- ✅ **Physical rendering isolated**: AnimationState, TruthTablePanel consume logical state read-only
- ✅ **Service layer clean**: TruthTableGenerator, PropagationScheduler, AnimationController separate concerns
- ✅ **API contracts enforce separation**: Services return data, components handle display

**Validation**: Data model (Section: Core Entities) defines logical structures. API contracts (Section: React Component Props) define UI consumption. No mixing detected.

### III. Test Mathematical Functions, Not Just Features
**Status**: ✅ **PASS** *(Test strategy defined)*

**Analysis**:
- ✅ **Utilities identified**: truthTableUtils, timingUtils, animationUtils in lib/
- ✅ **Unit tests specified**: All utilities have test files with edge cases documented
- ✅ **Mathematical precision**: Numerical testing with toBeCloseTo() for floating point
- ✅ **Integration tests separate**: Component tests in integration/, utilities in unit/

**Validation**: Quickstart.md specifies 100% coverage target for lib/ utilities. Test examples provided show mathematical correctness verification (2^n rows, delay formulas, interpolation).

### IV. Single Source of Truth
**Status**: ✅ **PASS** *(Enforced by design)*

**Analysis**:
- ✅ **Gate logic**: Existing gate.evaluateOutput() (already centralized)
- ✅ **Delay configuration**: GATE_PROPAGATION_DELAYS constant (single source)
- ✅ **Truth table generation**: generateTruthTable() service (no duplication)
- ✅ **Animation timing**: AnimationController (single clock)
- ✅ **No copy-paste**: All shared calculations in reusable functions (timingUtils, animationUtils)

**Validation**: API contracts document authoritative functions. Quickstart anti-patterns section explicitly warns against duplication.

### V. Backward Compatibility During Migration
**Status**: ✅ **PASS** *(Additive design confirmed)*

**Analysis**:
- ✅ **Coexistence**: New simulation modes alongside existing instant mode
- ✅ **No breaking changes**: Truth tables optional, gates work without them
- ✅ **Incremental adoption**: Features can be enabled per-gate
- ✅ **Graceful degradation**: Instant mode unchanged if slow-motion disabled

**Validation**: Quickstart.md Phase 1 deliverables show existing functionality preserved. SimulationModeType.INSTANT maintains current behavior.

---

### Overall Post-Design Gate Status: ✅ **APPROVED FOR IMPLEMENTATION**

**Summary**: 
All constitutional principles fully satisfied after design phase. Research resolved all clarifications. Data model enforces separation of concerns. API contracts ensure single source of truth. Implementation plan maintains backward compatibility. Mathematical foundations documented with formulas, invariants, and edge cases. Testing strategy validates utilities before features.

**No violations or complexities requiring justification.**

**Ready to proceed to Phase 2** (/speckit.tasks) for task breakdown and implementation.

---

## Artifacts Generated

**Phase 0 - Research** ✅:
- [research.md](research.md) - Technical decisions, gate delays, UI patterns, testing strategy

**Phase 1 - Design** ✅:
- [data-model.md](data-model.md) - Core entities, validation rules, mathematical models
- [contracts/api-contracts.md](contracts/api-contracts.md) - Service APIs, component props, error handling
- [quickstart.md](quickstart.md) - Developer guide, code snippets, implementation phases
- [.github/agents/copilot-instructions.md](../../.github/agents/copilot-instructions.md) - Updated with TypeScript + React stack

**Next**: Run `/speckit.tasks` to generate [tasks.md](tasks.md) with detailed implementation checklist.
