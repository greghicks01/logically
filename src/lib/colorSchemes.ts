import { LogicLevel } from '../models/LogicLevel';

/**
 * WCAG-compliant wire color scheme
 * All colors meet WCAG AA contrast ratio requirements
 */
export const WIRE_COLORS: Record<LogicLevel, string> = {
  [LogicLevel.LOW]: '#0066CC', // Blue (WCAG AA compliant)
  [LogicLevel.HIGH]: '#CC0000', // Red (WCAG AA compliant)
  [LogicLevel.HI_Z]: '#808080', // Grey (WCAG AA compliant)
  [LogicLevel.CONFLICT]: '#FF6600', // Orange (WCAG AA compliant)
};

/**
 * High contrast color scheme for accessibility
 */
export const HIGH_CONTRAST_COLORS: Record<LogicLevel, string> = {
  [LogicLevel.LOW]: '#0000FF', // Brighter blue
  [LogicLevel.HIGH]: '#FF0000', // Brighter red
  [LogicLevel.HI_Z]: '#404040', // Darker grey
  [LogicLevel.CONFLICT]: '#FF8C00', // Brighter orange
};

/**
 * Get wire color for a given logic level
 * @param level - Logic level
 * @param highContrast - Use high contrast mode
 */
export function getWireColor(level: LogicLevel, highContrast = false): string {
  return highContrast ? HIGH_CONTRAST_COLORS[level] : WIRE_COLORS[level];
}

/**
 * Color scheme configuration
 */
export interface ColorSchemeConfig {
  highContrast: boolean;
}

let currentConfig: ColorSchemeConfig = {
  highContrast: false,
};

/**
 * Set the color scheme configuration
 */
export function setColorSchemeConfig(config: Partial<ColorSchemeConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get the current color scheme configuration
 */
export function getColorSchemeConfig(): ColorSchemeConfig {
  return { ...currentConfig };
}
