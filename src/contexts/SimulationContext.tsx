import { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { LogicLevel } from '../models/LogicLevel';
import { Wire, Circuit, createCircuit } from '../models/Circuit';

/**
 * Simulation state context type
 */
export interface SimulationContextType {
  /** Current circuit */
  circuit: Circuit;
  /** All wires indexed by ID */
  wires: Map<string, Wire>;
  /** Whether simulation is running */
  isRunning: boolean;
  /** Update wire state */
  updateWireState: (wireId: string, state: LogicLevel) => void;
  /** Start simulation */
  startSimulation: () => void;
  /** Stop simulation */
  stopSimulation: () => void;
}

const SimulationContext = createContext<SimulationContextType | null>(null);

/**
 * Simulation context provider props
 */
export interface SimulationProviderProps {
  children: ReactNode;
}

/**
 * Simulation context provider
 */
export function SimulationProvider({ children }: SimulationProviderProps) {
  const [circuit, setCircuit] = useState<Circuit>(() => createCircuit('Main Circuit'));
  const [wires, setWires] = useState<Map<string, Wire>>(new Map());
  const [isRunning, setIsRunning] = useState(true); // Always running per FR-020

  const updateWireState = useCallback((wireId: string, state: LogicLevel) => {
    setWires((prevWires) => {
      const wire = prevWires.get(wireId);
      if (!wire) return prevWires;

      const updatedWire = { ...wire, logicLevel: state };
      const newWires = new Map(prevWires);
      newWires.set(wireId, updatedWire);
      return newWires;
    });
  }, []);

  const startSimulation = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setIsRunning(false);
  }, []);

  const value: SimulationContextType = {
    circuit,
    wires,
    isRunning,
    updateWireState,
    startSimulation,
    stopSimulation,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

/**
 * Hook to use simulation context
 */
export function useSimulation(): SimulationContextType {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within SimulationProvider');
  }
  return context;
}
