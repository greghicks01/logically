import { useState } from 'react';
import { CompositeIC } from '../../models/CompositeIC';

export interface HierarchyNavigatorProps {
  currentLevel: number;
  breadcrumbs: Array<{ name: string; id: string }>;
  onNavigateToLevel: (levelId: string) => void;
  onNavigateUp: () => void;
}

/**
 * Hierarchy Navigator component
 * Provides breadcrumb navigation for drilling into nested composite ICs
 */
export function HierarchyNavigator({
  currentLevel,
  breadcrumbs,
  onNavigateToLevel,
  onNavigateUp,
}: HierarchyNavigatorProps) {
  return (
    <div style={{ padding: '10px', backgroundColor: '#f0f0f0', borderBottom: '1px solid #ccc' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: 'bold' }}>Level {currentLevel}:</span>
        
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {index > 0 && <span style={{ color: '#666' }}>{'>'}</span>}
            <button
              onClick={() => onNavigateToLevel(crumb.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#0066CC',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0',
                font: 'inherit',
              }}
            >
              {crumb.name}
            </button>
          </span>
        ))}

        {currentLevel > 1 && (
          <button
            onClick={onNavigateUp}
            style={{
              marginLeft: '20px',
              padding: '5px 15px',
              backgroundColor: '#0066CC',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ↑ Return to Parent
          </button>
        )}
      </div>

      <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
        {currentLevel > 10 && (
          <span style={{ color: '#FF6600' }}>
            ⚠️ Warning: Deep nesting level ({currentLevel}) may impact performance
          </span>
        )}
      </div>
    </div>
  );
}
