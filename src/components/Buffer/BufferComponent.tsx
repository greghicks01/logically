import React from 'react';
import { Buffer } from '../../models/Buffer';
import { getWireColor } from '../../lib/colorSchemes';

export interface BufferComponentProps {
  component: Buffer;
}

/**
 * Visual representation of a buffer gate
 */
export const BufferComponent: React.FC<BufferComponentProps> = ({ component }) => {
  const { position, inputPin, outputPin, name } = component;

  return (
    <g>
      {/* Buffer shape - triangle */}
      <path
        d={`M ${position.x} ${position.y - 15} 
            L ${position.x + 40} ${position.y}
            L ${position.x} ${position.y + 15}
            Z`}
        fill="#E8F5E9"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      {name && (
        <text
          x={position.x + 20}
          y={position.y - 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#333"
          style={{ userSelect: 'none' }}
        >
          {name}
        </text>
      )}
      
      {/* Input pin */}
      <circle
        cx={inputPin.position.x}
        cy={inputPin.position.y}
        r={4}
        fill={getWireColor(inputPin.state)}
        stroke="#333"
        strokeWidth="1"
      />
      
      {/* Output pin */}
      <circle
        cx={outputPin.position.x}
        cy={outputPin.position.y}
        r={4}
        fill={getWireColor(outputPin.state)}
        stroke="#333"
        strokeWidth="1"
      />
    </g>
  );
};
