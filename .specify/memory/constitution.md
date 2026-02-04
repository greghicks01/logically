# Logically Circuit Simulator Constitution

## Core Principles

### I. Mathematical Foundation First
Every visual or interactive feature must have a well-defined mathematical model before implementation. The mathematics guide the code, not vice versa.

**Requirements:**
- Express behavior as equations (linear, parametric, or transformational)
- Document the mathematical model in code comments with formulas
- Identify invariants and constraints mathematically
- Validate edge cases through mathematical reasoning

**Rationale:** The parametric pin positioning work revealed that unclear mathematics led to visual bugs. Starting with t ∈ [0,1] parametric coordinates prevented position calculation errors.

### II. Separation of Logical and Physical Concerns
Separate what something *is* (logical specification) from where/how it *appears* (physical rendering).

**Requirements:**
- Logical models store parametric specifications (edge, t, extension)
- Physical positions calculated on-demand from specs + context
- Never hardcode absolute positions in model layer
- Rendering components receive bounding boxes, not calculate them

**Rationale:** Mixing logical (pin identity) with physical (x,y coordinates) created coupling. Moving pins required touching multiple files. Parametric specs eliminated this.

### III. Test Mathematical Functions, Not Just Features
Core mathematical utilities require comprehensive unit testing separate from integration tests.

**Requirements:**
- Test mathematical functions in isolation (positioning, distribution, transformations)
- Verify edge cases (zero dimensions, single element, boundary values)
- Test numerical precision with `toBeCloseTo()` for floating point
- Integration tests verify composed behavior

**Rationale:** 65 parametric positioning tests caught precision issues and edge cases before UI integration, saving debugging time.

### IV. Single Source of Truth
Each behavior, calculation, or data structure must have exactly one authoritative definition.

**Requirements:**
- Duplicate logic is a critical defect
- Shared calculations belong in reusable functions
- Document which file/function is authoritative for each concern
- Reference the source of truth, never copy-paste

**Rationale:** Seven gate files had duplicate pin positioning logic. Consolidating to one function eliminated inconsistencies and simplified changes.

### V. Backward Compatibility During Migration
New systems must coexist with old ones during transition. Break changes deliberately, never accidentally.

**Requirements:**
- Keep old APIs functional during migration
- Add new APIs alongside, don't replace immediately
- Migrate one component at a time with validation
- Document migration path and deprecation timeline

**Rationale:** Preserving `createInputPinsAtPosition()` while adding parametric functions allowed gradual migration. AND gate migration validated the approach before touching other gates.

## Development Workflow

### Design Phase
1. **Express the problem mathematically** - write equations before code
2. **Identify invariants** - what must always be true?
3. **Document edge cases** - zero, one, max, negative values
4. **Design types/interfaces** - capture the mathematical model

### Implementation Phase
1. **Create mathematical utilities first** - pure functions, well-tested
2. **Unit test exhaustively** - all edge cases, numerical precision
3. **Build higher-level abstractions** - compose tested utilities
4. **Integration test real scenarios** - user interactions, state changes

### Migration Phase
1. **Implement new system alongside old** - no breaking changes yet
2. **Migrate one component as proof** - validate approach
3. **Test migrated component thoroughly** - ensure parity
4. **Migrate remaining components** - apply lessons learned
5. **Deprecate old system** - after full migration validated

## Quality Standards

### Code Documentation
- Mathematical formulas in comments with variable definitions
- Example calculations showing expected values
- References to external concepts (e.g., parametric equations)
- Rationale for non-obvious design decisions

### Testing Coverage
- All mathematical utility functions: 100% coverage
- Edge cases explicitly tested and documented
- Integration tests for user-visible behavior
- Test descriptions explain what's being verified

### Type Safety
- Interfaces capture logical structure, not just shape
- Separate types for specifications vs. computed values
- Use branded types for units (PinSpec vs Point)
- Avoid `any` - specify types explicitly

## Governance

This constitution supersedes all other development practices. Principles are non-negotiable; implementations may evolve.

**Amendment Process:**
1. Identify principle violation or gap
2. Propose amendment with rationale
3. Update version following semantic versioning
4. Propagate changes to dependent documents

**Compliance:**
- All PRs must align with these principles
- Mathematical models documented before implementation
- Testing requirements enforced in CI/CD
- Architecture reviews verify separation of concerns

**Version**: 1.0.0 | **Ratified**: 2026-02-04 | **Last Amended**: 2026-02-04
