import { LightIndicator, getLightState } from '../../models/LightIndicator';

export interface LightIndicatorComponentProps {
  component: LightIndicator;
}

/**
 * Light Indicator component for displaying logic states
 */
export function LightIndicatorComponent({ component }: LightIndicatorComponentProps) {
  const { state, color, pattern } = getLightState(component.inputValue);

  return (
    <g transform={`translate(${component.position.x}, ${component.position.y})`}>
      {/* Light body */}
      <circle
        cx={0}
        cy={0}
        r={component.radius}
        fill={state === 'off' ? '#1a1a1a' : color}
        stroke="#333"
        strokeWidth={2}
      />

      {/* Hi-Z pattern (diagonal stripes) */}
      {pattern === 'diagonal-stripes' && (
        <g>
          <defs>
            <pattern id="diagonalStripes" patternUnits="userSpaceOnUse" width="8" height="8">
              <path d="M0,8 l8,-8 M-2,2 l4,-4 M6,10 l4,-4" stroke="#404040" strokeWidth="1" />
            </pattern>
          </defs>
          <circle cx={0} cy={0} r={component.radius - 2} fill="url(#diagonalStripes)" />
        </g>
      )}

      {/* Glow effect for "on" state */}
      {state === 'on' && (
        <circle
          cx={0}
          cy={0}
          r={component.radius + 3}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.5}
        />
      )}

      {/* Input pin */}
      <circle
        cx={-20}
        cy={0}
        r={4}
        fill={color}
        stroke="#333"
        strokeWidth={1}
      />

      {/* Label */}
      <text
        x={0}
        y={component.radius + 20}
        textAnchor="middle"
        fontSize="10"
        fill="#333"
      >
        {component.id}
      </text>
    </g>
  );
}
