/**
 * IC Pin definition for composite IC external interface
 */
export interface ICPin {
  /** Unique identifier */
  id: string;
  /** Pin label (supports overbar notation like Q̅, EN̅) */
  label: string;
  /** Pin direction */
  direction: 'input' | 'output';
  /** Whether inverter symbol is attached */
  hasInverter: boolean;
  /** Internal wire connection */
  internalWireId: string;
  /** External connection when IC is instantiated */
  externalWireId?: string;
}

/**
 * Create a new IC pin
 */
export function createICPin(
  id: string,
  label: string,
  direction: 'input' | 'output',
  internalWireId: string
): ICPin {
  return {
    id,
    label,
    direction,
    hasInverter: false,
    internalWireId,
  };
}

/**
 * Validate pin label format
 * Supports alphanumeric labels with optional overbar (combining character U+0305)
 */
export function validatePinLabel(label: string): boolean {
  // Allow letters, numbers, and overbar combining character
  return /^[A-Z][A-Z0-9\u0305]*$/.test(label);
}

/**
 * Add overbar to pin label
 * Converts "Q" to "Q̅" using Unicode combining overline U+0305
 */
export function addOverbar(label: string): string {
  return label + '\u0305';
}

/**
 * Check if label has overbar
 */
export function hasOverbar(label: string): boolean {
  return label.includes('\u0305');
}
