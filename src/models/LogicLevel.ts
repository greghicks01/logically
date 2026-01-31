/**
 * Logic levels for digital signals
 * Represents the four possible states of a digital signal
 */
export enum LogicLevel {
  /** Logic 0 (false/ground) */
  LOW = 0,
  /** Logic 1 (true/power) */
  HIGH = 1,
  /** High impedance (floating/undriven) */
  HI_Z = 2,
  /** Multiple conflicting drivers */
  CONFLICT = 3,
}

/**
 * Type guard to check if a value is a valid LogicLevel
 */
export function isLogicLevel(value: unknown): value is LogicLevel {
  return (
    typeof value === 'number' &&
    (value === LogicLevel.LOW ||
      value === LogicLevel.HIGH ||
      value === LogicLevel.HI_Z ||
      value === LogicLevel.CONFLICT)
  );
}

/**
 * Convert LogicLevel to readable string
 */
export function logicLevelToString(level: LogicLevel): string {
  switch (level) {
    case LogicLevel.LOW:
      return 'Logic 0';
    case LogicLevel.HIGH:
      return 'Logic 1';
    case LogicLevel.HI_Z:
      return 'Hi-Z';
    case LogicLevel.CONFLICT:
      return 'Conflict';
    default:
      return 'Unknown';
  }
}
