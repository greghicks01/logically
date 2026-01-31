import React from 'react';
import { XNORGate } from '../../models/XNORGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface XNORGateComponentProps {
  component: XNORGate;
}

/**
 * Visual representation of an XNOR gate
 */
export const XNORGateComponent: React.FC<XNORGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, numInputs, name } = component;
  
  // Calculate gate dimensions based on number of inputs
  const gateWidth = 60;
  const inputSpacing = 15;
  const totalHeight = Math.max(40, (numInputs - 1) * inputSpacing + 20);

  return (
    <g>
      {/* XNOR gate shape (XOR shape with inversion bubble) */}
      <path
        d={`M ${position.x + 5} ${position.y - totalHeight/2} 
            Q ${position.x + 15} ${position.y - totalHeight/2} ${position.x + 20} ${position.y - totalHeight/2 + 5}
            Q ${position.x + gateWidth - 8} ${position.y - totalHeight/4} ${position.x + gateWidth - 8} ${position.y}
            Q ${position.x + gateWidth - 8} ${position.y + totalHeight/4} ${position.x + 20} ${position.y + totalHeight/2 - 5}
            Q ${position.x + 15} ${position.y + totalHeight/2} ${position.x + 5} ${position.y + totalHeight/2}
            Q ${position.x + 25} ${position.y} ${position.x + 5} ${position.y - totalHeight/2}
            Z`}
        fill="#E1F5FE"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Extra input curve for XOR base */}
      <path
        d={`M ${position.x} ${position.y - totalHeight/2}
            Q ${position.x + 20} ${position.y} ${position.x} ${position.y + totalHeight/2}`}
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={position.x + gateWidth - 2}
        cy={position.y}
        r={6}
        fill="#E1F5FE"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x + gateWidth / 2 - 1}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || 'XNOR'}
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
