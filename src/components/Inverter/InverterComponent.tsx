import React from 'react';
import { Inverter } from '../../models/Inverter';
import { getWireColor } from '../../lib/colorSchemes';

export interface InverterComponentProps {
  component: Inverter;
}

/**
 * Visual representation of an inverter gate
 */
export const InverterComponent: React.FC<InverterComponentProps> = ({ component }) => {
  const { position, inputPin, outputPin, name } = component;

  return (
    <g>
      {/* Inverter shape - triangle with bubble */}
      <path
        d={`M ${position.x} ${position.y - 15} 
            L ${position.x + 35} ${position.y}
            L ${position.x} ${position.y + 15}
            Z`}
        fill="#FCE4EC"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={position.x + 40}
        cy={position.y}
        r={5}
        fill="#FCE4EC"
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
      
      {/* Output pin (after bubble) */}
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
