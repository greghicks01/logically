import React from 'react';
import { TruthTable } from '../../models/TruthTable';
import { Point } from '../../models/Point';
import { formatLogicLevel } from '../../lib/truthTableUtils';

export interface TruthTablePanelProps {
  /** Truth table to display */
  table: TruthTable;
  
  /** Position on canvas to display the floating panel */
  position: Point;
  
  /** Optional callback when close button is clicked */
  onClose?: () => void;
  
  /** Optional callback when panel position changes (for dragging) */
  onPositionChange?: (position: Point) => void;
}

/**
 * Floating truth table panel that displays next to a gate on the canvas
 * 
 * Design Pattern: Polymorphic Rendering
 * - Adapts to any number of inputs automatically
 * - No hardcoded column counts or gate-specific rendering
 * - Single component works for all gate types
 */
export const TruthTablePanel: React.FC<TruthTablePanelProps> = ({
  table,
  position,
  onClose,
  onPositionChange
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState<Point>({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag from header area, not from close button
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };
  
  React.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (onPositionChange) {
        onPositionChange({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        });
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onPositionChange]);
  
  return (
    <div
      className="truth-table-panel"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'white',
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '200px'
      }}
      role="region"
      aria-label={`Truth table for gate ${table.gateId}`}
    >
      {/* Header with close button */}
      <div 
        onMouseDown={handleMouseDown}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          borderBottom: '1px solid #ddd',
          paddingBottom: '8px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
          Truth Table
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close truth table"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px',
              color: '#666'
            }}
          >
            ×
          </button>
        )}
      </div>
      
      {/* Truth table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '12px'
      }}>
        <thead>
          <tr>
            {table.inputPins.map(pin => (
              <th key={pin} scope="col" style={{
                border: '1px solid #ddd',
                padding: '4px 8px',
                background: '#f5f5f5',
                fontWeight: 'bold',
                textAlign: 'center'
              }}>
                {pin}
              </th>
            ))}
            <th scope="col" style={{
              border: '1px solid #ddd',
              padding: '4px 8px',
              background: '#e3f2fd',
              fontWeight: 'bold',
              textAlign: 'center'
            }}>
              {table.outputPin}
            </th>
          </tr>
        </thead>
        <tbody>
          {table.rows.map(row => (
            <tr
              key={row.id}
              data-row-id={row.id}
              className={row.isCurrent ? 'current-row' : ''}
              aria-current={row.isCurrent ? 'true' : undefined}
              style={{
                background: row.isCurrent ? '#fff3cd' : 'white'
              }}
            >
              {table.inputPins.map(pin => (
                <td key={pin} style={{
                  border: '1px solid #ddd',
                  padding: '4px 8px',
                  textAlign: 'center'
                }}>
                  {formatLogicLevel(row.inputs[pin], 'SYMBOLIC')}
                </td>
              ))}
              <td style={{
                border: '1px solid #ddd',
                padding: '4px 8px',
                textAlign: 'center',
                fontWeight: row.isCurrent ? 'bold' : 'normal'
              }}>
                {formatLogicLevel(row.output, 'SYMBOLIC')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
