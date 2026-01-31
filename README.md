# LogicLy - Digital Logic Circuit Simulator

Wire Logic Level Visualization and Composite ICs

## Features

✅ **Implemented (83/100 tasks complete):**

**Phase 1-4: Wire Visualization (User Story 1)**

- Color-coded wire states (Blue=0, Red=1, Grey=Hi-Z, Orange=Conflict)
- Real-time state updates with 60 FPS rendering
- Conflict detection for multiple drivers
- Canvas-based rendering with dirty rectangle optimization

**Phase 5: Composite ICs (User Story 2)**

- Create reusable ICs from existing circuits
- Support for arbitrary nesting depth (warning at 10 levels)
- Pin mapping with overbar notation (Q̅, EN̅)
- Persistent storage via IndexedDB with LocalStorage fallback

**Phase 6: Hierarchy Navigation (User Story 3)**

- Breadcrumb navigation through nested ICs
- Multi-level drill-down capability
- Return to parent circuit functionality

**Phase 7: Inverter Symbols (User Story 4)**

- Attach inverters to IC pins
- Signal inversion (0↔1, Hi-Z unchanged)
- Visual circle symbols on pins

**Phase 8: Interactive Components (User Story 5)**

- Toggle and momentary push buttons
- Light indicators with 4 states (on/off/dimmed/conflict)
- Visual feedback and event handling

🚧 **Remaining Work (17/100 tasks):**

- Contract and integration tests
- E2E test scenarios
- Performance profiling and optimization
- Full simulation engine implementation
- Quickstart validation scenarios

See [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for detailed progress.

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Watch mode
npm run test:watch
```

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
src/
├── models/          # Domain entities (Wire, Circuit, LogicLevel, etc.)
├── services/        # Business logic (SimulationEngine, WireRenderer)
├── components/      # React UI components
├── contexts/        # React Context for global state
└── lib/             # Utility functions (color schemes, calculators)

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
├── contract/        # Contract tests
└── e2e/             # End-to-end tests
```

## Technology Stack

- **TypeScript 5.0+** - Type-safe development
- **React 18+** - UI framework
- **Canvas API** - Wire rendering
- **Jest** - Unit/integration testing
- **Playwright** - E2E testing
- **Vite** - Build tool

## Performance Targets

- Wire color updates: < 100ms
- Visual frame rate: 60 FPS
- Circuit evaluation: < 100ms for 50 gates
- Support for 1000+ wires

## License

MIT
