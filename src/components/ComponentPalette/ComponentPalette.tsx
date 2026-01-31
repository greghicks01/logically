import React from 'react';
import './ComponentPalette.css';

export type ComponentType = 'switch' | 'and-gate' | 'buffer' | 'inverter' | 'light';

export interface ComponentPaletteProps {
  onSelectComponent: (type: ComponentType) => void;
  selectedComponent: ComponentType | null;
}

interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: string;
}

const paletteItems: PaletteItem[] = [
  { type: 'switch', label: 'Switch', icon: '⚡' },
  { type: 'and-gate', label: 'AND Gate', icon: '&' },
  { type: 'buffer', label: 'Buffer', icon: '▷' },
  { type: 'inverter', label: 'Inverter', icon: '▷○' },
  { type: 'light', label: 'Light', icon: '💡' },
];

/**
 * Component palette for selecting and placing components
 */
export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onSelectComponent,
  selectedComponent,
}) => {
  return (
    <div className="component-palette">
      <h3 className="palette-title">Components</h3>
      <div className="palette-items">
        {paletteItems.map((item) => (
          <button
            key={item.type}
            className={`palette-item ${selectedComponent === item.type ? 'selected' : ''}`}
            onClick={() => onSelectComponent(item.type)}
            title={`Place ${item.label}`}
          >
            <span className="palette-icon">{item.icon}</span>
            <span className="palette-label">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="palette-instructions">
        <p>Click a component, then click on the canvas to place it.</p>
      </div>
    </div>
  );
};
