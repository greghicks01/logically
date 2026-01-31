# Feature Specification: Wire Logic Level Visualization and Composite ICs

**Feature Branch**: `002-wire-logic-display`  
**Created**: January 31, 2026  
**Status**: Draft  
**Input**: User description: "the user needs to draw 'wires' which show the logic level as 0 = Blue, 1 - Red and Hi Z = grey. an IC can be a composed element of other 'IC's'"

## Clarifications

### Session 2026-01-31

- Q: Wire Conflict/Error Color - Which color should be used for wire conflicts when multiple outputs drive different values? → A: Orange (with WCAG accessibility recommendations considered as a setting option)
- Q: Push Button Behavior - Should push buttons be toggle (stays on/off) or momentary (active while pressed)? → A: Both - User chooses type when placing component
- Q: Light Component Hi-Z Display - How should lights display Hi-Z (floating/unconnected) states? → A: Off/dimmed (distinct from logic 0 if possible)
- Q: Inverter Symbol on Hi-Z Signal - What happens when an inverter symbol is applied to a pin receiving Hi-Z? → A: Remains Hi-Z (inverters invert logic levels 0↔1, not tri-state output conditions)
- Q: Maximum Nesting Depth Enforcement - Should there be a hard limit, soft limit, or no limit on composite IC nesting depth? → A: Soft limit - Warn at 10 levels, allow user to proceed

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draw Wires with Visual Logic State (Priority: P1)

Circuit designers draw wires to connect components, and they need immediate visual feedback about the logic state flowing through each wire. The wire color indicates the current logic level: Blue for logic 0 (low), Red for logic 1 (high), and Grey for Hi-Z (high impedance/not driven).

**Why this priority**: This is fundamental to understanding circuit behavior. Without visual logic state indication, users cannot verify their circuit is working correctly. This is the core value proposition for wire visualization.

**Independent Test**: Can be fully tested by creating a simple circuit with a power source connected to a wire and verifying the wire displays red. Disconnecting the wire should show grey. Connecting to ground should show blue. This delivers immediate value for circuit debugging.

**Acceptance Scenarios**:

1. **Given** a wire is connected to a logic 1 source, **When** the simulation runs, **Then** the wire displays in red color
2. **Given** a wire is connected to a logic 0 source, **When** the simulation runs, **Then** the wire displays in blue color
3. **Given** a wire is not connected to any source (floating), **When** the simulation runs, **Then** the wire displays in grey color
4. **Given** a wire state changes during simulation, **When** the logic level transitions, **Then** the wire color updates to reflect the new state

---

### User Story 2 - Create Composite ICs from Existing Components (Priority: P2)

Users can build complex integrated circuits by combining simpler ICs and basic components into a new reusable IC. This composite IC can then be used as a building block in other circuits, including other composite ICs, enabling hierarchical circuit design.

**Why this priority**: This enables users to build complex circuits in a manageable way by abstracting complexity. It's essential for scalability but requires the basic wire visualization (P1) to be useful.

**Independent Test**: Can be fully tested by creating a simple composite IC (e.g., a half-adder from AND/XOR gates), saving it, and then using that composite IC in a new circuit design. Delivers value for circuit reusability and abstraction.

**Acceptance Scenarios**:

1. **Given** a user has designed a circuit with multiple components, **When** they select components and choose "Create Composite IC", **Then** a new IC is created containing those components
2. **Given** a composite IC has been created, **When** the user places it in a new circuit, **Then** it functions as a single component with defined inputs and outputs
3. **Given** a composite IC is placed in a circuit, **When** wires are connected to its pins, **Then** the internal wire states within the composite IC reflect the logic propagation
4. **Given** a composite IC contains other composite ICs, **When** used in a circuit, **Then** all nested logic levels propagate correctly through all hierarchy levels

---

### User Story 3 - Navigate Wire States in Composite IC Hierarchy (Priority: P3)

When debugging complex circuits with composite ICs, users need to drill down into the internal structure of composite ICs to see the wire states at each level of the hierarchy. This allows troubleshooting of complex designs.

**Why this priority**: This is important for debugging but only valuable after users can create composite ICs (P2) and see wire states (P1). It's a quality-of-life feature for advanced users.

**Independent Test**: Can be fully tested by creating a composite IC with internal wires, placing it in a circuit, and verifying that users can "expand" or "zoom into" the IC to view internal wire colors. Delivers value for debugging complex circuits.

**Acceptance Scenarios**:

1. **Given** a composite IC is placed in a circuit, **When** the user selects "View Internal Structure", **Then** the internal components and wires are displayed with their current logic states
2. **Given** viewing internal structure of a composite IC, **When** the simulation is running, **Then** internal wire colors update in real-time to reflect logic changes
3. **Given** a composite IC contains nested composite ICs, **When** viewing internal structure, **Then** users can navigate through multiple levels of hierarchy

---

### User Story 4 - Add Inverter Symbols to IC Pins (Priority: P2)

Circuit designers need to create ICs that match standard logic IC designs, where some inputs or outputs have built-in inverters (indicated by a small circle/bubble on the pin). Users can attach inverter symbols to individual pins, automatically inverting the logic level at that pin.

**Why this priority**: This is essential for accurately representing standard IC designs (like NAND gates, NOR gates) and for creating composite ICs that match real-world components. It's a core feature for proper IC design.

**Independent Test**: Can be fully tested by adding an inverter symbol to an AND gate input, connecting a logic 1 source, and verifying the gate receives logic 0 internally. Delivers value for accurate circuit representation.

**Acceptance Scenarios**:

1. **Given** an IC pin (input or output), **When** the user adds an inverter symbol, **Then** a small round visual element appears on the pin
2. **Given** an inverter symbol is attached to an input pin, **When** a logic 1 signal arrives, **Then** the IC internally receives logic 0 (and vice versa)
3. **Given** an inverter symbol is attached to an output pin, **When** the IC outputs logic 1, **Then** the external wire shows logic 0 (and vice versa)
4. **Given** a composite IC is created, **When** it includes pins with inverter symbols, **Then** the inverter symbols are preserved when the IC is reused

---

### User Story 5 - Interactive Pin Components (Push Buttons and Lights) (Priority: P2)

Users need interactive components to test their circuits: push buttons to manually control input signals and lights to visualize output states. These components can be incorporated into composite IC designs to create testable, self-contained circuits.

**Why this priority**: This enables users to interact with and test their circuits without needing external simulation controls. It's fundamental for circuit validation and demonstration.

**Independent Test**: Can be fully tested by placing a push button connected to a light through a wire, pressing the button, and verifying the light displays the correct state with appropriate wire coloring. Delivers immediate value for circuit testing.

**Acceptance Scenarios**:

1. **Given** a push button component is placed, **When** the user clicks/presses it, **Then** it outputs the corresponding logic level and connected wires update colors
2. **Given** a light component is connected to a wire, **When** the wire carries logic 1, **Then** the light displays the "on" state
3. **Given** a light component is connected to a wire, **When** the wire carries logic 0, **Then** the light displays the "off" state
4. **Given** a light component is connected to a wire, **When** the wire carries Hi-Z (floating), **Then** the light displays off/dimmed state (distinct from logic 0)
5. **Given** a circuit with push buttons and lights, **When** saved as a composite IC, **Then** the push buttons and lights remain functional as part of the IC's interface

---

### Edge Cases

- What happens when a wire is connected to multiple sources with conflicting logic levels (e.g., one output drives 1, another drives 0)? (Resolved: Show conflict/error color)
- What happens when a composite IC has unconnected internal wires? (Show grey Hi-Z state)
- How are wire states handled at the boundary between composite IC internals and external connections?
- How are wire states displayed during transient conditions or race conditions in the simulation?
- Can multiple inverter symbols be chained on the same pin?
- What happens when a push button changes state rapidly during simulation?
- Can push buttons and lights be used within the internal structure of composite ICs?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display wires in blue color when carrying logic level 0 (low)
- **FR-002**: System MUST display wires in red color when carrying logic level 1 (high)
- **FR-003**: System MUST display wires in grey color when in Hi-Z state (high impedance/floating/not driven)
- **FR-004**: System MUST update wire colors in real-time as logic levels change during simulation
- **FR-005**: System MUST allow users to create composite ICs by selecting and grouping existing components
- **FR-006**: Composite ICs MUST be reusable as components in other circuit designs
- **FR-007**: Composite ICs MUST support nesting (a composite IC can contain other composite ICs)
- **FR-008**: System MUST propagate logic levels correctly through all hierarchy levels in nested composite ICs
- **FR-009**: System MUST allow users to define input and output pins for composite ICs
- **FR-010**: System MUST persist composite IC definitions for future use
- **FR-011**: System MUST warn users when creating composite ICs nested beyond 10 levels, but allow creation to proceed
- **FR-012**: Wires within composite ICs MUST display logic states using the same color coding as external wires
- **FR-013**: Users MUST be able to view internal structure of composite ICs to see internal wire states
- **FR-014**: System MUST display wires in orange color when multiple outputs drive the same wire to different logic values (conflict/error state)
- **FR-015**: System MUST allow users to add inverter symbols to individual input or output pins on ICs
- **FR-016**: Inverter symbols MUST be displayed as small round visual elements attached to the selected pin
- **FR-017**: Inverter symbols MUST automatically invert logic levels at that pin (0 becomes 1, 1 becomes 0); Hi-Z state remains Hi-Z as it represents tri-state output condition, not a logic level
- **FR-018**: System MUST provide push button components in both toggle and momentary modes, with users selecting the type when placing the component
- **FR-019**: System MUST provide light/indicator components that visually display output pin states
- **FR-020**: Light components MUST display logic 1 as "on", logic 0 as "off", and Hi-Z as off/dimmed (visually distinct from logic 0 where feasible)
- **FR-021**: Push buttons and lights MUST be savable as part of composite IC pin definitions
- **FR-022**: Simulation MUST run continuously, updating wire colors in real-time as logic states change

### Key Entities

- **Wire**: A connection between components that carries a logic signal. Has properties: source component(s), destination component(s), current logic level (0, 1, or Hi-Z), visual appearance (color based on logic level), conflict state
- **Composite IC**: A user-created component composed of other components (basic or composite). Has properties: name, internal component layout, defined input pins, defined output pins, internal wire connections, nesting level
- **Logic Level**: The electrical state of a signal. Can be: 0 (low/false), 1 (high/true), or Hi-Z (high impedance/not driven/floating)
- **IC Component**: A building block in the circuit. Can be either a basic IC (AND, OR, NOT, etc.) or a composite IC. Has properties: type, position, input pins, output pins, internal logic behavior
- **Inverter Symbol**: A visual indicator attached to a pin that inverts logic levels at that pin. Has properties: attached pin, visual appearance (small round element), inversion behavior (0↔1, Hi-Z remains Hi-Z)
- **Push Button**: An interactive input component that allows users to manually set logic levels. Has properties: button type (toggle or momentary), current state (pressed/released), output value
- **Light/Indicator**: An output component that visually displays logic levels. Has properties: current display state (on for logic 1, off for logic 0, off/dimmed for Hi-Z), connected input

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can identify the logic state of any wire in a circuit within 1 second by observing its color
- **SC-002**: Wire color updates occur within 100 milliseconds of logic level changes during simulation
- **SC-003**: System supports composite ICs nested up to 10 levels deep without performance degradation; warning displayed beyond 10 levels but nesting still allowed
- **SC-004**: 95% of users can successfully create and reuse a composite IC on their first attempt
- **SC-005**: Users can navigate through 3 levels of composite IC hierarchy to view internal wire states within 5 seconds
- **SC-006**: Composite IC creation and instantiation complete within 2 seconds for ICs containing up to 50 internal components
- **SC-007**: Users can add or remove inverter symbols to IC pins in under 2 seconds
- **SC-008**: Push button state changes reflect in connected wire colors within 50 milliseconds
- **SC-009**: 90% of users successfully use push buttons and lights to test a circuit on first attempt
- **SC-010**: Conflict/error states (orange) on wires are visually distinguishable from normal logic states within 1 second of occurrence

## Assumptions

- Users have basic understanding of digital logic concepts (logic 0, logic 1, high impedance)
- Users are familiar with standard IC notation where a small circle/bubble indicates logic inversion
- The circuit simulator already has a logic propagation engine that can determine wire states
- The system has an existing component placement and wiring interface
- Standard color vision is assumed (red and blue are distinguishable); accessibility features for color blindness are out of scope for this feature
- Wire rendering performance is acceptable for circuits with up to 1000 wires
- Composite IC definitions will be stored locally in the user's project
- Simulation runs continuously in real-time, with no paused or stopped states
- Conflict/error state uses orange color, visually distinct from logic colors (blue, red, grey); WCAG-compliant accessibility settings may be offered for color blindness support
- Push buttons support both toggle mode (click to switch state) and momentary mode (active only while mouse is pressed), with type selected at placement time
- Light components have clear visual distinction between on/off states, with Hi-Z displayed as off or dimmed to differentiate from logic 0 where feasible
