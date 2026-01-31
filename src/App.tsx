import { useState } from 'react';
import { SimulationProvider } from './contexts/SimulationContext';
import { ComponentPalette, ComponentType } from './components/ComponentPalette/ComponentPalette';
import { CircuitWorkspace } from './components/CircuitWorkspace/CircuitWorkspace';

function App() {
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | null>(null);

  const handleComponentPlaced = () => {
    setSelectedComponent(null);
  };

  return (
    <SimulationProvider>
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            backgroundColor: '#1976D2',
            color: 'white',
            borderBottom: '2px solid #1565C0',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '24px' }}>
            LogicLy - Digital Logic Circuit Simulator
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
            Build and visualize logic circuits
          </p>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left sidebar - Component Palette */}
          <ComponentPalette
            onSelectComponent={setSelectedComponent}
            selectedComponent={selectedComponent}
          />

          {/* Circuit workspace */}
          <CircuitWorkspace
            width={1200}
            height={800}
            selectedComponent={selectedComponent}
            onComponentPlaced={handleComponentPlaced}
          />
        </div>
      </div>
    </SimulationProvider>
  );
}

export default App;
