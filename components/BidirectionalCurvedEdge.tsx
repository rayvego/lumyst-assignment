import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';

interface BidirectionalEdgeData {
  forwardLabel?: string;
  backwardLabel?: string;
  source: string;
  target: string;
}

export function BidirectionalCurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<BidirectionalEdgeData>) {
  const offset = 20; // Offset distance for parallel curves

  // Calculate perpendicular offset vector
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  const perpX = (-dy / length) * offset;
  const perpY = (dx / length) * offset;

  // Forward path (source → target) - offset upward
  const forwardMidX = (sourceX + targetX) / 2 + perpX;
  const forwardMidY = (sourceY + targetY) / 2 + perpY;
  const forwardPath = `M ${sourceX},${sourceY} Q ${forwardMidX},${forwardMidY} ${targetX},${targetY}`;

  // Backward path (target → source) - offset downward
  const backwardMidX = (sourceX + targetX) / 2 - perpX;
  const backwardMidY = (sourceY + targetY) / 2 - perpY;
  const backwardPath = `M ${targetX},${targetY} Q ${backwardMidX},${backwardMidY} ${sourceX},${sourceY}`;

  // Calculate label positions
  // Forward label at 35% along the forward path
  const forwardLabelX = sourceX + (targetX - sourceX) * 0.35 + perpX * 0.8;
  const forwardLabelY = sourceY + (targetY - sourceY) * 0.35 + perpY * 0.8;

  // Backward label at 35% along the backward path (which is 65% from original source)
  const backwardLabelX = targetX + (sourceX - targetX) * 0.35 - perpX * 0.8;
  const backwardLabelY = targetY + (sourceY - targetY) * 0.35 - perpY * 0.8;

  return (
    <>
      {/* Forward path (source → target) */}
      <BaseEdge
        id={`${id}-forward`}
        path={forwardPath}
        markerEnd={markerEnd}
        style={style}
      />

      {/* Backward path (target → source) */}
      <BaseEdge
        id={`${id}-backward`}
        path={backwardPath}
        markerEnd={markerEnd}
        style={style}
      />

      {/* Labels */}
      <EdgeLabelRenderer>
        {/* Forward label */}
        {data?.forwardLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${forwardLabelX}px, ${forwardLabelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.forwardLabel}
          </div>
        )}

        {/* Backward label */}
        {data?.backwardLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${backwardLabelX}px, ${backwardLabelY}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500,
              border: '1px solid #e5e7eb',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.backwardLabel}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}