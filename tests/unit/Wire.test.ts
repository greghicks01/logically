import { Wire, createWire } from '../../src/models/Wire';
import { LogicLevel } from '../../src/models/LogicLevel';
import { createPoint } from '../../src/models/Point';

describe('Wire Model', () => {
  it('should create a wire with default Hi-Z state', () => {
    const wire = createWire('w1', null, [], [createPoint(0, 0), createPoint(100, 100)]);
    
    expect(wire.id).toBe('w1');
    expect(wire.logicLevel).toBe(LogicLevel.HI_Z);
    expect(wire.path).toHaveLength(2);
  });

  it('should update color when logic level changes', () => {
    const wire = createWire('w1');
    const initialColor = wire.color;
    
    wire.setState(LogicLevel.HIGH);
    
    expect(wire.logicLevel).toBe(LogicLevel.HIGH);
    expect(wire.color).not.toBe(initialColor);
    expect(wire.color).toBe('#CC0000'); // Red for HIGH
  });

  it('should detect conflicts', () => {
    const wire = createWire('w1');
    
    expect(wire.hasConflict()).toBe(false);
    
    wire.setState(LogicLevel.CONFLICT);
    
    expect(wire.hasConflict()).toBe(true);
    expect(wire.color).toBe('#FF6600'); // Orange for CONFLICT
  });

  it('should manage drivers', () => {
    const wire = createWire('w1');
    const driver1 = { id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH };
    const driver2 = { id: 'd2', componentId: 'c2', outputState: LogicLevel.LOW };
    
    wire.addDriver(driver1);
    expect(wire.getDrivers()).toHaveLength(1);
    
    wire.addDriver(driver2);
    expect(wire.getDrivers()).toHaveLength(2);
    
    wire.removeDriver('d1');
    expect(wire.getDrivers()).toHaveLength(1);
  });
});
