import { CompositeIC } from '../../models/CompositeIC';
import { Point } from '../../models/Point';

export interface CompositeICComponentProps {
  ic: CompositeIC;
  position: Point;
  onClick?: () => void;
}

/**
 * Composite IC Component for rendering IC instances
 */
export function CompositeICComponent({ ic, position, onClick }: CompositeICComponentProps) {
  const { boundingBox, inputPins, outputPins, name } = ic;

  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* IC body */}
      <rect
        width={boundingBox.width}
        height={boundingBox.height}
        fill="#e0e0e0"
        stroke="#333"
        strokeWidth={2}
        rx={4}
      />

      {/* IC name */}
      <text
        x={boundingBox.width / 2}
        y={boundingBox.height / 2}
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill="#333"
      >
        {name}
      </text>

      {/* Input pins */}
      {inputPins.map((pin, index) => {
        const y = 20 + index * 20;
        return (
          <g key={pin.id}>
            {/* Pin circle */}
            <circle cx={0} cy={y} r={4} fill={pin.hasInverter ? '#fff' : '#333'} stroke="#333" strokeWidth={1} />
            {/* Pin label */}
            <text x={10} y={y + 4} fontSize="10" fill="#333">
              {pin.label}
            </text>
            {/* Inverter symbol */}
            {pin.hasInverter && <circle cx={0} cy={y} r={6} fill="none" stroke="#333" strokeWidth={1} />}
          </g>
        );
      })}

      {/* Output pins */}
      {outputPins.map((pin, index) => {
        const y = 20 + index * 20;
        return (
          <g key={pin.id}>
            {/* Pin circle */}
            <circle
              cx={boundingBox.width}
              cy={y}
              r={4}
              fill={pin.hasInverter ? '#fff' : '#333'}
              stroke="#333"
              strokeWidth={1}
            />
            {/* Pin label */}
            <text x={boundingBox.width - 10} y={y + 4} fontSize="10" fill="#333" textAnchor="end">
              {pin.label}
            </text>
            {/* Inverter symbol */}
            {pin.hasInverter && (
              <circle cx={boundingBox.width} cy={y} r={6} fill="none" stroke="#333" strokeWidth={1} />
            )}
          </g>
        );
      })}
    </g>
  );
}
