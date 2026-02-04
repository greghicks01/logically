import React from 'react';
import { XORGate } from '../../models/XORGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface XORGateComponentProps {
  component: XORGate;
}

/**
 * Visual representation of an XOR gate
 */
export const XORGateComponent: React.FC<XORGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, numInputs, name, boundingBox } = component;
  
  // Calculate gate dimensions from bounding box
  const { width, height } = boundingBox;
  const leftEdge = position.x - width / 2;
  const rightEdge = position.x + width / 2;

  return (
    <g>
      {/* XOR gate shape (OR shape with extra input line) */}
      <path
        d={`M ${leftEdge + 5} ${position.y - height/2} 
            Q ${leftEdge + 15} ${position.y - height/2} ${leftEdge + 20} ${position.y - height/2 + 5}
            Q ${rightEdge} ${position.y - height/4} ${rightEdge} ${position.y}
            Q ${rightEdge} ${position.y + height/4} ${leftEdge + 20} ${position.y + height/2 - 5}
            Q ${leftEdge + 15} ${position.y + height/2} ${leftEdge + 5} ${position.y + height/2}
            Q ${leftEdge + 25} ${position.y} ${leftEdge + 5} ${position.y - height/2}
            Z`}
        fill="#F3E5F5"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Extra input curve for XOR */}
      <path
        d={`M ${leftEdge} ${position.y - height/2}
            Q ${leftEdge + 20} ${position.y} ${leftEdge} ${position.y + height/2}`}
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x + 2}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="12"
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || 'XOR'}
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
