import React from 'react';
import { ORGate } from '../../models/ORGate';
import { getWireColor } from '../../lib/colorSchemes';

export interface ORGateComponentProps {
  component: ORGate;
}

/**
 * Visual representation of an OR gate
 * Uses parametric bounding box for consistent rendering
 */
export const ORGateComponent: React.FC<ORGateComponentProps> = ({ component }) => {
  const { position, inputPins, outputPin, boundingBox, name } = component;
  
  // Use bounding box dimensions directly
  const gateWidth = boundingBox.width;
  const totalHeight = boundingBox.height;
  
  // Calculate gate left edge from center and bounding box
  const leftEdge = position.x - gateWidth / 2;
  const rightEdge = position.x + gateWidth / 2;

  return (
    <g>
      {/* OR gate shape - drawn from bounding box */}
      <path
        d={`M ${leftEdge} ${position.y - totalHeight/2} 
            Q ${leftEdge + 10} ${position.y - totalHeight/2} ${leftEdge + 15} ${position.y - totalHeight/2 + 5}
            Q ${rightEdge} ${position.y - totalHeight/4} ${rightEdge} ${position.y}
            Q ${rightEdge} ${position.y + totalHeight/4} ${leftEdge + 15} ${position.y + totalHeight/2 - 5}
            Q ${leftEdge + 10} ${position.y + totalHeight/2} ${leftEdge} ${position.y + totalHeight/2}
            Q ${leftEdge + 20} ${position.y} ${leftEdge} ${position.y - totalHeight/2}
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
