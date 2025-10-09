/**
 * Component to render background boxes for C1 category groups
 * Helps visually separate different parts of the codebase
 */
export function GroupBackground({ 
  bounds 
}: { 
  bounds: Array<{ x: number; y: number; width: number; height: number }> 
}) {
  return (
    <svg
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      {bounds.map((bound, index) => (
        <rect
          key={`group-bg-${index}`}
          x={bound.x}
          y={bound.y}
          width={bound.width}
          height={bound.height}
          fill={`hsl(${(index * 60) % 360}, 40%, 98%)`}
          stroke={`hsl(${(index * 60) % 360}, 40%, 85%)`}
          strokeWidth="2"
          rx="12"
          ry="12"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}
