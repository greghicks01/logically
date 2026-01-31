import { LogicLevel } from '../models/LogicLevel';

/**
 * Apply inverter logic to a signal
 * Inverts LOW ↔ HIGH, keeps HI_Z and CONFLICT unchanged
 */
export function applyInverter(signal: LogicLevel, hasInverter: boolean): LogicLevel {
  if (!hasInverter) {
    return signal;
  }

  switch (signal) {
    case LogicLevel.LOW:
      return LogicLevel.HIGH;
    case LogicLevel.HIGH:
      return LogicLevel.LOW;
    case LogicLevel.HI_Z:
      return LogicLevel.HI_Z;
    case LogicLevel.CONFLICT:
      return LogicLevel.CONFLICT;
    default:
      return signal;
  }
}

/**
 * Render inverter symbol on canvas
 */
export function renderInverterSymbol(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number = 6
): void {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
}
