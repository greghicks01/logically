import React, { useState, useRef, useCallback } from 'react';
import { Switch, createSwitch, toggleSwitch } from '../../models/Switch';
import { ANDGate, createANDGate, computeANDOutput } from '../../models/ANDGate';
import { ORGate, createORGate, computeOROutput } from '../../models/ORGate';
import { NANDGate, createNANDGate, computeNANDOutput } from '../../models/NANDGate';
import { NORGate, createNORGate, computeNOROutput } from '../../models/NORGate';
import { XORGate, createXORGate, computeXOROutput } from '../../models/XORGate';
import { XNORGate, createXNORGate, computeXNOROutput } from '../../models/XNORGate';
import { Buffer, createBuffer, computeBufferOutput } from '../../models/Buffer';
import { Inverter, createInverter, computeInverterOutput } from '../../models/Inverter';
import { LightIndicator, createLightIndicator } from '../../models/LightIndicator';
import { Wire } from '../../models/Wire';
import { LogicLevel } from '../../models/LogicLevel';
import { SwitchComponent } from '../Switch/SwitchComponent';
import { ANDGateComponent } from '../ANDGate/ANDGateComponent';
import { ORGateComponent } from '../ORGate/ORGateComponent';
import { NANDGateComponent } from '../NANDGate/NANDGateComponent';
import { NORGateComponent } from '../NORGate/NORGateComponent';
import { XORGateComponent } from '../XORGate/XORGateComponent';
import { XNORGateComponent } from '../XNORGate/XNORGateComponent';
import { BufferComponent } from '../Buffer/BufferComponent';
import { InverterComponent } from '../Inverter/InverterComponent';
import { LightIndicatorComponent } from '../LightIndicator/LightIndicatorComponent';
import { WireComponent } from '../WireComponent/WireComponent';
import { PinComponent } from '../Pin/PinComponent';
import { GateConfigDialog } from '../GateConfigDialog/GateConfigDialog';
import { ContextMenu, ContextMenuOption } from '../ContextMenu/ContextMenu';
import { ComponentType } from '../ComponentPalette/ComponentPalette';
import { Point } from '../../models/Point';
import { Pin } from '../../models/Pin';
import { useWiring } from '../../hooks/useWiring';

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
  const [switches, setSwitches] = useState<Switch[]>([]);
  const [andGates, setAndGates] = useState<ANDGate[]>([]);
  const [orGates, setOrGates] = useState<ORGate[]>([]);
  const [nandGates, setNandGates] = useState<NANDGate[]>([]);
  const [norGates, setNorGates] = useState<NORGate[]>([]);
  const [xorGates, setXorGates] = useState<XORGate[]>([]);
  const [xnorGates, setXnorGates] = useState<XNORGate[]>([]);
  const [buffers, setBuffers] = useState<Buffer[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [lights, setLights] = useState<LightIndicator[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
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
    
    // If creating a new gate
    if (pendingGatePosition && pendingGateType) {
      if (pendingGateType === 'and-gate') {
        const newGate = createANDGate(generateId('and'), pendingGatePosition, config.numInputs, config.name);
        setAndGates([...andGates, newGate]);
      } else if (pendingGateType === 'or-gate') {
        const newGate = createORGate(generateId('or'), pendingGatePosition, config.numInputs, config.name);
        setOrGates([...orGates, newGate]);
      } else if (pendingGateType === 'nand-gate') {
        const newGate = createNANDGate(generateId('nand'), pendingGatePosition, config.numInputs, config.name);
        setNandGates([...nandGates, newGate]);
      } else if (pendingGateType === 'nor-gate') {
        const newGate = createNORGate(generateId('nor'), pendingGatePosition, config.numInputs, config.name);
        setNorGates([...norGates, newGate]);
      } else if (pendingGateType === 'xor-gate') {
        const newGate = createXORGate(generateId('xor'), pendingGatePosition, config.numInputs, config.name);
        setXorGates([...xorGates, newGate]);
      } else if (pendingGateType === 'xnor-gate') {
        const newGate = createXNORGate(generateId('xnor'), pendingGatePosition, config.numInputs, config.name);
        setXnorGates([...xnorGates, newGate]);
      }
      onComponentPlaced();
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
    
    if (componentType === 'switch') {
      const component = switches.find(sw => sw.id === componentId);
      if (component) componentPins.push(component.outputPin);
      setSwitches(switches.filter(sw => sw.id !== componentId));
    } else if (componentType === 'and-gate') {
      const component = andGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setAndGates(andGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'or-gate') {
      const component = orGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setOrGates(orGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'nand-gate') {
      const component = nandGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setNandGates(nandGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'nor-gate') {
      const component = norGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setNorGates(norGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'xor-gate') {
      const component = xorGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setXorGates(xorGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'xnor-gate') {
      const component = xnorGates.find(gate => gate.id === componentId);
      if (component) componentPins.push(...component.inputPins, component.outputPin);
      setXnorGates(xnorGates.filter(gate => gate.id !== componentId));
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
    propagateLogic(switches, andGates, orGates, nandGates, norGates, xorGates, xnorGates, buffers, inverters, lights, wires.filter(wire => wire.id !== wireId));
  };

  // Handle rotate component (90 degrees clockwise)
  const handleRotateComponent = (componentType: string, componentId: string) => {
    // Rotation could be implemented by tracking rotation state
    // For now, we'll skip this as it requires pin position recalculation
    console.log('Rotate:', componentType, componentId);
  };

  // Handle change number of inputs for multi-input gates
  const handleChangeInputs = (gateId: string) => {
    // Try to find the gate in any of the gate arrays
    let gate = andGates.find(g => g.id === gateId);
    let gateType: ComponentType = 'and-gate';
    
    if (!gate) {
      gate = orGates.find(g => g.id === gateId);
      gateType = 'or-gate';
    }
    if (!gate) {
      gate = nandGates.find(g => g.id === gateId);
      gateType = 'nand-gate';
    }
    if (!gate) {
      gate = norGates.find(g => g.id === gateId);
      gateType = 'nor-gate';
    }
    if (!gate) {
      gate = xorGates.find(g => g.id === gateId);
      gateType = 'xor-gate';
    }
    if (!gate) {
      gate = xnorGates.find(g => g.id === gateId);
      gateType = 'xnor-gate';
    }
    
    if (!gate) return;
    
    // Open dialog with current gate settings
    setEditingGateId(gateId);
    setPendingGateType(gateType);
    setCurrentGateNumInputs(gate.numInputs);
    setCurrentGateName(gate.name || '');
    setShowGateDialog(true);
  };

  // Handle gate config changes from dialog
  const handleGateConfigUpdate = (config: { numInputs: number; name?: string }) => {
    if (!editingGateId) return;
    
    const numInputs = config.numInputs;
    
    // Helper function to recreate gate with new number of inputs
    const updateGateInputs = (g: any) => {
      if (!g || g.id !== editingGateId) return g;
      
      // Recreate the gate using its factory function with parametric positioning
      const position = g.position;
      const name = config.name || g.name;
      
      // Preserve existing pin states
      const preservedStates = g.inputPins.map((pin: Pin) => pin.state);
      
      // Recreate gate based on type
      let newGate;
      if (g.id.includes('and') && !g.id.includes('nand')) {
        newGate = createANDGate(g.id, position, numInputs, name);
      } else if (g.id.includes('or') && !g.id.includes('nor') && !g.id.includes('xor')) {
        newGate = createORGate(g.id, position, numInputs, name);
      } else if (g.id.includes('nand')) {
        newGate = createNANDGate(g.id, position, numInputs, name);
      } else if (g.id.includes('nor')) {
        newGate = createNORGate(g.id, position, numInputs, name);
      } else if (g.id.includes('xor') && !g.id.includes('xnor')) {
        newGate = createXORGate(g.id, position, numInputs, name);
      } else if (g.id.includes('xnor')) {
        newGate = createXNORGate(g.id, position, numInputs, name);
      } else {
        return g; // Unknown type, return unchanged
      }
      
      // Restore preserved pin states
      for (let i = 0; i < Math.min(preservedStates.length, newGate.inputPins.length); i++) {
        newGate.inputPins[i].state = preservedStates[i];
      }
      
      return newGate;
    };
    
    // Collect updated gate arrays
    let updatedSwitches = switches;
    let updatedAndGates = andGates;
    let updatedOrGates = orGates;
    let updatedNandGates = nandGates;
    let updatedNorGates = norGates;
    let updatedXorGates = xorGates;
    let updatedXnorGates = xnorGates;
    let updatedBuffers = buffers;
    let updatedInverters = inverters;
    let updatedLights = lights;
    
    // Update the appropriate gate array based on pendingGateType
    if (pendingGateType === 'and-gate') {
      updatedAndGates = andGates.map(g => updateGateInputs(g) as ANDGate);
    } else if (pendingGateType === 'or-gate') {
      updatedOrGates = orGates.map(g => updateGateInputs(g) as ORGate);
    } else if (pendingGateType === 'nand-gate') {
      updatedNandGates = nandGates.map(g => updateGateInputs(g) as NANDGate);
    } else if (pendingGateType === 'nor-gate') {
      updatedNorGates = norGates.map(g => updateGateInputs(g) as NORGate);
    } else if (pendingGateType === 'xor-gate') {
      updatedXorGates = xorGates.map(g => updateGateInputs(g) as XORGate);
    } else if (pendingGateType === 'xnor-gate') {
      updatedXnorGates = xnorGates.map(g => updateGateInputs(g) as XNORGate);
    }
    
    // Update wires: remove wires connected to deleted pins, update pin references
    const updatedWires = wires.filter(wire => {
      // Find the updated gate that this wire might be connected to
      const findUpdatedGate = (gateArrays: any[][]) => {
        for (const gateArray of gateArrays) {
          const gate = gateArray.find(g => g.id === editingGateId);
          if (gate) return gate;
        }
        return null;
      };
      const updatedGate = findUpdatedGate([updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates]);
      if (!updatedGate) return true;
      const hasFromPin = updatedGate.inputPins.some(p => p.id === wire.fromPin.id) || updatedGate.outputPin.id === wire.fromPin.id;
      const hasToPin = updatedGate.inputPins.some(p => p.id === wire.toPin.id) || updatedGate.outputPin.id === wire.toPin.id;
      return hasFromPin && hasToPin;
    }).map(wire => {
      let newFromPin = wire.fromPin;
      let newToPin = wire.toPin;
      // Find the updated gate
      const findUpdatedGate = (gateArrays: any[][]) => {
        for (const gateArray of gateArrays) {
          const gate = gateArray.find(g => g.id === editingGateId);
          if (gate) return gate;
        }
        return null;
      };
      const updatedGate = findUpdatedGate([updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates]);
      if (updatedGate) {
        const fromPin = updatedGate.inputPins.find(p => p.id === wire.fromPin.id) || (updatedGate.outputPin.id === wire.fromPin.id ? updatedGate.outputPin : null);
        if (fromPin) newFromPin = fromPin;
        const toPin = updatedGate.inputPins.find(p => p.id === wire.toPin.id) || (updatedGate.outputPin.id === wire.toPin.id ? updatedGate.outputPin : null);
        if (toPin) newToPin = toPin;
      }
      return { ...wire, fromPin: newFromPin, toPin: newToPin };
    });
    
    // Set all updated states
    setSwitches(updatedSwitches);
    setAndGates(updatedAndGates);
    setOrGates(updatedOrGates);
    setNandGates(updatedNandGates);
    setNorGates(updatedNorGates);
    setXorGates(updatedXorGates);
    setXnorGates(updatedXnorGates);
    setBuffers(updatedBuffers);
    setInverters(updatedInverters);
    setLights(updatedLights);
    setWires(updatedWires);
    
    // Propagate logic with updated state
    propagateLogic(updatedSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters, updatedLights, updatedWires);
    
    // Reset editing state
    setEditingGateId(null);
    setShowGateDialog(false);
    setPendingGateType(null);
    setCurrentGateNumInputs(2);
    setCurrentGateName('');
  };

  // Handle mouse move for wire preview
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    // Handle dragging
    if (draggedComponent && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - draggedComponent.offset.x;
      const y = event.clientY - rect.top - draggedComponent.offset.y;
      const newPosition: Point = { x, y };
      
      // Helper function to update multi-input gate positions
      const updateGatePosition = (gate: ANDGate | ORGate | NANDGate | NORGate | XORGate | XNORGate) => {
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
      
      // Update component position
      if (draggedComponent.type === 'switch') {
        setSwitches(switches.map(sw => 
          sw.id === draggedComponent.id 
            ? { ...sw, position: newPosition, outputPin: { ...sw.outputPin, position: { x: newPosition.x + 50, y: newPosition.y + 15 } } }
            : sw
        ));
      } else if (draggedComponent.type === 'and-gate') {
        setAndGates(andGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'or-gate') {
        setOrGates(orGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'nand-gate') {
        setNandGates(nandGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'nor-gate') {
        setNorGates(norGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'xor-gate') {
        setXorGates(xorGates.map(gate => 
          gate.id === draggedComponent.id ? updateGatePosition(gate) : gate
        ));
      } else if (draggedComponent.type === 'xnor-gate') {
        setXnorGates(xnorGates.map(gate => 
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
        setTimeout(() => propagateLogic(switches, andGates, orGates, nandGates, norGates, xorGates, xnorGates, buffers, inverters, lights, updatedWires), 10);
      }
    }
  }, [wiringState.isWiring, startWiring, completeWiring, wires, switches, andGates, orGates, nandGates, norGates, xorGates, xnorGates, buffers, inverters, lights]);

  // Handle switch toggle
  const handleSwitchToggle = (id: string) => {
    const updatedSwitches = switches.map((sw) => (sw.id === id ? toggleSwitch(sw) : sw));
    setSwitches(updatedSwitches);
    // Propagate changes through circuit after state update
    setTimeout(() => propagateLogic(updatedSwitches, andGates, orGates, nandGates, norGates, xorGates, xnorGates, buffers, inverters, lights, wires), 10);
  };

  // Propagate logic through the circuit
  const propagateLogic = (
    currentSwitches = switches, 
    currentAndGates = andGates,
    currentOrGates = orGates,
    currentNandGates = nandGates,
    currentNorGates = norGates,
    currentXorGates = xorGates,
    currentXnorGates = xnorGates,
    currentBuffers = buffers, 
    currentInverters = inverters, 
    currentLights = lights, 
    currentWires = wires
  ) => {
    // Iteratively propagate through gates until stable (handles multi-level circuits)
    let updatedAndGates = [...currentAndGates];
    let updatedOrGates = [...currentOrGates];
    let updatedNandGates = [...currentNandGates];
    let updatedNorGates = [...currentNorGates];
    let updatedXorGates = [...currentXorGates];
    let updatedXnorGates = [...currentXnorGates];
    let updatedBuffers = [...currentBuffers];
    let updatedInverters = [...currentInverters];
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let changed = true;
    
    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;
      
      // Helper function to update gate inputs and outputs
      const updateMultiInputGate = (gate: ANDGate | ORGate | NANDGate | NORGate | XORGate | XNORGate, computeOutput: (...inputs: LogicLevel[]) => LogicLevel) => {
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
              const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
              if (sourceState !== null && sourceState !== updatedPin.state) {
                updatedPin = { ...updatedPin, state: sourceState };
                gateChanged = true;
              }
            }
          });
          
          return updatedPin;
        });
        
        // Compute output based on all inputs
        const inputStates = newGate.inputPins.map(pin => pin.state);
        const output = computeOutput(...inputStates);
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
      
      // Step 1: Update all gate types
      updatedAndGates = updatedAndGates.map(gate => updateMultiInputGate(gate, computeANDOutput));
      updatedOrGates = updatedOrGates.map(gate => updateMultiInputGate(gate, computeOROutput));
      updatedNandGates = updatedNandGates.map(gate => updateMultiInputGate(gate, computeNANDOutput));
      updatedNorGates = updatedNorGates.map(gate => updateMultiInputGate(gate, computeNOROutput));
      updatedXorGates = updatedXorGates.map(gate => updateMultiInputGate(gate, computeXOROutput));
      updatedXnorGates = updatedXnorGates.map(gate => updateMultiInputGate(gate, computeXNOROutput));
      
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
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
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
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
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
    
    setAndGates(updatedAndGates);
    setOrGates(updatedOrGates);
    setNandGates(updatedNandGates);
    setNorGates(updatedNorGates);
    setXorGates(updatedXorGates);
    setXnorGates(updatedXnorGates);
    setBuffers(updatedBuffers);
    setInverters(updatedInverters);
    
    // Step 1.5: Update wire colors based on logic levels
    const updatedWires = currentWires.map(wire => {
      if (wire.path.length < 2) return wire;
      
      const wireStart = wire.path[0];
      const wireEnd = wire.path[wire.path.length - 1];
      
      // Find the source pin (could be at either end)
      const startState = findPinStateAtPosition(wireStart, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
      const endState = findPinStateAtPosition(wireEnd, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
      
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
          const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedAndGates, updatedOrGates, updatedNandGates, updatedNorGates, updatedXorGates, updatedXnorGates, updatedBuffers, updatedInverters);
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

  // Find the logic state at a given position
  const findPinStateAtPosition = (
    pos: Point, 
    currentSwitches = switches, 
    currentAndGates = andGates,
    currentOrGates = orGates,
    currentNandGates = nandGates,
    currentNorGates = norGates,
    currentXorGates = xorGates,
    currentXnorGates = xnorGates,
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
    
    // Check all gate types
    const allGates = [
      ...currentAndGates,
      ...currentOrGates,
      ...currentNandGates,
      ...currentNorGates,
      ...currentXorGates,
      ...currentXnorGates
    ];
    for (const gate of allGates) {
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

  // Get all pins for rendering
  const getAllPins = (): Pin[] => {
    const pins: Pin[] = [];
    
    switches.forEach(sw => pins.push(sw.outputPin));
    andGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    orGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    nandGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    norGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    xorGates.forEach(gate => {
      pins.push(...gate.inputPins, gate.outputPin);
    });
    xnorGates.forEach(gate => {
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

        {/* Render AND gates */}
        {andGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'and-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'and-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <ANDGateComponent component={gate} />
          </g>
        ))}

        {/* Render OR gates */}
        {orGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'or-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'or-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <ORGateComponent component={gate} />
          </g>
        ))}

        {/* Render NAND gates */}
        {nandGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'nand-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'nand-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <NANDGateComponent component={gate} />
          </g>
        ))}

        {/* Render NOR gates */}
        {norGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'nor-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'nor-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <NORGateComponent component={gate} />
          </g>
        ))}

        {/* Render XOR gates */}
        {xorGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'xor-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'xor-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <XORGateComponent component={gate} />
          </g>
        ))}

        {/* Render XNOR gates */}
        {xnorGates.map((gate) => (
          <g
            key={gate.id}
            onMouseDown={(e) => handleComponentMouseDown(e, 'xnor-gate', gate.id, gate.position)}
            onContextMenu={(e) => handleComponentRightClick(e, 'xnor-gate', gate.id)}
            style={{ cursor: draggedComponent?.id === gate.id ? 'grabbing' : 'grab' }}
          >
            <XNORGateComponent component={gate} />
          </g>
        ))}

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
        Components: {switches.length} switches, {andGates.length + orGates.length + nandGates.length + norGates.length + xorGates.length + xnorGates.length} gates, {buffers.length} buffers, {inverters.length} inverters, {lights.length} lights, {wires.length} wires
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
    </div>
  );
};
