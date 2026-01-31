import React from 'react';
import { Switch } from '../../models/Switch';

export interface SwitchComponentProps {
  component: Switch;
  onToggle: (id: string) => void;
}

/**
 * Visual representation of a toggle switch
 */
export const SwitchComponent: React.FC<SwitchComponentProps> = ({ component, onToggle }) => {
  const { position, state, id } = component;

  return (
    <g onClick={() => onToggle(id)} style={{ cursor: 'pointer' }}>
      {/* Switch body */}
      <rect
        x={position.x}
        y={position.y}
        width={40}
        height={30}
        fill={state ? '#4CAF50' : '#9E9E9E'}
        stroke="#333"
        strokeWidth={2}
        rx={4}
      />
      
      {/* Toggle indicator */}
      <circle
        cx={position.x + (state ? 28 : 12)}
        cy={position.y + 15}
        r={8}
        fill="white"
        stroke="#333"
        strokeWidth={1}
      />
      
      {/* Output pin */}
      <circle
        cx={position.x + 40}
        cy={position.y + 15}
        r={4}
        fill={state ? '#CC0000' : '#0066CC'}
        stroke="#333"
        strokeWidth={1}
      />
      
      {/* Label */}
      <text
        x={position.x + 20}
        y={position.y - 5}
        textAnchor="middle"
        fontSize="10"
        fill="#333"
      >
        Switch
      </text>
    </g>
  );
};
