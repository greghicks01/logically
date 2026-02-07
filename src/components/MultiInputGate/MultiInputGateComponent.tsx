import React from 'react';
import { MultiInputGate } from '../../models/MultiInputGate';
import { getWireColor } from '../../lib/colorSchemes';
import { calculateGateBoundingBox } from '../../models/bases/MultiInputComponent';

export interface MultiInputGateComponentProps {
  component: MultiInputGate;
}

/**
 * Polymorphic gate component renderer.
 * 
 * **Design Pattern: Polymorphism over Conditionals**
 * 
 * This component eliminates the need for 6 separate gate component classes
 * by using the `type` discriminator to dynamically render the appropriate
 * gate shape and label.
 * 
 * Benefits:
 * - Single rendering logic for all multi-input gates
 * - Adding new gate types requires only model changes, not component changes
 * - Consistent behavior across all gate types
 * - Dramatically reduced code duplication
 */
export const MultiInputGateComponent: React.FC<MultiInputGateComponentProps> = ({ component }) => {
  const { type, position, inputPins, outputPin, numInputs, name } = component;
  
  // Calculate dimensions
  const boundingBox = calculateGateBoundingBox(numInputs);
  const gateWidth = boundingBox.width;
  const totalHeight = boundingBox.height;
  const leftEdge = position.x - gateWidth / 2;
  const rightEdge = position.x + gateWidth / 2;
  
  // Gate type configurations
  const gateConfigs = {
    'and': { label: 'AND', fill: '#E3F2FD', hasExtraLine: false, bubbleOffset: 0 },
    'or': { label: 'OR', fill: '#FFF3E0', hasExtraLine: false, bubbleOffset: 0 },
    'nand': { label: 'NAND', fill: '#E3F2FD', hasExtraLine: false, bubbleOffset: 4 },
    'nor': { label: 'NOR', fill: '#FFF3E0', hasExtraLine: false, bubbleOffset: 4 },
    'xor': { label: 'XOR', fill: '#F3E5F5', hasExtraLine: true, bubbleOffset: 0 },
    'xnor': { label: 'XNOR', fill: '#F3E5F5', hasExtraLine: true, bubbleOffset: 4 }
  };
  
  const config = gateConfigs[type];
  
  // Render appropriate gate shape based on type
  const renderGateShape = () => {
    const commonProps = {
      fill: config.fill,
      stroke: '#333',
      strokeWidth: 2
    };
    
    if (type === 'and' || type === 'nand') {
      // AND/NAND: Flat left side, curved right side
      return (
        <path
          d={`M ${leftEdge} ${position.y - totalHeight/2} 
              L ${leftEdge + gateWidth/2} ${position.y - totalHeight/2}
              Q ${rightEdge} ${position.y - totalHeight/2} ${rightEdge} ${position.y}
              Q ${rightEdge} ${position.y + totalHeight/2} ${leftEdge + gateWidth/2} ${position.y + totalHeight/2}
              L ${leftEdge} ${position.y + totalHeight/2}
              Z`}
          {...commonProps}
        />
      );
    } else if (type === 'or' || type === 'nor') {
      // OR/NOR: Curved both sides
      return (
        <path
          d={`M ${leftEdge} ${position.y - totalHeight/2}
              Q ${leftEdge + gateWidth * 0.3} ${position.y - totalHeight/2} ${leftEdge + gateWidth * 0.4} ${position.y - totalHeight/4}
              Q ${leftEdge + gateWidth * 0.7} ${position.y} ${rightEdge} ${position.y}
              Q ${leftEdge + gateWidth * 0.7} ${position.y} ${leftEdge + gateWidth * 0.4} ${position.y + totalHeight/4}
              Q ${leftEdge + gateWidth * 0.3} ${position.y + totalHeight/2} ${leftEdge} ${position.y + totalHeight/2}
              Q ${leftEdge + gateWidth * 0.2} ${position.y} ${leftEdge} ${position.y - totalHeight/2}
              Z`}
          {...commonProps}
        />
      );
    } else {
      // XOR/XNOR: OR shape with extra input line
      return (
        <>
          {/* Extra input line for XOR */}
          <path
            d={`M ${leftEdge - 5} ${position.y - totalHeight/2}
                Q ${leftEdge + 5} ${position.y} ${leftEdge - 5} ${position.y + totalHeight/2}`}
            fill="none"
            stroke="#333"
            strokeWidth="2"
          />
          {/* OR shape */}
          <path
            d={`M ${leftEdge + 5} ${position.y - totalHeight/2}
                Q ${leftEdge + gateWidth * 0.3} ${position.y - totalHeight/2} ${leftEdge + gateWidth * 0.4} ${position.y - totalHeight/4}
                Q ${leftEdge + gateWidth * 0.7} ${position.y} ${rightEdge} ${position.y}
                Q ${leftEdge + gateWidth * 0.7} ${position.y} ${leftEdge + gateWidth * 0.4} ${position.y + totalHeight/4}
                Q ${leftEdge + gateWidth * 0.3} ${position.y + totalHeight/2} ${leftEdge + 5} ${position.y + totalHeight/2}
                Q ${leftEdge + gateWidth * 0.2} ${position.y} ${leftEdge + 5} ${position.y - totalHeight/2}
                Z`}
            {...commonProps}
          />
        </>
      );
    }
  };
  
  return (
    <g>
      {renderGateShape()}
      
      {/* Inversion bubble for NAND/NOR/XNOR */}
      {config.bubbleOffset > 0 && (
        <circle
          cx={rightEdge + config.bubbleOffset}
          cy={position.y}
          r={config.bubbleOffset}
          fill="white"
          stroke="#333"
          strokeWidth="2"
        />
      )}
      
      {/* Label */}
      <text
        x={position.x + (config.hasExtraLine ? 5 : 0)}
        y={position.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={type.length > 3 ? '11' : '12'}
        fill="#333"
        style={{ userSelect: 'none' }}
      >
        {name || config.label}
      </text>
      
      {/* Input pins */}
      {inputPins.map((pin) => (
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
