import { useState, useCallback } from 'react';
import { Pin } from '../models/Pin';
import { Point } from '../models/Point';
import { Wire, createWire } from '../models/Wire';

export interface WiringState {
  isWiring: boolean;
  startPin: Pin | null;
  currentPosition: Point | null;
  previewPoints: Point[];
}

export interface UseWiringResult {
  wiringState: WiringState;
  startWiring: (pin: Pin) => void;
  updateWirePreview: (position: Point) => void;
  completeWiring: (endPin: Pin) => Wire | null;
  cancelWiring: () => void;
  canConnect: (startPin: Pin, endPin: Pin) => { valid: boolean; reason?: string };
}

/**
 * Hook for managing wire creation interactions
 */
export function useWiring(): UseWiringResult {
  const [wiringState, setWiringState] = useState<WiringState>({
    isWiring: false,
    startPin: null,
    currentPosition: null,
    previewPoints: [],
  });

  /**
   * Check if two pins can be connected
   */
  const canConnect = useCallback((startPin: Pin, endPin: Pin): { valid: boolean; reason?: string } => {
    // Can't connect to self
    if (startPin.id === endPin.id) {
      return { valid: false, reason: 'Cannot connect pin to itself' };
    }

    // Basic validation - in a full implementation, you'd check:
    // - Output pins can only connect to input pins
    // - No duplicate connections
    // - No circular dependencies in composite ICs
    
    return { valid: true };
  }, []);

  /**
   * Start creating a wire from a pin
   */
  const startWiring = useCallback((pin: Pin) => {
    setWiringState({
      isWiring: true,
      startPin: pin,
      currentPosition: pin.position,
      previewPoints: [pin.position],
    });
  }, []);

  /**
   * Update wire preview position as mouse moves
   */
  const updateWirePreview = useCallback((position: Point) => {
    setWiringState((prev) => {
      if (!prev.isWiring || !prev.startPin) return prev;
      
      return {
        ...prev,
        currentPosition: position,
        previewPoints: [prev.startPin.position, position],
      };
    });
  }, []);

  /**
   * Complete the wire connection to an end pin
   */
  const completeWiring = useCallback((endPin: Pin): Wire | null => {
    if (!wiringState.isWiring || !wiringState.startPin) {
      return null;
    }

    const validation = canConnect(wiringState.startPin, endPin);
    if (!validation.valid) {
      console.warn('Invalid connection:', validation.reason);
      setWiringState({
        isWiring: false,
        startPin: null,
        currentPosition: null,
        previewPoints: [],
      });
      return null;
    }

    // Create the wire
    const wire = createWire(
      `wire-${Date.now()}`,
      null,
      [],
      [wiringState.startPin.position, endPin.position]
    );

    // Reset wiring state
    setWiringState({
      isWiring: false,
      startPin: null,
      currentPosition: null,
      previewPoints: [],
    });

    return wire;
  }, [wiringState, canConnect]);

  /**
   * Cancel wire creation
   */
  const cancelWiring = useCallback(() => {
    setWiringState({
      isWiring: false,
      startPin: null,
      currentPosition: null,
      previewPoints: [],
    });
  }, []);

  return {
    wiringState,
    startWiring,
    updateWirePreview,
    completeWiring,
    cancelWiring,
    canConnect,
  };
}
