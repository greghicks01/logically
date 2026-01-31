import React from 'react';
import { ORGate } from '../../models/ORGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface ORGateComponentProps {
  component: ORGate;
}

/**
 * Visual representation of an OR gate
 */
export const ORGateComponent: React.FC<ORGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, numInputs, name } = component;
  
  // Calculate gate dimensions based on number of inputs
  const gateWidth = 60;
  const inputSpacing = 15;
  const totalHeight = Math.max(40, (numInputs - 1) * inputSpacing + 20);

  return (
    <g>
      {/* OR gate shape */}
      <path
        d={`M ${position.x} ${position.y - totalHeight/2} 
            Q ${position.x + 10} ${position.y - totalHeight/2} ${position.x + 15} ${position.y - totalHeight/2 + 5}
            Q ${position.x + gateWidth} ${position.y - totalHeight/4} ${position.x + gateWidth} ${position.y}
            Q ${position.x + gateWidth} ${position.y + totalHeight/4} ${position.x + 15} ${position.y + totalHeight/2 - 5}
            Q ${position.x + 10} ${position.y + totalHeight/2} ${position.x} ${position.y + totalHeight/2}
            Q ${position.x + 20} ${position.y} ${position.x} ${position.y - totalHeight/2}
            Z`}
        fill="#FFF3E0"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x + gateWidth / 2}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || 'OR'}
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
