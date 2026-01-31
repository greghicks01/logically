import { LogicLevel } from '../models/LogicLevel';
import { OutputPin } from '../models/Pin';

/**
 * Wire state calculator utility
 * Determines wire logic level from multiple drivers
 */
export class WireStateCalculator {
  /**
   * Calculate wire state from all drivers
   * Rules:
   * - No drivers: HI_Z
   * - Single driver: Use driver's state
   * - Multiple drivers with same non-HiZ state: Use that state
   * - Multiple drivers with different non-HiZ states: CONFLICT
   */
  static calculateState(drivers: OutputPin[]): LogicLevel {
    if (drivers.length === 0) {
      return LogicLevel.HI_Z;
    }

    // Filter out Hi-Z drivers
    const activeDrivers = drivers.filter((d) => d.outputState !== LogicLevel.HI_Z);

    if (activeDrivers.length === 0) {
      return LogicLevel.HI_Z;
    }

    if (activeDrivers.length === 1) {
      return activeDrivers[0].outputState;
    }

    // Check for conflicts
    const firstState = activeDrivers[0].outputState;
    const hasConflict = activeDrivers.some((d) => d.outputState !== firstState);

    if (hasConflict) {
      return LogicLevel.CONFLICT;
    }

    return firstState;
  }

  /**
   * Detect if wire has conflicting drivers
   */
  static detectConflict(drivers: OutputPin[]): boolean {
    const activeDrivers = drivers.filter((d) => d.outputState !== LogicLevel.HI_Z);
    
    if (activeDrivers.length <= 1) {
      return false;
    }

    const firstState = activeDrivers[0].outputState;
    return activeDrivers.some((d) => d.outputState !== firstState);
  }
}
