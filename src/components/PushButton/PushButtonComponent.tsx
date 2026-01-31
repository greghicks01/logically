import { useState } from 'react';
import { PushButton } from '../../models/PinComponent';
import { LogicLevel } from '../../models/LogicLevel';

export interface PushButtonComponentProps {
  button: PushButton;
  onPress: (buttonId: string) => void;
  onRelease: (buttonId: string) => void;
}

/**
 * Push Button component for interactive circuit testing
 */
export function PushButtonComponent({ button, onPress, onRelease }: PushButtonComponentProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = () => {
    onPress(button.id);
  };

  const handleMouseUp = () => {
    if (button.type === 'momentary') {
      onRelease(button.id);
    }
  };

  const handleClick = () => {
    if (button.type === 'toggle') {
      if (button.state === 'pressed') {
        onRelease(button.id);
      } else {
        onPress(button.id);
      }
    }
  };

  const isPressed = button.state === 'pressed';

  return (
    <g
      transform={`translate(${button.position.x}, ${button.position.y})`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer', userSelect: 'none' }}
    >
      {/* Button body */}
      <rect
        width={button.size.width}
        height={button.size.height}
        rx={4}
        fill={isPressed ? '#4CAF50' : '#E0E0E0'}
        stroke={isHovered ? '#333' : '#666'}
        strokeWidth={isHovered ? 2 : 1}
      />

      {/* Button label */}
      <text
        x={button.size.width / 2}
        y={button.size.height / 2 + 5}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill={isPressed ? '#fff' : '#333'}
      >
        {button.type === 'toggle' ? 'TOGGLE' : 'PUSH'}
      </text>

      {/* State indicator */}
      <circle
        cx={button.size.width - 8}
        cy={8}
        r={4}
        fill={button.outputValue === LogicLevel.HIGH ? '#FF0000' : '#0066CC'}
      />
    </g>
  );
}
