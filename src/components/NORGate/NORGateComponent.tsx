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
  const { position, inputPins, outputPin, numInputs, name } = component;
  
  // Calculate gate dimensions based on number of inputs
  const gateWidth = 60;
  const inputSpacing = 15;
  const totalHeight = Math.max(40, (numInputs - 1) * inputSpacing + 20);

  return (
    <g>
      {/* NOR gate shape (OR shape) */}
      <path
        d={`M ${position.x} ${position.y - totalHeight/2} 
            Q ${position.x + 10} ${position.y - totalHeight/2} ${position.x + 15} ${position.y - totalHeight/2 + 5}
            Q ${position.x + gateWidth - 8} ${position.y - totalHeight/4} ${position.x + gateWidth - 8} ${position.y}
            Q ${position.x + gateWidth - 8} ${position.y + totalHeight/4} ${position.x + 15} ${position.y + totalHeight/2 - 5}
            Q ${position.x + 10} ${position.y + totalHeight/2} ${position.x} ${position.y + totalHeight/2}
            Q ${position.x + 20} ${position.y} ${position.x} ${position.y - totalHeight/2}
            Z`}
        fill="#FCE4EC"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={position.x + gateWidth - 2}
        cy={position.y}
        r={6}
        fill="#FCE4EC"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x + gateWidth / 2 - 3}
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
