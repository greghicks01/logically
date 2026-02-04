import React from 'react';
import { NANDGate } from '../../models/NANDGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface NANDGateComponentProps {
  component: NANDGate;
}

/**
 * Visual representation of a NAND gate
 * Uses parametric bounding box for consistent rendering
 */
export const NANDGateComponent: React.FC<NANDGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, boundingBox, name } = component;
  
  // Use bounding box dimensions directly
  const gateWidth = boundingBox.width;
  const totalHeight = boundingBox.height;
  
  // Calculate gate edges from center and bounding box
  const leftEdge = position.x - gateWidth / 2;
  const rightEdge = position.x + gateWidth / 2;
  const bubbleRadius = 6;

  return (
    <g>
      {/* NAND gate shape (AND shape) - drawn from bounding box */}
      <path
        d={`M ${leftEdge} ${position.y - totalHeight/2} 
            L ${leftEdge + (gateWidth - 8)/2} ${position.y - totalHeight/2}
            Q ${rightEdge - 8} ${position.y - totalHeight/2} ${rightEdge - 8} ${position.y}
            Q ${rightEdge - 8} ${position.y + totalHeight/2} ${leftEdge + (gateWidth - 8)/2} ${position.y + totalHeight/2}
            L ${leftEdge} ${position.y + totalHeight/2}
            Z`}
        fill="#E8F5E9"
        stroke="#333"
        strokeWidth="2"
      />
      
      {/* Inversion bubble */}
      <circle
        cx={rightEdge - 2}
        cy={position.y}
        r={bubbleRadius}
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
