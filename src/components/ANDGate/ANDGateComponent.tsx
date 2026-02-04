import React from 'react';
import { ANDGate } from '../../models/ANDGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface ANDGateComponentProps {
  component: ANDGate;
}

/**
 * Visual representation of an AND gate
 * Uses parametric bounding box for consistent rendering
 */
export const ANDGateComponent: React.FC<ANDGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, boundingBox, name } = component;
  
  // Use bounding box dimensions directly
  const gateWidth = boundingBox.width;
  const totalHeight = boundingBox.height;
  
  // Calculate gate left edge from center and bounding box
  const leftEdge = position.x - gateWidth / 2;
  const rightEdge = position.x + gateWidth / 2;

  return (
    <g>
      {/* AND gate shape - drawn from bounding box */}
      <path
        d={`M ${leftEdge} ${position.y - totalHeight/2} 
            L ${leftEdge + gateWidth/2} ${position.y - totalHeight/2}
            Q ${rightEdge} ${position.y - totalHeight/2} ${rightEdge} ${position.y}
            Q ${rightEdge} ${position.y + totalHeight/2} ${leftEdge + gateWidth/2} ${position.y + totalHeight/2}
            L ${leftEdge} ${position.y + totalHeight/2}
            Z`}
        fill="#E3F2FD"
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
        {name || 'AND'}
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
