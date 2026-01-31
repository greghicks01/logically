import { render, screen, fireEvent } from '@testing-library/react';
import { PinComponent } from '../../src/components/Pin/PinComponent';
import { Pin } from '../../src/models/Pin';
import { LogicLevel } from '../../src/models/LogicLevel';

describe('PinComponent', () => {
  const mockPin: Pin = {
    id: 'test-pin',
    label: 'TEST',
    position: { x: 100, y: 100 },
    state: LogicLevel.LOW,
  };

  const mockOnPinClick = jest.fn();

  beforeEach(() => {
    mockOnPinClick.mockClear();
  });

  it('should render pin at correct position', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} />
      </svg>
    );

    const pinCircle = container.querySelector('circle[r="5"]');
    expect(pinCircle).toHaveAttribute('cx', '100');
    expect(pinCircle).toHaveAttribute('cy', '100');
  });

  it('should render with correct color based on logic level', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} />
      </svg>
    );

    const pinCircle = container.querySelector('circle[r="5"]');
    expect(pinCircle).toHaveAttribute('fill', '#0066CC'); // LOW state color
  });

  it('should call onPinClick when clicked', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} onPinClick={mockOnPinClick} />
      </svg>
    );

    const pinGroup = container.querySelector('g');
    fireEvent.click(pinGroup!);

    expect(mockOnPinClick).toHaveBeenCalledTimes(1);
    expect(mockOnPinClick).toHaveBeenCalledWith(
      mockPin,
      expect.any(Object)
    );
  });

  it('should not call onPinClick when no handler provided', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} />
      </svg>
    );

    const pinGroup = container.querySelector('g');
    expect(() => fireEvent.click(pinGroup!)).not.toThrow();
  });

  it('should highlight pin when isHighlighted is true', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} isHighlighted={true} />
      </svg>
    );

    const highlightCircle = container.querySelector('circle[r="10"]');
    expect(highlightCircle).toBeInTheDocument();
    expect(highlightCircle).toHaveAttribute('stroke', '#FFD700');
  });

  it('should not show highlight when isHighlighted is false', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} isHighlighted={false} />
      </svg>
    );

    const highlightCircle = container.querySelector('circle[r="10"]');
    expect(highlightCircle).not.toBeInTheDocument();
  });

  it('should show pointer cursor when onPinClick is provided', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} onPinClick={mockOnPinClick} />
      </svg>
    );

    const pinGroup = container.querySelector('g');
    expect(pinGroup).toHaveStyle({ cursor: 'pointer' });
  });

  it('should show default cursor when no onPinClick provided', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} />
      </svg>
    );

    const pinGroup = container.querySelector('g');
    expect(pinGroup).toHaveStyle({ cursor: 'default' });
  });

  it('should render hover area for easier clicking', () => {
    const { container } = render(
      <svg>
        <PinComponent pin={mockPin} />
      </svg>
    );

    const hoverArea = container.querySelector('circle[r="8"]');
    expect(hoverArea).toBeInTheDocument();
    expect(hoverArea).toHaveAttribute('fill', 'transparent');
  });

  it('should stop event propagation when pin is clicked', () => {
    const parentClickHandler = jest.fn();
    const { container } = render(
      <svg onClick={parentClickHandler}>
        <PinComponent pin={mockPin} onPinClick={mockOnPinClick} />
      </svg>
    );

    const pinGroup = container.querySelector('g');
    fireEvent.click(pinGroup!);

    expect(mockOnPinClick).toHaveBeenCalledTimes(1);
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  it('should handle different logic levels with appropriate colors', () => {
    const states = [
      { level: LogicLevel.LOW, color: '#0066CC' },
      { level: LogicLevel.HIGH, color: '#CC0000' },
      { level: LogicLevel.HI_Z, color: '#808080' },
      { level: LogicLevel.CONFLICT, color: '#FF6600' },
    ];

    states.forEach(({ level, color }) => {
      const pin = { ...mockPin, state: level };
      const { container } = render(
        <svg>
          <PinComponent pin={pin} />
        </svg>
      );

      const pinCircle = container.querySelector('circle[r="5"]');
      expect(pinCircle).toHaveAttribute('fill', color);
    });
  });
});
