import React from 'react';
import { NORGate } from '../../models/NORGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface NORGateComponentProps {
  component: NORGate;
}

/**
 * Visual representation of a NOR gate
 */
export const NORGateComponent: React.FC<NORGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, numInputs, name, boundingBox } = component;
  
  // Calculate gate dimensions from bounding box
  const { width, height } = boundingBox;
  const leftEdge = position.x - width / 2;
  const rightEdge = position.x + width / 2;

  return (
    <g>
      {/* NOR gate shape (OR shape) */}
      <path
        d={`M ${leftEdge} ${position.y - height/2} 
            Q ${leftEdge + 10} ${position.y - height/2} ${leftEdge + 15} ${position.y - height/2 + 5}
            Q ${rightEdge - 8} ${position.y - height/4} ${rightEdge - 8} ${position.y}
            Q ${rightEdge - 8} ${position.y + height/4} ${leftEdge + 15} ${position.y + height/2 - 5}
            Q ${leftEdge + 10} ${position.y + height/2} ${leftEdge} ${position.y + height/2}
            Q ${leftEdge + 20} ${position.y} ${leftEdge} ${position.y - height/2}
            Z`}
        fill="#FCE4EC"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={rightEdge - 2}
        cy={position.y}
        r={6}
        fill="#FCE4EC"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x - 3}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || 'NOR'}
      </text>
      
      {/* Input pins */}
      {inputPins.map((pin, index) => (
        <g key={pin.id}>
          <circle
            cx={pin.position.x}
            cy={pin.position.y}
            r={4}
            fill={getWireColor(pin.state)}
            stroke="#333"
            strokeWidth="1"
          />
          <text
            x={pin.position.x - 10}
            y={pin.position.y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="10"
            fill="#666"
            style={{ userSelect: 'none' }}
          >
            {pin.label}
          </text>
        </g>
      ))}
      
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
