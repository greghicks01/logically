import { renderHook, act } from '@testing-library/react';
import { useWiring } from '../../src/hooks/useWiring';
import { Pin } from '../../src/models/Pin';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('useWiring Hook', () => {
  const mockPinA: Pin = {
    id: 'pin-a',
    label: 'A',
    position: { x: 0, y: 0 },
    state: LogicLevel.LOW,
  };

  const mockPinB: Pin = {
    id: 'pin-b',
    label: 'B',
    position: { x: 100, y: 100 },
    state: LogicLevel.LOW,
  };

  it('should initialize with no active wiring', () => {
    const { result } = renderHook(() => useWiring());

    expect(result.current.wiringState.isWiring).toBe(false);
    expect(result.current.wiringState.startPin).toBeNull();
    expect(result.current.wiringState.currentPosition).toBeNull();
    expect(result.current.wiringState.previewPoints).toEqual([]);
  });

  it('should start wiring when startWiring is called', () => {
    const { result } = renderHook(() => useWiring());

    act(() => {
      result.current.startWiring(mockPinA);
    });

    expect(result.current.wiringState.isWiring).toBe(true);
    expect(result.current.wiringState.startPin).toEqual(mockPinA);
    expect(result.current.wiringState.previewPoints).toEqual([mockPinA.position]);
  });

  it('should update wire preview as position changes', () => {
    const { result } = renderHook(() => useWiring());

    act(() => {
      result.current.startWiring(mockPinA);
    });

    const newPosition = { x: 50, y: 50 };
    act(() => {
      result.current.updateWirePreview(newPosition);
    });

    expect(result.current.wiringState.currentPosition).toEqual(newPosition);
    expect(result.current.wiringState.previewPoints).toEqual([
      mockPinA.position,
      newPosition,
    ]);
  });

  it('should complete wiring and create wire when valid pins are connected', () => {
    const { result } = renderHook(() => useWiring());

    act(() => {
      result.current.startWiring(mockPinA);
    });

    let wire;
    act(() => {
      wire = result.current.completeWiring(mockPinB);
    });

    expect(wire).not.toBeNull();
    expect(wire?.path).toEqual([mockPinA.position, mockPinB.position]);
    expect(result.current.wiringState.isWiring).toBe(false);
    expect(result.current.wiringState.startPin).toBeNull();
  });

  it('should prevent connecting pin to itself', () => {
    const { result } = renderHook(() => useWiring());

    const validation = result.current.canConnect(mockPinA, mockPinA);

    expect(validation.valid).toBe(false);
    expect(validation.reason).toBe('Cannot connect pin to itself');
  });

  it('should allow connecting different pins', () => {
    const { result } = renderHook(() => useWiring());

    const validation = result.current.canConnect(mockPinA, mockPinB);

    expect(validation.valid).toBe(true);
  });

  it('should cancel wiring and reset state', () => {
    const { result } = renderHook(() => useWiring());

    act(() => {
      result.current.startWiring(mockPinA);
      result.current.updateWirePreview({ x: 50, y: 50 });
    });

    expect(result.current.wiringState.isWiring).toBe(true);

    act(() => {
      result.current.cancelWiring();
    });

    expect(result.current.wiringState.isWiring).toBe(false);
    expect(result.current.wiringState.startPin).toBeNull();
    expect(result.current.wiringState.currentPosition).toBeNull();
    expect(result.current.wiringState.previewPoints).toEqual([]);
  });

  it('should not create wire when completing without starting', () => {
    const { result } = renderHook(() => useWiring());

    let wire;
    act(() => {
      wire = result.current.completeWiring(mockPinB);
    });

    expect(wire).toBeNull();
  });

  it('should not update preview when not wiring', () => {
    const { result } = renderHook(() => useWiring());

    const initialState = result.current.wiringState;

    act(() => {
      result.current.updateWirePreview({ x: 50, y: 50 });
    });

    expect(result.current.wiringState).toEqual(initialState);
  });
});
