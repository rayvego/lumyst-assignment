import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

/**
 * Enhanced curved edge component with smart routing
 * Features:
 * - Smooth bezier curves
 * - Offset for bidirectional edges
 * - Color coding based on edge type
 */
export default function EnhancedCurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  // Calculate offset for bidirectional edges
  const offset = (data?.offset as number) || 0;
  
  // Apply offset perpendicular to edge direction
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  let offsetSourceX = sourceX;
  let offsetSourceY = sourceY;
  let offsetTargetX = targetX;
  let offsetTargetY = targetY;
  
  if (length > 0 && offset !== 0) {
    // Perpendicular offset
    const perpX = -dy / length;
    const perpY = dx / length;
    
    offsetSourceX += perpX * offset;
    offsetSourceY += perpY * offset;
    offsetTargetX += perpX * offset;
    offsetTargetY += perpY * offset;
  }

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: offsetSourceX,
    sourceY: offsetSourceY,
    sourcePosition,
    targetX: offsetTargetX,
    targetY: offsetTargetY,
    targetPosition,
    curvature: 0.25, // Smooth curve
  });

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        style={style}
        markerEnd={markerEnd}
      />
      {label && (
        <text
          x={labelX}
          y={labelY}
          style={{
            fontSize: 10,
            fill: '#666',
            fontWeight: 500,
            pointerEvents: 'none',
          }}
          className="react-flow__edge-text"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {label}
        </text>
      )}
    </>
  );
}
