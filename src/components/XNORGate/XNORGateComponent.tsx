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
  const { position, inputPins, outputPin, numInputs, name, boundingBox } = component;
  
  // Calculate gate dimensions from bounding box
  const { width, height } = boundingBox;
  const leftEdge = position.x - width / 2;
  const rightEdge = position.x + width / 2;

  return (
    <g>
      {/* XNOR gate shape (XOR shape with inversion bubble) */}
      <path
        d={`M ${leftEdge + 5} ${position.y - height/2} 
            Q ${leftEdge + 15} ${position.y - height/2} ${leftEdge + 20} ${position.y - height/2 + 5}
            Q ${rightEdge - 8} ${position.y - height/4} ${rightEdge - 8} ${position.y}
            Q ${rightEdge - 8} ${position.y + height/4} ${leftEdge + 20} ${position.y + height/2 - 5}
            Q ${leftEdge + 15} ${position.y + height/2} ${leftEdge + 5} ${position.y + height/2}
            Q ${leftEdge + 25} ${position.y} ${leftEdge + 5} ${position.y - height/2}
            Z`}
        fill="#E1F5FE"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Extra input curve for XOR base */}
      <path
        d={`M ${leftEdge} ${position.y - height/2}
            Q ${leftEdge + 20} ${position.y} ${leftEdge} ${position.y + height/2}`}
        fill="none"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={rightEdge - 2}
        cy={position.y}
        r={6}
        fill="#E1F5FE"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Label */}
      <text
        x={position.x - 1}
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
