import { LogicLevel } from './LogicLevel';
import { Point } from './Point';
import { PinConnection } from './PinConnection';
import { OutputPin } from './Pin';
import { getWireColor } from '../lib/colorSchemes';

/**
 * Wire model representing a connection carrying a logic signal
 */
export class Wire {
  id: string;
  source: PinConnection | null;
  destinations: PinConnection[];
  logicLevel: LogicLevel;
  path: Point[];
  color: string;
  drivers: OutputPin[];

  constructor(
    id: string,
    source: PinConnection | null = null,
    destinations: PinConnection[] = [],
    path: Point[] = []
  ) {
    this.id = id;
    this.source = source;
    this.destinations = destinations;
    this.logicLevel = LogicLevel.HI_Z;
    this.path = path;
    this.drivers = [];
    this.color = getWireColor(this.logicLevel);
  }

  /**
   * Set the logic level and update color
   */
  setState(newLevel: LogicLevel): void {
    this.logicLevel = newLevel;
    this.color = getWireColor(newLevel);
  }

  /**
   * Add a driver to this wire
   */
  addDriver(driver: OutputPin): void {
    if (!this.drivers.find((d) => d.id === driver.id)) {
      this.drivers.push(driver);
    }
  }

  /**
   * Remove a driver from this wire
   */
  removeDriver(driverId: string): void {
    this.drivers = this.drivers.filter((d) => d.id !== driverId);
  }

  /**
   * Get all drivers
   */
  getDrivers(): OutputPin[] {
    return [...this.drivers];
  }

  /**
   * Check if wire has a conflict
   */
  hasConflict(): boolean {
    return this.logicLevel === LogicLevel.CONFLICT;
  }

  /**
   * Add a destination to this wire
   */
  addDestination(dest: PinConnection): void {
    if (!this.destinations.find((d) => 
      d.componentId === dest.componentId && 
      d.pinId === dest.pinId
    )) {
      this.destinations.push(dest);
    }
  }

  /**
   * Remove a destination from this wire
   */
  removeDestination(componentId: string, pinId: string): void {
    this.destinations = this.destinations.filter(
      (d) => !(d.componentId === componentId && d.pinId === pinId)
    );
  }
}

/**
 * Create a new wire
 */
export function createWire(
  id: string,
  source: PinConnection | null = null,
  destinations: PinConnection[] = [],
  path: Point[] = []
): Wire {
  return new Wire(id, source, destinations, path);
}
