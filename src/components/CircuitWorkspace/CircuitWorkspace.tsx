import React, { useState, useRef, useCallback } from 'react';
import { Switch, createSwitch, toggleSwitch } from '../../models/Switch';
import { MultiInputGate, createMultiInputGate, computeGateOutput } from '../../models/MultiInputGate';
import { Buffer, createBuffer, computeBufferOutput } from '../../models/Buffer';
import { Inverter, createInverter, computeInverterOutput } from '../../models/Inverter';
import { LightIndicator, createLightIndicator } from '../../models/LightIndicator';
import { Wire } from '../../models/Wire';
import { LogicLevel } from '../../models/LogicLevel';
import { SwitchComponent } from '../Switch/SwitchComponent';
import { MultiInputGateComponent } from '../MultiInputGate/MultiInputGateComponent';
import { BufferComponent } from '../Buffer/BufferComponent';
import { InverterComponent } from '../Inverter/InverterComponent';
import { LightIndicatorComponent } from '../LightIndicator/LightIndicatorComponent';
import { WireComponent } from '../WireComponent/WireComponent';
import { PinComponent } from '../Pin/PinComponent';
import { GateConfigDialog } from '../GateConfigDialog/GateConfigDialog';
import { ContextMenu, ContextMenuOption } from '../ContextMenu/ContextMenu';
import { ComponentType } from '../ComponentPalette/ComponentPalette';
import { Point } from '../../models/Point';
import { Pin } from '../../models/bases/MultiInputComponent';
import { useWiring } from '../../hooks/useWiring';
import { TruthTablePanel } from '../TruthTablePanel/TruthTablePanel';
import { TruthTable } from '../../models/TruthTable';
import { TruthTableGenerator } from '../../services/TruthTableGenerator';

export interface CircuitWorkspaceProps {
  width: number;
  height: number;
  selectedComponent: ComponentType | null;
  onComponentPlaced: () => void;
}

/**
 * Interactive circuit workspace with component placement and wiring
 */
export const CircuitWorkspace: React.FC<CircuitWorkspaceProps> = ({
  width,
  height,
  selectedComponent,
  onComponentPlaced,
}) => {
  // Polymorphic state management - eliminates separate arrays for each gate type
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [multiInputGates, setMultiInputGates] = useState<MultiInputGate[]>([]);
  const [buffers, setBuffers] = useState<Buffer[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [lights, setLights] = useState<LightIndicator[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
  // Map UI component types to gate model types
  const COMPONENT_TO_GATE_TYPE: Record<string, MultiInputGate['type']> = {
    'and-gate': 'and',
    'or-gate': 'or',
    'nand-gate': 'nand',
    'nor-gate': 'nor',
    'xor-gate': 'xor',
    'xnor-gate': 'xnor',
  };
  
  // Gate configuration dialog state
  const [showGateDialog, setShowGateDialog] = useState(false);
  const [pendingGatePosition, setPendingGatePosition] = useState<Point | null>(null);
  const [pendingGateType, setPendingGateType] = useState<ComponentType | null>(null);
  const [editingGateId, setEditingGateId] = useState<string | null>(null);
  const [currentGateNumInputs, setCurrentGateNumInputs] = useState<number>(2);
  const [currentGateName, setCurrentGateName] = useState<string>('');
  
  // Drag state
  const [draggedComponent, setDraggedComponent] = useState<{ type: string; id: string; offset: Point } | null>(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; componentType: string; componentId: string } | null>(null);
  
  // Truth table state
  const [truthTables, setTruthTables] = useState<Map<string, TruthTable>>(new Map());
  const [truthTablePositions, setTruthTablePositions] = useState<Map<string, Point>>(new Map());
  const truthTableGenerator = useRef(new TruthTableGenerator());
  
  const svgRef = useRef<SVGSVGElement>(null);
  const componentIdCounter = useRef(0);
  
  const { wiringState, startWiring, updateWirePreview, completeWiring, cancelWiring } = useWiring();

  // Generate unique ID
  const generateId = (prefix: string) => {
    componentIdCounter.current += 1;
    return `${prefix}-${componentIdCounter.current}`;
  };

  // Handle canvas click to place components or cancel wiring
  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    // Close context menu if open
    if (contextMenu) {
      setContextMenu(null);
      return;
    }
    
    // Cancel wiring if clicking on empty space
    if (wiringState.isWiring) {
      cancelWiring();
      return;
    }

    // Don't place if dragging
    if (draggedComponent) return;

    if (!svgRef.current || !selectedComponent) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const position: Point = { x, y };

    if (selectedComponent === 'switch') {
      const newSwitch = createSwitch(generateId('switch'), position);
      setSwitches([...switches, newSwitch]);
      onComponentPlaced();
    } else if (selectedComponent === 'and-gate' || selectedComponent === 'or-gate' || 
               selectedComponent === 'nand-gate' || selectedComponent === 'nor-gate' ||
               selectedComponent === 'xor-gate' || selectedComponent === 'xnor-gate') {
      // Show dialog for gate configuration
      setPendingGatePosition(position);
      setPendingGateType(selectedComponent);
      setShowGateDialog(true);
    } else if (selectedComponent === 'buffer') {
      const newBuffer = createBuffer(generateId('buffer'), position);
      setBuffers([...buffers, newBuffer]);
      onComponentPlaced();
    } else if (selectedComponent === 'inverter') {
      const newInverter = createInverter(generateId('inverter'), position);
      setInverters([...inverters, newInverter]);
      onComponentPlaced();
    } else if (selectedComponent === 'light') {
      const newLight = createLightIndicator(generateId('light'), position);
      setLights([...lights, newLight]);
      onComponentPlaced();
    }
  };

  // Handle gate configuration dialog
  const handleGateConfigConfirm = (config: { numInputs: number; name?: string }) => {
    // If editing an existing gate
    if (editingGateId) {
      handleGateConfigUpdate(config);
      return;
    }
    
    // Polymorphic gate creation - single code path for all gate types
    if (pendingGatePosition && pendingGateType) {
      const gateType = COMPONENT_TO_GATE_TYPE[pendingGateType];
      if (gateType) {
        const newGate = createMultiInputGate(
          gateType,
          generateId(gateType),
          pendingGatePosition,
          config.numInputs,
          config.name
        );
        setMultiInputGates([...multiInputGates, newGate]);
        onComponentPlaced();
      }
    }
    setShowGateDialog(false);
    setPendingGatePosition(null);
    setPendingGateType(null);
  };

  const handleGateConfigCancel = () => {
    setShowGateDialog(false);
    setPendingGatePosition(null);
    setPendingGateType(null);
  };

  // Handle component mouse down for dragging
  const handleComponentMouseDown = (event: React.MouseEvent, componentType: string, componentId: string, position: Point) => {
    // Prevent if wiring or placing component
    if (wiringState.isWiring || selectedComponent) return;
    
    event.stopPropagation();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setDraggedComponent({
      type: componentType,
      id: componentId,
      offset: { x: mouseX - position.x, y: mouseY - position.y }
    });
  };

  // Handle component right click for context menu
  const handleComponentRightClick = (event: React.MouseEvent, componentType: string, componentId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      componentType,
      componentId
    });
  };

  // Handle delete component
  const handleDeleteComponent = (componentType: string, componentId: string) => {
    // Get all pins of the component being deleted
    let componentPins: Pin[] = [];
    
    // Polymorphic deletion - check if it's any gate type
    const isGateType = Object.keys(COMPONENT_TO_GATE_TYPE).includes(componentType);
    
    if (componentType === 'switch') {
      const component = switches.find(sw => sw.id === componentId);
      if (component) componentPins.push(component.outputPin);
      setSwitches(switches.filter(sw => sw.id !== componentId));
    } else if (isGateType) {
      const component = multiInputGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setMultiInputGates(multiInputGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'buffer') {
      const component = buffers.find(buffer => buffer.id === componentId);
      if (component) componentPins.push(component.inputPin, component.outputPin);
      setBuffers(buffers.filter(buffer => buffer.id !== componentId));
    } else if (componentType === 'inverter') {
      const component = inverters.find(inverter => inverter.id === componentId);
      if (component) componentPins.push(component.inputPin, component.outputPin);
      setInverters(inverters.filter(inverter => inverter.id !== componentId));
    } else if (componentType === 'light') {
      const component = lights.find(light => light.id === componentId);
      if (component) componentPins.push(component.inputPin);
      setLights(lights.filter(light => light.id !== componentId));
    }
    
    // Remove wires connected to any pin of the deleted component
    setWires(wires.filter(wire => {
      if (wire.path.length < 2) return true;
      
      const wireStart = wire.path[0];
      const wireEnd = wire.path[wire.path.length - 1];
      
      // Check if wire connects to any pin of the deleted component
      for (const pin of componentPins) {
        const connectsToStart = Math.abs(wireStart.x - pin.position.x) < 8 && 
                                Math.abs(wireStart.y - pin.position.y) < 8;
        const connectsToEnd = Math.abs(wireEnd.x - pin.position.x) < 8 && 
                              Math.abs(wireEnd.y - pin.position.y) < 8;
        
        if (connectsToStart || connectsToEnd) {
          return false; // Remove this wire
        }
      }
      
      return true; // Keep this wire
    }));
  };

  // Handle delete wire
  const handleDeleteWire = (wireId: string) => {
    setWires(wires.filter(wire => wire.id !== wireId));
    setContextMenu(null);
    
    // Repropagate logic after wire deletion
    propagateLogic(switches, multiInputGates, buffers, inverters, lights, wires.filter(wire => wire.id !== wireId));
  };

  // Handle rotate component (90 degrees clockwise)
  const handleRotateComponent = (componentType: string, componentId: string) => {
    // Rotation could be implemented by tracking rotation state
    // For now, we'll skip this as it requires pin position recalculation
    console.log('Rotate:', componentType, componentId);
  };

  // Handle change number of inputs for multi-input gates
  const handleChangeInputs = (gateId: string) => {
    // Polymorphic gate lookup - single unified array
    const gate = multiInputGates.find(g => g.id === gateId);
    if (!gate) return;
    
    // Map gate.type back to component type for UI
    const gateTypeToComponent: Record<MultiInputGate['type'], ComponentType> = {
      'and': 'and-gate',
      'or': 'or-gate',
      'nand': 'nand-gate',
      'nor': 'nor-gate',
      'xor': 'xor-gate',
      'xnor': 'xnor-gate',
    };
    
    // Open dialog with current gate settings
    setEditingGateId(gateId);
    setPendingGateType(gateTypeToComponent[gate.type]);
    setCurrentGateNumInputs(gate.numInputs);
    setCurrentGateName(gate.name || '');
    setShowGateDialog(true);
  };

  // Handle gate config changes from dialog - Polymorphic approach
  const handleGateConfigUpdate = (config: { numInputs: number; name?: string }) => {
    if (!editingGateId || !pendingGateType) return;
    
    const gateType = COMPONENT_TO_GATE_TYPE[pendingGateType];
    if (!gateType) return;
    
    // Update gates polymorphically
    const updatedGates = multiInputGates.map(g => {
      if (g.id !== editingGateId) return g;
      
      // Preserve existing pin states
      const preservedStates = g.inputPins.map(pin => pin.state);
      
      // Recreate gate with new configuration
      const newGate = createMultiInputGate(
        gateType,
        g.id,
        g.position,
        config.numInputs,
        config.name || g.name
      );
      
      // Restore preserved pin states
      for (let i = 0; i < Math.min(preservedStates.length, newGate.inputPins.length); i++) {
        newGate.inputPins[i].state = preservedStates[i];
      }
      
      return newGate;
    });
    
    // Find the updated gate
    const updatedGate = updatedGates.find(g => g.id === editingGateId);
    
    // Update wires: remove wires connected to deleted pins, update pin references
    const updatedWires = updatedGate ? wires.filter(wire => {
      const hasFromPin = updatedGate.inputPins.some(p => p.id === wire.fromPin.id) || updatedGate.outputPin.id === wire.fromPin.id;
      const hasToPin = updatedGate.inputPins.some(p => p.id === wire.toPin.id) || updatedGate.outputPin.id === wire.toPin.id;
      return hasFromPin && hasToPin;
    }).map(wire => {
      let newFromPin = wire.fromPin;
      let newToPin = wire.toPin;
      
      const fromPin = updatedGate.inputPins.find(p => p.id === wire.fromPin.id) || (updatedGate.outputPin.id === wire.fromPin.id ? updatedGate.outputPin : null);
      if (fromPin) newFromPin = fromPin;
      const toPin = updatedGate.inputPins.find(p => p.id === wire.toPin.id) || (updatedGate.outputPin.id === wire.toPin.id ? updatedGate.outputPin : null);
      if (toPin) newToPin = toPin;
      
      return { ...wire, fromPin: newFromPin, toPin: newToPin };
    }) : wires;
    
    // Update state
    setMultiInputGates(updatedGates);
    setWires(updatedWires);
    
    // Propagate logic with updated state
    propagateLogic(switches, updatedGates, buffers, inverters, lights, updatedWires);
    
    // Reset editing state
    setEditingGateId(null);
    setShowGateDialog(false);
    setPendingGateType(null);
    setCurrentGateNumInputs(2);
    setCurrentGateName('');
  };

  // Handle truth table toggle for multi-input gates
  const handleToggleTruthTable = (componentType: string, componentId: string) => {
    setContextMenu(null);
    
    // Only support multi-input gates for now (can extend to inverter/buffer later)
    const isGateType = Object.keys(COMPONENT_TO_GATE_TYPE).includes(componentType);
    if (!isGateType) return;
    
    const gate = multiInputGates.find(g => g.id === componentId);
    if (!gate) return;
    
    // Check if truth table already exists
    if (truthTables.has(componentId)) {
      // Toggle visibility by removing it
      const newTables = new Map(truthTables);
      newTables.delete(componentId);
      setTruthTables(newTables);
      
      // Also remove position
      const newPositions = new Map(truthTablePositions);
      newPositions.delete(componentId);
      setTruthTablePositions(newPositions);
    } else {
      // Generate and show new truth table
      let table = truthTableGenerator.current.generateForGate(gate, 'multi-input');
      
      // Update current row to match gate's current state
      table = truthTableGenerator.current.updateCurrentRow(table, gate, 'multi-input');
      
      // Mark as visible
      table = { ...table, isVisible: true };
      
      const newTables = new Map(truthTables);
      newTables.set(componentId, table);
      setTruthTables(newTables);
      
      // Set initial position next to the gate
      const initialPosition = {
        x: gate.position.x + 150,
        y: gate.position.y - 100
      };
      const newPositions = new Map(truthTablePositions);
      newPositions.set(componentId, initialPosition);
      setTruthTablePositions(newPositions);
    }
  };

  // Handle truth table position change (for dragging)
  const handleTruthTablePositionChange = (gateId: string, newPosition: Point) => {
    const newPositions = new Map(truthTablePositions);
    newPositions.set(gateId, newPosition);
    setTruthTablePositions(newPositions);
  };

  // Handle mouse move for wire preview and dragging - Polymorphic approach
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    // Handle dragging
    if (draggedComponent && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - draggedComponent.offset.x;
      const y = event.clientY - rect.top - draggedComponent.offset.y;
      const newPosition: Point = { x, y };
      
      // Helper function to update multi-input gate positions
      const updateGatePosition = (gate: MultiInputGate) => {
        // Calculate position delta
        const deltaX = newPosition.x - gate.position.x;
        const deltaY = newPosition.y - gate.position.y;
        
        // Move all pins by the same delta to preserve relative positions
        return {
          ...gate,
          position: newPosition,
          inputPins: gate.inputPins.map((pin) => ({
            ...pin,
            position: { x: pin.position.x + deltaX, y: pin.position.y + deltaY }
          })),
          outputPin: { ...gate.outputPin, position: { x: gate.outputPin.position.x + deltaX, y: gate.outputPin.position.y + deltaY } }
        };
      };
      
      // Polymorphic component update
      const isGateType = Object.keys(COMPONENT_TO_GATE_TYPE).includes(draggedComponent.type);
      
      if (draggedComponent.type === 'switch') {
        setSwitches(switches.map(sw => 
          sw.id === draggedComponent.id 
            ? { ...sw, position: newPosition, outputPin: { ...sw.outputPin, position: { x: newPosition.x + 50, y: newPosition.y + 15 } } }
            : sw
        ));
      } else if (isGateType) {
        setMultiInputGates(multiInputGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'buffer') {
        setBuffers(buffers.map(buffer =>
          buffer.id === draggedComponent.id
            ? {
                ...buffer,
                position: newPosition,
                inputPin: { ...buffer.inputPin, position: { x: newPosition.x, y: newPosition.y } },
                outputPin: { ...buffer.outputPin, position: { x: newPosition.x + 50, y: newPosition.y } }
              }
            : buffer
        ));
      } else if (draggedComponent.type === 'inverter') {
        setInverters(inverters.map(inverter =>
          inverter.id === draggedComponent.id
            ? {
                ...inverter,
                position: newPosition,
                inputPin: { ...inverter.inputPin, position: { x: newPosition.x, y: newPosition.y } },
                outputPin: { ...inverter.outputPin, position: { x: newPosition.x + 50, y: newPosition.y } }
              }
            : inverter
        ));
      } else if (draggedComponent.type === 'light') {
        setLights(lights.map(light =>
          light.id === draggedComponent.id
            ? { ...light, position: newPosition, inputPin: { ...light.inputPin, position: { x: newPosition.x, y: newPosition.y } } }
            : light
        ));
      }
      
      // Update wires in real-time during drag (with small delay to ensure state is updated)
      requestAnimationFrame(() => updateWiresForMovedComponent());
      return;
    }
    
    // Handle wire preview
    if (!wiringState.isWiring || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    updateWirePreview({ x, y });
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    if (draggedComponent) {
      setDraggedComponent(null);
      // Update wires connected to the moved component
      updateWiresForMovedComponent();
      // Propagate logic after moving component
      setTimeout(() => propagateLogic(), 10);
    }
  };

  // Update wire endpoints when a component is moved
  const updateWiresForMovedComponent = () => {
    const allPins = getAllPins();
    
    // Create a map of pin ID to position for fast lookup
    const pinPositions = new Map<string, Point>();
    for (const pin of allPins) {
      pinPositions.set(pin.id, pin.position);
    }
    
    setWires(wires.map(wire => {
      if (wire.path.length < 2) return wire;
      
      let newStart = wire.path[0];
      let newEnd = wire.path[wire.path.length - 1];
      
      // Update start position if we have a pin ID reference
      if (wire.startPinId && pinPositions.has(wire.startPinId)) {
        newStart = { ...pinPositions.get(wire.startPinId)! };
      }
      
      // Update end position if we have a pin ID reference
      if (wire.endPinId && pinPositions.has(wire.endPinId)) {
        newEnd = { ...pinPositions.get(wire.endPinId)! };
      }
      
      // Update wire path
      return {
        ...wire,
        path: [newStart, newEnd]
      };
    }));
  };

  // Handle pin click to start or complete wiring
  const handlePinClick = useCallback((pin: Pin, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!wiringState.isWiring) {
      // Start wiring from this pin
      startWiring(pin);
    } else {
      // Complete wiring to this pin
      const newWire = completeWiring(pin);
      if (newWire) {
        const updatedWires = [...wires, newWire];
        setWires(updatedWires);
        // Propagate logic after wiring with updated state
        setTimeout(() => propagateLogic(switches, multiInputGates, buffers, inverters, lights, updatedWires), 10);
      }
    }
  }, [wiringState.isWiring, startWiring, completeWiring, wires, switches, multiInputGates, buffers, inverters, lights]);

  // Handle switch toggle
  const handleSwitchToggle = (id: string) => {
    const updatedSwitches = switches.map((sw) => (sw.id === id ? toggleSwitch(sw) : sw));
    setSwitches(updatedSwitches);
    // Propagate changes through circuit after state update
    setTimeout(() => propagateLogic(updatedSwitches, multiInputGates, buffers, inverters, lights, wires), 10);
  };

  // Propagate logic through the circuit - Polymorphic approach
  const propagateLogic = (
    currentSwitches = switches, 
    currentMultiInputGates = multiInputGates,
    currentBuffers = buffers, 
    currentInverters = inverters, 
    currentLights = lights, 
    currentWires = wires
  ) => {
    // Iteratively propagate through gates until stable (handles multi-level circuits)
    let updatedMultiInputGates = [...currentMultiInputGates];
    let updatedBuffers = [...currentBuffers];
    let updatedInverters = [...currentInverters];
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let changed = true;
    
    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;
      
      // Polymorphic helper function to update gate inputs and outputs
      const updateMultiInputGate = (gate: MultiInputGate) => {
        let newGate = { ...gate, inputPins: [...gate.inputPins] };
        let gateChanged = false;
        
        // Check each input pin
        newGate.inputPins = newGate.inputPins.map((inputPin) => {
          let updatedPin = { ...inputPin };
          
          // Find wires connected to this input pin
          currentWires.forEach(wire => {
            if (wire.path.length < 2) return;
            
            const wireStart = wire.path[0];
            const wireEnd = wire.path[wire.path.length - 1];
            
            // Check if wire connects to this input pin (either direction)
            const connectsToPin = 
              (Math.abs(wireEnd.x - inputPin.position.x) < 8 && 
               Math.abs(wireEnd.y - inputPin.position.y) < 8) ||
              (Math.abs(wireStart.x - inputPin.position.x) < 8 && 
               Math.abs(wireStart.y - inputPin.position.y) < 8);
               
            if (connectsToPin) {
              // Determine which end is the source (not the gate input)
              const isStartAtPin = Math.abs(wireStart.x - inputPin.position.x) < 8 && 
                                   Math.abs(wireStart.y - inputPin.position.y) < 8;
              const sourcePos = isStartAtPin ? wireEnd : wireStart;
              const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
              if (sourceState !== null && sourceState !== updatedPin.state) {
                updatedPin = { ...updatedPin, state: sourceState };
                gateChanged = true;
              }
            }
          });
          
          return updatedPin;
        });
        
        // Polymorphic output computation using gate type discriminator
        const inputStates = newGate.inputPins.map(pin => pin.state);
        const output = computeGateOutput(newGate.type, ...inputStates);
        if (output !== newGate.outputPin.state) {
          newGate = {
            ...newGate,
            outputPin: { ...newGate.outputPin, state: output }
          };
          gateChanged = true;
        }
        
        if (gateChanged) changed = true;
        return newGate;
      };
      
      // Step 1: Update all multi-input gates polymorphically
      updatedMultiInputGates = updatedMultiInputGates.map(updateMultiInputGate);
      
      // Step 1b: Update buffer inputs and outputs
      const newBuffers = updatedBuffers.map((buffer) => {
        let newBuffer = { ...buffer };
        let bufferChanged = false;
        
        // Find wire connected to input pin
        currentWires.forEach(wire => {
          if (wire.path.length < 2) return;
          
          const wireStart = wire.path[0];
          const wireEnd = wire.path[wire.path.length - 1];
          
          const connectsToInput = 
            (Math.abs(wireEnd.x - buffer.inputPin.position.x) < 8 && 
             Math.abs(wireEnd.y - buffer.inputPin.position.y) < 8) ||
            (Math.abs(wireStart.x - buffer.inputPin.position.x) < 8 && 
             Math.abs(wireStart.y - buffer.inputPin.position.y) < 8);
             
          if (connectsToInput) {
            const isStartAtInput = Math.abs(wireStart.x - buffer.inputPin.position.x) < 8 && 
                                    Math.abs(wireStart.y - buffer.inputPin.position.y) < 8;
            const sourcePos = isStartAtInput ? wireEnd : wireStart;
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
            if (sourceState !== null && sourceState !== newBuffer.inputPin.state) {
              newBuffer = {
                ...newBuffer,
                inputPin: { ...newBuffer.inputPin, state: sourceState }
              };
              bufferChanged = true;
            }
          }
        });
        
        // Compute output
        const output = computeBufferOutput(newBuffer.inputPin.state);
        if (output !== newBuffer.outputPin.state) {
          newBuffer = {
            ...newBuffer,
            outputPin: { ...newBuffer.outputPin, state: output }
          };
          bufferChanged = true;
        }
        
        if (bufferChanged) changed = true;
        return newBuffer;
      });
      
      updatedBuffers = newBuffers;
      
      // Step 1c: Update inverter inputs and outputs
      const newInverters = updatedInverters.map((inverter) => {
        let newInverter = { ...inverter };
        let inverterChanged = false;
        
        // Find wire connected to input pin
        currentWires.forEach(wire => {
          if (wire.path.length < 2) return;
          
          const wireStart = wire.path[0];
          const wireEnd = wire.path[wire.path.length - 1];
          
          const connectsToInput = 
            (Math.abs(wireEnd.x - inverter.inputPin.position.x) < 8 && 
             Math.abs(wireEnd.y - inverter.inputPin.position.y) < 8) ||
            (Math.abs(wireStart.x - inverter.inputPin.position.x) < 8 && 
             Math.abs(wireStart.y - inverter.inputPin.position.y) < 8);
             
          if (connectsToInput) {
            const isStartAtInput = Math.abs(wireStart.x - inverter.inputPin.position.x) < 8 && 
                                    Math.abs(wireStart.y - inverter.inputPin.position.y) < 8;
            const sourcePos = isStartAtInput ? wireEnd : wireStart;
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
            if (sourceState !== null && sourceState !== newInverter.inputPin.state) {
              newInverter = {
                ...newInverter,
                inputPin: { ...newInverter.inputPin, state: sourceState }
              };
              inverterChanged = true;
            }
          }
        });
        
        // Compute output
        const output = computeInverterOutput(newInverter.inputPin.state);
        if (output !== newInverter.outputPin.state) {
          newInverter = {
            ...newInverter,
            outputPin: { ...newInverter.outputPin, state: output }
          };
          inverterChanged = true;
        }
        
        if (inverterChanged) changed = true;
        return newInverter;
      });
      
      updatedInverters = newInverters;
    }
    
    setMultiInputGates(updatedMultiInputGates);
    setBuffers(updatedBuffers);
    setInverters(updatedInverters);
    
    // Step 1.5: Update wire colors based on logic levels
    const updatedWires = currentWires.map(wire => {
      if (wire.path.length < 2) return wire;
      
      const wireStart = wire.path[0];
      const wireEnd = wire.path[wire.path.length - 1];
      
      // Find the source pin (could be at either end)
      const startState = findPinStateAtPosition(wireStart, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
      const endState = findPinStateAtPosition(wireEnd, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
      
      // Use whichever end has a source (output pin)
      const logicLevel = startState !== null ? startState : (endState !== null ? endState : LogicLevel.HI_Z);
      
      return {
        ...wire,
        logicLevel
      };
    });
    
    setWires(updatedWires);
    
    // Step 2: Update light states based on connected wires
    const updatedLights = currentLights.map((light) => {
      let inputState = light.inputValue;
      
      updatedWires.forEach(wire => {
        if (wire.path.length < 2) return;
        
        const wireStart = wire.path[0];
        const wireEnd = wire.path[wire.path.length - 1];
        
        // Check if wire connects to light's input pin (either direction)
        const connectsToLight = 
          (Math.abs(wireEnd.x - light.inputPin.position.x) < 8 && 
           Math.abs(wireEnd.y - light.inputPin.position.y) < 8) ||
          (Math.abs(wireStart.x - light.inputPin.position.x) < 8 && 
           Math.abs(wireStart.y - light.inputPin.position.y) < 8);
           
        if (connectsToLight) {
          const isStartAtLight = Math.abs(wireStart.x - light.inputPin.position.x) < 8 && 
                                  Math.abs(wireStart.y - light.inputPin.position.y) < 8;
          const sourcePos = isStartAtLight ? wireEnd : wireStart;
          const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedMultiInputGates, updatedBuffers, updatedInverters);
          if (sourceState !== null) {
            inputState = sourceState;
          }
        }
      });
      
      return {
        ...light,
        inputValue: inputState,
        inputPin: { ...light.inputPin, state: inputState }
      };
    });
    
    setLights(updatedLights);
  };

  // Find the logic state at a given position - Polymorphic approach
  const findPinStateAtPosition = (
    pos: Point, 
    currentSwitches = switches, 
    currentMultiInputGates = multiInputGates,
    currentBuffers = buffers, 
    currentInverters = inverters
  ) => {
    // Check switches
    for (const sw of currentSwitches) {
      if (Math.abs(pos.x - sw.outputPin.position.x) < 8 && 
          Math.abs(pos.y - sw.outputPin.position.y) < 8) {
        return sw.outputPin.state;
      }
    }
    
    // Polymorphic gate check - single unified loop
    for (const gate of currentMultiInputGates) {
      if (Math.abs(pos.x - gate.outputPin.position.x) < 8 && 
          Math.abs(pos.y - gate.outputPin.position.y) < 8) {
        return gate.outputPin.state;
      }
    }
    
    // Check buffers
    for (const buffer of currentBuffers) {
      if (Math.abs(pos.x - buffer.outputPin.position.x) < 8 && 
          Math.abs(pos.y - buffer.outputPin.position.y) < 8) {
        return buffer.outputPin.state;
      }
    }
    
    // Check inverters
    for (const inverter of currentInverters) {
      if (Math.abs(pos.x - inverter.outputPin.position.x) < 8 && 
          Math.abs(pos.y - inverter.outputPin.position.y) < 8) {
        return inverter.outputPin.state;
      }
    }
    
    return null;
  };

  // Get all pins for rendering - Polymorphic approach
  const getAllPins = (): Pin[] => {
    const pins: Pin[] = [];
    
    switches.forEach(sw => pins.push(sw.outputPin));
    // Unified multi-input gate iteration
    multiInputGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    buffers.forEach(buffer => {
      pins.push(buffer.inputPin, buffer.outputPin);
    });
    inverters.forEach(inverter => {
      pins.push(inverter.inputPin, inverter.outputPin);
    });
    lights.forEach(light => pins.push(light.inputPin));
    
    return pins;
  };

  return (
    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: '2px solid #ddd',
          backgroundColor: '#fafafa',
          cursor: wiringState.isWiring ? 'crosshair' : selectedComponent ? 'crosshair' : 'default',
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Render wires */}
        {wires.map((wire) => (
          <WireComponent 
            key={wire.id} 
            wire={wire}
            onContextMenu={(e, wireId) => handleComponentRightClick(e, 'wire', wireId)}
          />
        ))}

        {/* Render switches */}
        {switches.map((sw) => (
          <g
            key={sw.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'switch', sw.id, sw.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'switch', sw.id)}
            style={{ cursor: draggedComponent?.id === sw.id ? 'grabbing' : 'grab' }}
          >
            <SwitchComponent component={sw} onToggle={handleSwitchToggle} />
          </g>
        ))}

        {/* Render multi-input gates polymorphically */}
        {multiInputGates.map((gate) => {
          // Map gate.type to component type for event handlers
          const gateTypeToComponent: Record<MultiInputGate['type'], string> = {
            'and': 'and-gate',
            'or': 'or-gate',
            'nand': 'nand-gate',
            'nor': 'nor-gate',
            'xor': 'xor-gate',
            'xnor': 'xnor-gate',
          };
          const componentType = gateTypeToComponent[gate.type];
          
          return (
            <g
              key={gate.id}
              onMouseDown={(e) => handleComponentMouseDown(e, componentType, gate.id, gate.position)}
              onContextMenu={(e) => handleComponentRightClick(e, componentType, gate.id)}
              style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
            >
              <MultiInputGateComponent component={gate} />
            </g>
          );
        })}

        {/* Render buffers */}
        {buffers.map((buffer) => (
          <g
            key={buffer.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'buffer', buffer.id, buffer.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'buffer', buffer.id)}
            style={{ cursor: draggedComponent?.id === buffer.id ? 'grabbing' : 'grab' }}
          >
            <BufferComponent component={buffer} />
          </g>
        ))}

        {/* Render inverters */}
        {inverters.map((inverter) => (
          <g
            key={inverter.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'inverter', inverter.id, inverter.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'inverter', inverter.id)}
            style={{ cursor: draggedComponent?.id === inverter.id ? 'grabbing' : 'grab' }}
          >
            <InverterComponent component={inverter} />
          </g>
        ))}

        {/* Render lights */}
        {lights.map((light) => (
          <g
            key={light.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'light', light.id, light.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'light', light.id)}
            style={{ cursor: draggedComponent?.id === light.id ? 'grabbing' : 'grab' }}
          >
            <LightIndicatorComponent component={light} />
          </g>
        ))}

        {/* Render interactive pins */}
        {getAllPins().map((pin) => (
          <PinComponent
            key={pin.id}
            pin={pin}
            onPinClick={handlePinClick}
            isHighlighted={wiringState.startPin?.id === pin.id}
          />
        ))}

        {/* Render wire preview during wiring */}
        {wiringState.isWiring && wiringState.previewPoints.length === 2 && (() => {
          const start = wiringState.previewPoints[0];
          const end = wiringState.previewPoints[1];
          const dx = end.x - start.x;
          const cx = start.x + dx / 2;
          const cy = start.y;
          const curvePath = `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
          
          return (
            <path
              d={curvePath}
              stroke="#FFD700"
              strokeWidth={5}
              strokeDasharray="8,4"
              opacity={0.8}
              fill="none"
              strokeLinecap="round"
              pointerEvents="none"
            />
          );
        })()}
      </svg>

      {/* Status bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '8px 16px',
          backgroundColor: '#333',
          color: 'white',
          fontSize: '12px',
        }}
      >
        {wiringState.isWiring
          ? 'Click on a pin to complete wire connection (click empty space to cancel)'
          : selectedComponent
          ? `Click on canvas to place ${selectedComponent}`
          : 'Select a component from the palette or click a pin to start wiring'}
        {' | '}
        Components: {switches.length} switches, {multiInputGates.length} gates, {buffers.length} buffers, {inverters.length} inverters, {lights.length} lights, {wires.length} wires
      </div>

      {/* Gate configuration dialog */}
      <GateConfigDialog
        isOpen={showGateDialog}
        gateType={pendingGateType || undefined}
        initialNumInputs={editingGateId ? currentGateNumInputs : 2}
        initialName={editingGateId ? currentGateName : ''}
        isEditing={!!editingGateId}
        onConfirm={handleGateConfigConfirm}
        onCancel={handleGateConfigCancel}
      />

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={
            contextMenu.componentType === 'wire' ? [
              {
                label: 'Delete Wire',
                onClick: () => handleDeleteWire(contextMenu.componentId)
              }
            ] : [
              {
                label: 'Delete',
                onClick: () => handleDeleteComponent(contextMenu.componentType, contextMenu.componentId)
              },
              ...(['and-gate', 'or-gate', 'nand-gate', 'nor-gate', 'xor-gate', 'xnor-gate'].includes(contextMenu.componentType) ? [{
                label: 'Change Inputs...',
                onClick: () => handleChangeInputs(contextMenu.componentId)
              },
              {
                label: truthTables.has(contextMenu.componentId) ? 'Hide Truth Table' : 'Show Truth Table',
                onClick: () => handleToggleTruthTable(contextMenu.componentType, contextMenu.componentId)
              }] : []),
              {
                label: 'Duplicate',
                onClick: () => console.log('Duplicate not yet implemented'),
                disabled: true
              },
              { separator: true },
              {
                label: 'Rotate 90°',
                onClick: () => handleRotateComponent(contextMenu.componentType, contextMenu.componentId),
                disabled: true
              }
            ]
          }
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {/* Truth table panels - rendered as floating panels next to gates */}
      {Array.from(truthTables.entries()).map(([gateId, table]) => {
        if (!table.isVisible) return null;
        
        // Get the stored position for this truth table
        const panelPosition = truthTablePositions.get(gateId);
        if (!panelPosition) return null;
        
        return (
          <TruthTablePanel
            key={gateId}
            table={table}
            position={panelPosition}
            onClose={() => handleToggleTruthTable('', gateId)}
            onPositionChange={(newPos) => handleTruthTablePositionChange(gateId, newPos)}
          />
        );
      })}
    </div>
  );
};
