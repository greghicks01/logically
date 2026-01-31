import { WireStateCalculator } from '../../src/lib/WireStateCalculator';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('WireStateCalculator', () => {
  it('should return HI_Z for no drivers', () => {
    const state = WireStateCalculator.calculateState([]);
    expect(state).toBe(LogicLevel.HI_Z);
  });

  it('should return driver state for single driver', () => {
    const drivers = [{ id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH }];
    const state = WireStateCalculator.calculateState(drivers);
    expect(state).toBe(LogicLevel.HIGH);
  });

  it('should detect conflict with multiple different drivers', () => {
    const drivers = [
      { id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH },
      { id: 'd2', componentId: 'c2', outputState: LogicLevel.LOW },
    ];
    const state = WireStateCalculator.calculateState(drivers);
    expect(state).toBe(LogicLevel.CONFLICT);
  });

  it('should not conflict when drivers agree', () => {
    const drivers = [
      { id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH },
      { id: 'd2', componentId: 'c2', outputState: LogicLevel.HIGH },
    ];
    const state = WireStateCalculator.calculateState(drivers);
    expect(state).toBe(LogicLevel.HIGH);
  });

  it('should ignore Hi-Z drivers', () => {
    const drivers = [
      { id: 'd1', componentId: 'c1', outputState: LogicLevel.HI_Z },
      { id: 'd2', componentId: 'c2', outputState: LogicLevel.HIGH },
    ];
    const state = WireStateCalculator.calculateState(drivers);
    expect(state).toBe(LogicLevel.HIGH);
  });

  it('should detect conflicts correctly', () => {
    const drivers1 = [
      { id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH },
      { id: 'd2', componentId: 'c2', outputState: LogicLevel.LOW },
    ];
    expect(WireStateCalculator.detectConflict(drivers1)).toBe(true);

    const drivers2 = [
      { id: 'd1', componentId: 'c1', outputState: LogicLevel.HIGH },
      { id: 'd2', componentId: 'c2', outputState: LogicLevel.HIGH },
    ];
    expect(WireStateCalculator.detectConflict(drivers2)).toBe(false);
  });
});
