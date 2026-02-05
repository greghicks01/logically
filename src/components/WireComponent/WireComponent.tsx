import { useEffect, useRef, useState } from 'react';
import { Wire } from '../../models/Wire';
import { useSimulation } from '../../contexts/SimulationContext';
import { LogicLevel, logicLevelToString } from '../../models/LogicLevel';
import { getWireColor } from '../../lib/colorSchemes';

export interface WireComponentProps {
  wire: Wire;
  onContextMenu?: (event: React.MouseEvent, wireId: string) => void;
}

/**
 * Wire component for rendering and updating wire state
 */
export function WireComponent({ wire, onContextMenu }: WireComponentProps) {
  const { updateWireState } = useSimulation();
  const [isHovered, setIsHovered] = useState(false);

  // Get color based on current logic level
  const wireColor = getWireColor(wire.logicLevel);

  // Subscribe to wire state changes
  useEffect(() => {
    // Component will re-render when wire prop changes
    // Real-time updates happen via parent component re-rendering
  }, [wire]);

  const handleClick = () => {
    // For testing: toggle wire state on click
    const newState = wire.logicLevel === LogicLevel.LOW ? LogicLevel.HIGH : LogicLevel.LOW;
    updateWireState(wire.id, newState);
  };

  const handleContextMenu = (event: React.MouseEvent) => {
    if (onContextMenu) {
      event.preventDefault();
      event.stopPropagation();
      onContextMenu(event, wire.id);
    }
  };

  // Generate organic curved path
  const generateCurvedPath = () => {
    if (wire.path.length < 2) return '';
    
    const start = wire.path[0];
    const end = wire.path[wire.path.length - 1];
    
    // Calculate control point for smooth curve
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const cx = start.x + dx / 2;
    const cy = start.y; // Keep control point at start Y for gentle curve
    
    // Use quadratic bezier curve for organic look
    return `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`;
  };

  return (
    <g
      data-wire-id={wire.id}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Wire path - organic curved */}
      <path
        d={generateCurvedPath()}
        stroke={wireColor}
        strokeWidth={isHovered ? 6 : 4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Tooltip on hover */}
      {isHovered && wire.path.length > 0 && (
        <text
          x={wire.path[0].x}
          y={wire.path[0].y - 10}
          fontSize="12"
          fill="#000"
          style={{ userSelect: 'none' }}
        >
          {logicLevelToString(wire.logicLevel)}
        </text>
      )}
    </g>
  );
}
