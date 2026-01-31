import React, { useState, useRef, useCallback } from 'react';
import { Switch, createSwitch, toggleSwitch } from '../../models/Switch';
import { ANDGate, createANDGate, computeANDOutput } from '../../models/ANDGate';
import { Buffer, createBuffer, computeBufferOutput } from '../../models/Buffer';
import { Inverter, createInverter, computeInverterOutput } from '../../models/Inverter';
import { LightIndicator, createLightIndicator } from '../../models/LightIndicator';
import { Wire } from '../../models/Wire';
import { SwitchComponent } from '../Switch/SwitchComponent';
import { ANDGateComponent } from '../ANDGate/ANDGateComponent';
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
  const [buffers, setBuffers] = useState<Buffer[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [lights, setLights] = useState<LightIndicator[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
  // Gate configuration dialog state
  const [showGateDialog, setShowGateDialog] = useState(false);
  const [pendingGatePosition, setPendingGatePosition] = useState<Point | null>(null);
  
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
    } else if (selectedComponent === 'and-gate') {
      // Show dialog for gate configuration
      setPendingGatePosition(position);
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
    if (pendingGatePosition) {
      const newGate = createANDGate(generateId('and'), pendingGatePosition, config.numInputs, config.name);
      setAndGates([...andGates, newGate]);
      onComponentPlaced();
    }
    setShowGateDialog(false);
    setPendingGatePosition(null);
  };

  const handleGateConfigCancel = () => {
    setShowGateDialog(false);
    setPendingGatePosition(null);
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
    if (componentType === 'switch') {
      setSwitches(switches.filter(sw => sw.id !== componentId));
    } else if (componentType === 'and-gate') {
      setAndGates(andGates.filter(gate => gate.id !== componentId));
    } else if (componentType === 'buffer') {
      setBuffers(buffers.filter(buffer => buffer.id !== componentId));
    } else if (componentType === 'inverter') {
      setInverters(inverters.filter(inverter => inverter.id !== componentId));
    } else if (componentType === 'light') {
      setLights(lights.filter(light => light.id !== componentId));
    }
    
    // Remove connected wires
    setWires(wires.filter(wire => {
      // Check if wire is connected to this component's pins
      // For simplicity, we'll keep all wires for now
      return true;
    }));
  };

  // Handle rotate component (90 degrees clockwise)
  const handleRotateComponent = (componentType: string, componentId: string) => {
    // Rotation could be implemented by tracking rotation state
    // For now, we'll skip this as it requires pin position recalculation
    console.log('Rotate:', componentType, componentId);
  };

  // Handle change number of inputs for multi-input gates
  const handleChangeInputs = (gateId: string) => {
    const gate = andGates.find(g => g.id === gateId);
    if (!gate) return;
    
    const newNumInputs = prompt(`Enter number of inputs (2-8):`, gate.numInputs.toString());
    if (!newNumInputs) return;
    
    const numInputs = Math.min(Math.max(parseInt(newNumInputs), 2), 8);
    if (isNaN(numInputs)) return;
    
    // Recreate gate with new number of inputs
    setAndGates(andGates.map(g => {
      if (g.id !== gateId) return g;
      
      const inputSpacing = 15;
      const totalHeight = Math.max(40, (numInputs - 1) * inputSpacing + 20);
      const startY = g.position.y - totalHeight / 2;
      
      // Create new input pins
      const newInputPins: Pin[] = [];
      for (let i = 0; i < numInputs; i++) {
        // Try to preserve existing pin states
        const existingPin = g.inputPins[i];
        newInputPins.push({
          id: existingPin?.id || `${g.id}-in${i}`,
          label: String.fromCharCode(65 + i),
          position: { x: g.position.x, y: startY + i * inputSpacing },
          state: existingPin?.state || LogicLevel.LOW,
        });
      }
      
      return {
        ...g,
        numInputs,
        inputPins: newInputPins,
        outputPin: { ...g.outputPin, position: { x: g.position.x + 60, y: g.position.y } }
      };
    }));
    
    // Propagate logic after change
    setTimeout(() => propagateLogic(), 10);
  };

  // Handle mouse move for wire preview
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    // Handle dragging
    if (draggedComponent && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left - draggedComponent.offset.x;
      const y = event.clientY - rect.top - draggedComponent.offset.y;
      const newPosition: Point = { x, y };
      
      // Update component position
      if (draggedComponent.type === 'switch') {
        setSwitches(switches.map(sw => 
          sw.id === draggedComponent.id 
            ? { ...sw, position: newPosition, outputPin: { ...sw.outputPin, position: { x: newPosition.x + 60, y: newPosition.y + 20 } } }
            : sw
        ));
      } else if (draggedComponent.type === 'and-gate') {
        setAndGates(andGates.map(gate => {
          if (gate.id !== draggedComponent.id) return gate;
          
          // Recalculate pin positions based on new gate position
          const inputSpacing = 15;
          const totalHeight = Math.max(40, (gate.numInputs - 1) * inputSpacing + 20);
          const startY = newPosition.y - totalHeight / 2;
          
          return {
            ...gate,
            position: newPosition,
            inputPins: gate.inputPins.map((pin, i) => ({
              ...pin,
              position: { x: newPosition.x, y: startY + i * inputSpacing }
            })),
            outputPin: { ...gate.outputPin, position: { x: newPosition.x + 60, y: newPosition.y } }
          };
        }));
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
    setWires(wires.map(wire => {
      if (wire.path.length < 2) return wire;
      
      const wireStart = wire.path[0];
      const wireEnd = wire.path[wire.path.length - 1];
      const allPins = getAllPins();
      
      // Find if start or end connects to any pin
      let newStart = wireStart;
      let newEnd = wireEnd;
      
      for (const pin of allPins) {
        // Check if wire start was connected to this pin
        if (Math.abs(wireStart.x - pin.position.x) < 8 && 
            Math.abs(wireStart.y - pin.position.y) < 8) {
          newStart = { ...pin.position };
        }
        // Check if wire end was connected to this pin
        if (Math.abs(wireEnd.x - pin.position.x) < 8 && 
            Math.abs(wireEnd.y - pin.position.y) < 8) {
          newEnd = { ...pin.position };
        }
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
        setTimeout(() => propagateLogic(switches, andGates, buffers, inverters, lights, updatedWires), 10);
      }
    }
  }, [wiringState.isWiring, startWiring, completeWiring, wires, switches, andGates, buffers, inverters, lights]);

  // Handle switch toggle
  const handleSwitchToggle = (id: string) => {
    const updatedSwitches = switches.map((sw) => (sw.id === id ? toggleSwitch(sw) : sw));
    setSwitches(updatedSwitches);
    // Propagate changes through circuit after state update
    setTimeout(() => propagateLogic(updatedSwitches, andGates, buffers, inverters, lights, wires), 10);
  };

  // Propagate logic through the circuit
  const propagateLogic = (currentSwitches = switches, currentGates = andGates, currentBuffers = buffers, currentInverters = inverters, currentLights = lights, currentWires = wires) => {
    // Iteratively propagate through gates until stable (handles multi-level circuits)
    let updatedGates = [...currentGates];
    let updatedBuffers = [...currentBuffers];
    let updatedInverters = [...currentInverters];
    let maxIterations = 10; // Prevent infinite loops
    let iteration = 0;
    let changed = true;
    
    while (changed && iteration < maxIterations) {
      changed = false;
      iteration++;
      
      // Step 1: Update AND gate inputs based on connected wires
      const newGates = updatedGates.map((gate) => {
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
              const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedGates);
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
        const output = computeANDOutput(...inputStates);
        if (output !== newGate.outputPin.state) {
          newGate = {
            ...newGate,
            outputPin: { ...newGate.outputPin, state: output }
          };
          gateChanged = true;
        }
        
        if (gateChanged) changed = true;
        return newGate;
      });
      
      updatedGates = newGates;
      
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
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedGates, updatedBuffers, updatedInverters);
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
            const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedGates, updatedBuffers, updatedInverters);
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
    
    setAndGates(updatedGates);
    setBuffers(updatedBuffers);
    setInverters(updatedInverters);
    
    // Step 1.5: Update wire colors based on logic levels
    const updatedWires = currentWires.map(wire => {
      if (wire.path.length < 2) return wire;
      
      const wireStart = wire.path[0];
      const wireEnd = wire.path[wire.path.length - 1];
      
      // Find the source pin (could be at either end)
      const startState = findPinStateAtPosition(wireStart, currentSwitches, updatedGates, updatedBuffers, updatedInverters);
      const endState = findPinStateAtPosition(wireEnd, currentSwitches, updatedGates, updatedBuffers, updatedInverters);
      
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
          const sourceState = findPinStateAtPosition(sourcePos, currentSwitches, updatedGates, updatedBuffers, updatedInverters);
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
  const findPinStateAtPosition = (pos: Point, currentSwitches = switches, gates = andGates, currentBuffers = buffers, currentInverters = inverters) => {
    // Check switches
    for (const sw of currentSwitches) {
      if (Math.abs(pos.x - sw.outputPin.position.x) < 8 && 
          Math.abs(pos.y - sw.outputPin.position.y) < 8) {
        return sw.outputPin.state;
      }
    }
    
    // Check AND gates
    for (const gate of gates) {
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
          <WireComponent key={wire.id} wire={wire} />
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
        Components: {switches.length} switches, {andGates.length} AND gates, {buffers.length} buffers, {inverters.length} inverters, {lights.length} lights, {wires.length} wires
      </div>

      {/* Gate configuration dialog */}
      <GateConfigDialog
        isOpen={showGateDialog}
        onConfirm={handleGateConfigConfirm}
        onCancel={handleGateConfigCancel}
      />

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={[
            {
              label: 'Delete',
              onClick: () => handleDeleteComponent(contextMenu.componentType, contextMenu.componentId)
            },
            ...(contextMenu.componentType === 'and-gate' ? [{
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
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};
