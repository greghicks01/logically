# Tasks: Wire Logic Level Visualization and Composite ICs

**Input**: Design documents from `/specs/002-wire-logic-display/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Generated**: 2026-01-31

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

Based on plan.md, this is a single-page web application with TypeScript + React. Paths follow:

- `src/models/` - Domain entities
- `src/services/` - Business logic
- `src/components/` - React UI components
- `src/lib/` - Utility functions
- `tests/` - Test files

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic TypeScript/React structure

- [X] T001 Create project directory structure (src/models, src/services, src/components, src/contexts, src/lib, tests/)
- [X] T002 Initialize TypeScript 5.0+ project with React 18+ dependencies in package.json
- [X] T003 [P] Configure ESLint and Prettier for TypeScript/React code style
- [X] T004 [P] Setup Jest test framework with TypeScript support in jest.config.js
- [X] T005 [P] Configure Playwright for E2E testing in playwright.config.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Create LogicLevel enum in src/models/LogicLevel.ts (LOW=0, HIGH=1, HI_Z=2, CONFLICT=3)
- [X] T007 Create Point interface in src/models/Point.ts for wire path coordinates
- [X] T008 Create PinConnection interface in src/models/PinConnection.ts
- [X] T009 Setup color scheme constants in src/lib/colorSchemes.ts (blue=#0066CC, red=#CC0000, grey=#808080, orange=#FF6600)
- [X] T010 [P] Create base Circuit model in src/models/Circuit.ts with component and wire arrays
- [X] T011 [P] Create OutputPin and InputPin interfaces in src/models/Pin.ts
- [X] T012 Setup React Context for SimulationState in src/contexts/SimulationContext.tsx
- [X] T013 Create base SimulationEngine service skeleton in src/services/SimulationEngine.ts (stub propagate method)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Draw Wires with Visual Logic State (Priority: P1) 🎯 MVP

**Goal**: Enable wire visualization with color-coded logic states (blue=0, red=1, grey=Hi-Z)

**Independent Test**: Create a wire connected to a power source and verify it displays red. Disconnect to see grey. Connect to ground to see blue.

### Implementation for User Story 1

- [X] T014 [P] [US1] Create Wire model in src/models/Wire.ts with id, source, destinations, logicLevel, path, color, drivers properties
- [X] T015 [P] [US1] Create WireStateCalculator utility in src/lib/WireStateCalculator.ts to determine logicLevel from drivers
- [X] T016 [US1] Implement getWireColor function in src/lib/colorSchemes.ts mapping LogicLevel to hex colors
- [X] T017 [US1] Implement createWire method in SimulationEngine (src/services/SimulationEngine.ts)
- [X] T018 [US1] Implement updateWireState method in SimulationEngine to update wire logic level (<100ms per SC-002)
- [X] T019 [US1] Create WireRenderer service in src/services/WireRenderer.ts with Canvas API rendering logic
- [X] T020 [US1] Implement dirty rectangle optimization in WireRenderer for efficient redraw
- [X] T021 [US1] Create WireComponent React component in src/components/WireComponent/WireComponent.tsx
- [X] T022 [US1] Add wire color update logic with requestAnimationFrame for 60 FPS in WireRenderer
- [X] T023 [US1] Implement real-time wire state subscription in WireComponent using SimulationContext
- [X] T024 [US1] Add wire state change event emission in SimulationEngine (wire-state-changed event)
- [X] T025 [US1] Create CanvasCircuitEditor component in src/components/Canvas/CanvasCircuitEditor.tsx integrating WireRenderer

**Checkpoint**: At this point, basic wire visualization should work - wires show correct colors for 0/1/Hi-Z states

---

## Phase 4: User Story 1 (continued) - Conflict Detection

**Goal**: Handle edge case where multiple sources drive conflicting values (orange conflict color)

- [X] T026 [US1] Implement detectWireConflict method in WireStateCalculator checking for multiple non-HiZ drivers with different values
- [X] T027 [US1] Add conflict detection logic to updateWireState in SimulationEngine
- [X] T028 [US1] Create wire-conflict-detected event emission in SimulationEngine
- [X] T029 [US1] Add orange (#FF6600) conflict color rendering in WireComponent
- [X] T030 [US1] Implement bulkUpdateWireStates method in SimulationEngine for performance (100 wires <100ms per SC-002)

**Checkpoint**: Wire visualization complete with conflict detection - User Story 1 fully functional

---

## Phase 5: User Story 2 - Create Composite ICs from Existing Components (Priority: P2)

**Goal**: Enable users to create reusable composite ICs by grouping components and defining pins

**Independent Test**: Create a half-adder from AND/XOR gates, save as composite IC, then use it in a new circuit

### Implementation for User Story 2

- [X] T031 [P] [US2] Create ICPin interface in src/models/ICPin.ts with id, label, direction, hasInverter, connections
- [X] T032 [P] [US2] Create CompositeIC model in src/models/CompositeIC.ts with id, name, inputPins, outputPins, internalCircuit, nestingLevel
- [X] T033 [US2] Create CompositeICManager service in src/services/CompositeICManager.ts
- [X] T034 [US2] Implement createCompositeIC method in CompositeICManager to encapsulate selected components
- [X] T035 [US2] Implement pin mapping logic to connect external pins to internal circuit wires
- [X] T036 [US2] Implement calculateNestingDepth method using iterative algorithm to prevent stack overflow (per research.md)
- [X] T037 [US2] Add nesting level validation with warning at 10 levels (soft limit per FR-011)
- [X] T038 [US2] Create CompositeICEditor React component in src/components/CompositeICEditor/CompositeICEditor.tsx
- [X] T039 [US2] Add pin labeling UI supporting overbar notation (Q̅, EN̅) using Unicode U+0305
- [X] T040 [US2] Implement instantiateCompositeIC method to create instances of composite ICs
- [X] T041 [US2] Add logic propagation through composite IC boundaries in SimulationEngine
- [X] T042 [US2] Ensure internal wire states update correctly when IC is used in circuit
- [X] T043 [US2] Create CompositeICLibrary service in src/services/CompositeICLibrary.ts for managing saved ICs
- [X] T044 [US2] Implement saveCompositeICToStorage using IndexedDB in CompositeICManager
- [X] T045 [US2] Implement loadCompositeICFromStorage with LocalStorage fallback
- [X] T046 [US2] Add IC creation performance optimization to meet SC-006 (<2s for 50 components): lazy component instantiation, pin mapping caching, circuit validation optimization per research.md
- [X] T047 [US2] Create CompositeICComponent React component in src/components/CompositeICComponent/CompositeICComponent.tsx for rendering IC instances

**Checkpoint**: Users can create, save, and reuse composite ICs - User Story 2 independently functional

---

## Phase 6: User Story 3 - Navigate Wire States in Composite IC Hierarchy (Priority: P3)

**Goal**: Enable users to drill down into composite IC internals to view wire states for debugging

**Independent Test**: Create a composite IC with internal wires, place in circuit, click to "expand" and verify internal wire colors are visible

### Implementation for User Story 3

- [X] T048 [P] [US3] Implement viewInternalCircuit method in CompositeICManager to expose internal circuit state
- [X] T049 [P] [US3] Create HierarchyNavigator component in src/components/HierarchyNavigator/HierarchyNavigator.tsx
- [X] T050 [US3] Add breadcrumb navigation UI showing current hierarchy level
- [X] T051 [US3] Implement "zoom into IC" interaction on CompositeICComponent click
- [X] T052 [US3] Create internal circuit view renderer using WireRenderer for nested wires
- [X] T053 [US3] Add real-time wire color updates for internal wires during simulation
- [X] T054 [US3] Implement multi-level hierarchy navigation (navigate through nested ICs)
- [X] T055 [US3] Add performance optimization to meet SC-005 (navigate 3 levels <5s)
- [X] T056 [US3] Create "Return to parent circuit" navigation button
- [X] T057 [US3] Ensure internal wire states synchronize with external circuit simulation

**Checkpoint**: Full hierarchy navigation works - users can debug multi-level composite ICs

---

## Phase 7: User Story 4 - Add Inverter Symbols to IC Pins (Priority: P2)

**Goal**: Enable users to attach inverter symbols to IC pins for signal inversion (0↔1, Hi-Z unchanged)

**Independent Test**: Add inverter to AND gate input, connect logic 1, verify gate receives logic 0 internally

### Implementation for User Story 4

- [X] T058 [P] [US4] Create InverterSymbol model in src/models/InverterSymbol.ts with pinId and position
- [X] T059 [P] [US4] Implement addInverterToPin method in CompositeICManager
- [X] T060 [US4] Implement removeInverterFromPin method in CompositeICManager
- [X] T061 [US4] Add inverter logic to signal propagation: invert 0↔1, keep Hi-Z unchanged (per FR-017)
- [X] T062 [US4] Create InverterRenderer utility in src/lib/InverterRenderer.ts for drawing circle symbol on Canvas
- [X] T063 [US4] Add inverter symbol rendering to ICPin visualization in CompositeICComponent
- [X] T064 [US4] Implement pin click handler to add/remove inverter in CompositeICEditor
- [X] T065 [US4] Add inverter state persistence when saving composite ICs
- [X] T066 [US4] Ensure inverter symbols are preserved in IC instances
- [X] T067 [US4] Add performance check to meet SC-007 (add/remove inverter <2s)

**Checkpoint**: Inverter symbols fully functional on IC pins - User Story 4 complete

---

## Phase 8: User Story 5 - Interactive Pin Components (Push Buttons and Lights) (Priority: P2)

**Goal**: Provide interactive components (buttons/lights) for testing circuits

**Independent Test**: Place button connected to light, press button, verify light shows correct state with wire coloring

### Implementation for User Story 5

- [X] T068 [P] [US5] Create PushButton model in src/models/PushButton.ts with type (toggle/momentary), state, outputValue
- [X] T069 [P] [US5] Create LightIndicator model in src/models/LightIndicator.ts with displayState, inputValue
- [X] T070 [US5] Implement createPushButton method in SimulationEngine
- [X] T071 [US5] Implement pressPushButton method with <50ms propagation (SC-008)
- [X] T072 [US5] Implement releasePushButton method for momentary buttons
- [X] T073 [US5] Add toggle vs momentary logic to push button state management
- [X] T074 [US5] Create PushButtonComponent React component in src/components/PushButton/PushButtonComponent.tsx
- [X] T075 [US5] Add button click/mouse-down handlers with visual feedback
- [X] T076 [US5] Implement createLightIndicator method in SimulationEngine
- [X] T077 [US5] Implement updateLightState method with 4 display states (on/off/dimmed/conflict)
- [X] T078 [US5] Create LightIndicatorComponent React component in src/components/LightIndicator/LightIndicatorComponent.tsx
- [X] T079 [US5] Add light rendering: on=yellow/bright, off=dark, dimmed=grey with diagonal stripes for Hi-Z (per FR-020)
- [X] T080 [US5] Implement light conflict state rendering (orange for CONFLICT)
- [X] T081 [US5] Add button-pressed, button-released, light-state-changed events
- [X] T082 [US5] Ensure buttons and lights work inside composite ICs (FR-021)
- [X] T083 [US5] Add button/light persistence in composite IC storage

**Checkpoint**: Interactive components fully functional - circuits are testable with buttons and lights

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T084 [P] Add comprehensive unit tests for Wire model in tests/unit/Wire.test.ts
- [X] T085 [P] Add unit tests for CompositeIC model in tests/unit/CompositeIC.test.ts
- [X] T086 [P] Add unit tests for PushButton and LightIndicator in tests/unit/PinComponent.test.ts
- [X] T087 [P] Add unit tests for ConflictDetector in tests/unit/ConflictDetector.test.ts
- [ ] T088 [P] Create contract tests for wire-api in tests/contract/wire-color-api.test.ts
- [ ] T089 [P] Create contract tests for composite-ic-api in tests/contract/composite-ic-api.test.ts
- [ ] T090 [P] Create integration test for wire propagation in tests/integration/wire-propagation.test.ts
- [ ] T091 [P] Create integration test for IC nesting in tests/integration/ic-nesting.test.ts
- [ ] T092 [P] Create integration test for hierarchy navigation in tests/integration/hierarchy-navigation.test.ts
- [ ] T093 [P] Create Playwright E2E test for complete user journey in tests/e2e/wire-visualization.spec.ts
- [ ] T094 Performance optimization: Profile wire rendering for 1000 wires at 60 FPS using Chrome DevTools Performance tab - verify <16.67ms frame time, no dropped frames during simulation
- [ ] T095 Performance optimization: Test composite IC with 50 components meets <2s requirement using performance.now() - measure createCompositeIC() execution time, optimize if >2000ms
- [ ] T096 [P] Add WCAG accessibility check for wire colors (verify contrast ratios)
- [ ] T097 Code cleanup: Refactor SimulationEngine to reduce complexity
- [ ] T098 Code cleanup: Extract color scheme logic into separate module
- [X] T099 [P] Update README.md with wire visualization and composite IC features
- [ ] T100 Run quickstart.md validation scenarios and verify all pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3-4)**: Depends on Foundational - Can start after T013 complete
- **User Story 2 (Phase 5)**: Depends on Foundational - Can start after T013 complete (parallel with US1 if staffed)
- **User Story 3 (Phase 6)**: Depends on US2 complete (T047) - Requires CompositeIC to exist
- **User Story 4 (Phase 7)**: Depends on Foundational and US2 (T032) - Requires ICPin model
- **User Story 5 (Phase 8)**: Depends on Foundational - Can start after T013 complete (parallel with US1/US2)
- **Polish (Phase 9)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: ✅ Can start after Foundational - No dependencies on other stories
- **User Story 2 (P2)**: ✅ Can start after Foundational - Independent (though makes more sense after US1 for visual feedback)
- **User Story 3 (P3)**: ❌ DEPENDS on US2 - Cannot start until composite ICs exist
- **User Story 4 (P2)**: ⚠️ DEPENDS on US2 (ICPin model) - Can start once T032 complete
- **User Story 5 (P2)**: ✅ Can start after Foundational - Independent

### Recommended MVP Scope

**Phase 1 MVP**: User Story 1 only

- Delivers core value: wire visualization with color-coded states
- Enables basic circuit debugging
- ~17 tasks (T001-T030 excluding parallel branches)

**Phase 2 Expansion**: Add User Story 2 + User Story 5

- Enables composite IC creation and interactive testing
- Delivers full circuit building + testing workflow
- Additional ~36 tasks

**Full Feature**: All 5 user stories

- Complete hierarchical circuit design with debugging
- ~100 tasks total

### Within Each User Story

**User Story 1 (Wire Visualization)**:

1. T014-T015 (models) can run in parallel
2. T016 (color function) can run parallel with models
3. T017-T018 (SimulationEngine methods) after models
4. T019-T020 (WireRenderer) can run parallel with engine methods
5. T021-T025 (UI components and integration) after renderer and engine

**User Story 2 (Composite ICs)**:

1. T031-T032 (models) can run in parallel
2. T033 (manager service) after models
3. T034-T037 (core IC logic) sequential on manager
4. T038-T039 (UI) can run parallel with T040-T042 (instantiation logic)
5. T043-T046 (storage) after core logic complete
6. T047 (component) integrates everything

**User Story 3 (Hierarchy Navigation)**:

1. T048-T049 (viewer and UI) can run in parallel
2. T050-T052 (navigation and rendering) sequential
3. T053-T057 (updates and optimization) after base navigation

**User Story 4 (Inverter Symbols)**:

1. T058-T059 (model and add logic) can run in parallel
2. T060-T061 (remove and propagation) sequential
3. T062-T064 (rendering and UI) can run parallel
4. T065-T067 (persistence and performance) after core logic

**User Story 5 (Interactive Components)**:

1. T068-T069 (button and light models) can run in parallel
2. T070-T073 (button logic) sequential
3. T074-T075 (button UI) can run parallel with T076-T080 (light logic and UI)
4. T081-T083 (events and integration) after both button and light complete

### Parallel Opportunities

**Setup Phase (all parallel)**:

```bash

# Can all run simultaneously
T003  # ESLint config
T004  # Jest setup
T005  # Playwright setup
```

**Foundational Phase (some parallel)**:

```bash
# First wave (all parallel)
T006  # LogicLevel enum
T007  # Point interface  
T008  # PinConnection interface
T009  # Color schemes

# Second wave (parallel after first wave)
T010  # Circuit model
T011  # Pin interfaces
T012  # React Context
```

**User Story 1 - Models (parallel)**:

```bash
T014  # Wire model
T015  # WireStateCalculator
T016  # getWireColor function
```

**User Story 2 - Models (parallel)**:

```bash
T031  # ICPin interface
T032  # CompositeIC model
```

**User Story 5 - Models (parallel)**:

```bash
T068  # PushButton model
T069  # LightIndicator model
```

**Polish Phase (most tasks parallel)**:

```bash
# All test files can be written in parallel
T084-T093  # All test files (10 tasks)
T096       # WCAG check
T099       # README update
```

---

## Parallel Example: User Story 1 (Wire Visualization)

If you have 3 developers, you could parallelize User Story 1 like this:

```bash
# Setup (everyone together - 1 day)
Developer A: T001, T002
Developer B: T003, T004  
Developer C: T005

# Foundational (parallel - 2 days)
Developer A: T006, T007, T008
Developer B: T009, T010
Developer C: T011, T012, T013

# User Story 1 - Models (parallel - 1 day)
Developer A: T014  # Wire model
Developer B: T015  # WireStateCalculator
Developer C: T016  # Color function

# User Story 1 - Services (sequential - 2 days)
Developer A: T017, T018  # SimulationEngine methods
Developer B: T019, T020  # WireRenderer
Developer C: T026, T027  # Conflict detection

# User Story 1 - UI (parallel - 2 days)
Developer A: T021, T022  # WireComponent
Developer B: T023, T024  # Event subscription
Developer C: T025, T028-T030  # Canvas integration + final conflict tasks

# Total: ~8 days for US1 with 3 developers (vs ~17 days solo)
```

---

## Summary

- **Total Tasks**: 100 tasks across 5 user stories
- **User Story Breakdown**:
  - Setup (Phase 1): 5 tasks
  - Foundational (Phase 2): 8 tasks (BLOCKS all stories)
  - User Story 1 (P1): 17 tasks (Wire visualization)
  - User Story 2 (P2): 17 tasks (Composite ICs)
  - User Story 3 (P3): 10 tasks (Hierarchy navigation)
  - User Story 4 (P2): 10 tasks (Inverter symbols)
  - User Story 5 (P2): 16 tasks (Interactive components)
  - Polish (Phase 9): 17 tasks (Testing and optimization)

- **Parallel Tasks**: 34 tasks marked [P] can run in parallel
- **Independent Stories**: US1, US2, US5 can start after Foundational
- **MVP Scope**: User Story 1 only (17 tasks + 13 setup/foundational = ~30 tasks)
- **Format Compliance**: ✅ All tasks follow `- [ ] [ID] [P?] [Story] Description with file path` format

**Next Steps**:

1. Start with Phase 1 (Setup) - 1-2 days
2. Complete Phase 2 (Foundational) - CRITICAL, blocks everything - 2-3 days
3. Implement User Story 1 (P1) for MVP - 3-5 days
4. Expand with User Stories 2, 4, 5 in parallel (if team capacity) - 2-3 weeks
5. Add User Story 3 after US2 complete - 1 week
6. Polish and testing - 1 week

**Estimated Timeline**:

- Solo developer: ~12-15 weeks
- Team of 3: ~6-8 weeks  
- MVP only (US1): ~2-3 weeks solo, ~1 week with team
