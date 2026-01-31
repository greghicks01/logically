import { useEffect, useRef } from 'react';
import { Wire } from '../../models/Wire';
import { WireRenderer } from '../../services/WireRenderer';
import { useSimulation } from '../../contexts/SimulationContext';

export interface CanvasCircuitEditorProps {
  width?: number;
  height?: number;
}

/**
 * Canvas-based circuit editor with wire rendering
 */
export function CanvasCircuitEditor({ width = 800, height = 600 }: CanvasCircuitEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<WireRenderer | null>(null);
  const { circuit, wires } = useSimulation();

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new WireRenderer(canvasRef.current);
    rendererRef.current = renderer;

    return () => {
      renderer.dispose();
    };
  }, []);

  // Render wires when they change
  useEffect(() => {
    if (!rendererRef.current) return;

    const wireArray = Array.from(wires.values());
    rendererRef.current.renderAll(wireArray);
  }, [wires]);

  // Subscribe to wire state changes
  useEffect(() => {
    if (!rendererRef.current) return;

    const renderer = rendererRef.current;

    const handleWireChange = (wireId: string, wire: Wire) => {
      renderer.updateWireColor(wireId, wire);
    };

    // Listen for changes to wires map
    wires.forEach((wire) => {
      handleWireChange(wire.id, wire);
    });
  }, [wires]);

  return (
    <div style={{ border: '1px solid #ccc', display: 'inline-block' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
}
