import React from 'react';
import { NANDGate } from '../../models/NANDGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface NANDGateComponentProps {
  component: NANDGate;
}

/**
 * Visual representation of a NAND gate
 */
export const NANDGateComponent: React.FC<NANDGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, numInputs, name } = component;
  
  // Calculate gate dimensions based on number of inputs
  const gateWidth = 60;
  const inputSpacing = 15;
  const totalHeight = Math.max(40, (numInputs - 1) * inputSpacing + 20);

  return (
    <g>
      {/* NAND gate shape (AND shape) */}
      <path
        d={`M ${position.x} ${position.y - totalHeight/2} 
            L ${position.x + (gateWidth - 8)/2} ${position.y - totalHeight/2}
            Q ${position.x + gateWidth - 8} ${position.y - totalHeight/2} ${position.x + gateWidth - 8} ${position.y}
            Q ${position.x + gateWidth - 8} ${position.y + totalHeight/2} ${position.x + (gateWidth - 8)/2} ${position.y + totalHeight/2}
            L ${position.x} ${position.y + totalHeight/2}
            Z`}
        fill="#E8F5E9"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={position.x + gateWidth - 2}
        cy={position.y}
        r={6}
        fill="#E8F5E9"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x + gateWidth / 2 - 3}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || 'NAND'}
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
