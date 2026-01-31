/**
 * Connection to a component pin
 */
export interface PinConnection {
  /** Unique identifier of the component */
  componentId: string;
  /** Unique identifier of the pin on the component */
  pinId: string;
  /** Type of pin (input or output) */
  pinType: 'input' | 'output';
}

/**
 * Create a new PinConnection
 */
export function createPinConnection(
  componentId: string,
  pinId: string,
  pinType: 'input' | 'output'
): PinConnection {
  return {
    componentId,
    pinId,
    pinType,
  };
}

/**
 * Check if two pin connections are equal
 */
export function pinConnectionsEqual(a: PinConnection, b: PinConnection): boolean {
  return a.componentId === b.componentId && a.pinId === b.pinId && a.pinType === b.pinType;
}
