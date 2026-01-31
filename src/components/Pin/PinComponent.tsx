import React from 'react';
import { Pin } from '../../models/Pin';
import { getWireColor } from '../../lib/colorSchemes';

export interface PinComponentProps {
  pin: Pin;
  onPinClick?: (pin: Pin, event: React.MouseEvent) => void;
  isHighlighted?: boolean;
}

/**
 * Interactive pin component for wire connections
 */
export const PinComponent: React.FC<PinComponentProps> = ({
  pin,
  onPinClick,
  isHighlighted = false,
}) => {
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onPinClick?.(pin, event);
  };

  return (
    <g
      onClick={handleClick}
      style={{ cursor: onPinClick ? 'pointer' : 'default' }}
    >
      {/* Pin hover area (larger for easier clicking) */}
      <circle
        cx={pin.position.x}
        cy={pin.position.y}
        r={8}
        fill="transparent"
        pointerEvents="all"
      />

      {/* Pin visual */}
      <circle
        cx={pin.position.x}
        cy={pin.position.y}
        r={5}
        fill={getWireColor(pin.state)}
        stroke={isHighlighted ? '#FFD700' : '#333'}
        strokeWidth={isHighlighted ? 3 : 2}
      />

      {/* Highlight effect */}
      {isHighlighted && (
        <circle
          cx={pin.position.x}
          cy={pin.position.y}
          r={10}
          fill="none"
          stroke="#FFD700"
          strokeWidth={2}
          opacity={0.6}
        />
      )}
    </g>
  );
};
