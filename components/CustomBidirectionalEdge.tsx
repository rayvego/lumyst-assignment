// Add to components/react-flow-nodes.tsx or a new dedicated file

import React from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge, getEdgeCenter } from 'reactflow';
import type { EdgeProps } from 'reactflow';

// This is the custom component for bidirectional edges
const CustomBidirectionalEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) => {
  if (!data?.isBidirectional) {
    // Fallback for non-bidirectional edges
    const [path] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
    const [edgeCenterX, edgeCenterY] = getEdgeCenter({ sourceX, sourceY, targetX, targetY });
    return (
      <>
        <BaseEdge id={id} path={path} style={{ stroke: 'black', strokeWidth: 1 }} />
        <EdgeLabelRenderer>
          <div style={{
            transform: `translate(-50%, -50%) translate(${edgeCenterX}px,${edgeCenterY}px)`,
            pointerEvents: 'all',
          }}>
            {data?.label}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  // Logic for bidirectional edges
  const offset = 10; // Adjust for visual separation
  const isReverse = data.direction === 'B_TO_A';

  const [path, labelX, labelY] = getBezierPath({
    sourceX: isReverse ? targetX : sourceX,
    sourceY: isReverse ? targetY : sourceY,
    sourcePosition: isReverse ? targetPosition : sourcePosition,
    targetX: isReverse ? sourceX : targetX,
    targetY: isReverse ? sourceY : targetY,
    targetPosition: isReverse ? sourcePosition : targetPosition,
  });

  const [edgeCenterX, edgeCenterY] = getEdgeCenter({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  // Calculate perpendicular vector for offset
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const normalX = dy / dist;
  const normalY = -dx / dist;

  const curvedPath = getBezierPath({
    sourceX: sourceX + normalX * offset,
    sourceY: sourceY + normalY * offset,
    targetX: targetX + normalX * offset,
    targetY: targetY + normalY * offset,
    sourcePosition,
    targetPosition,
  });

  // Smart label placement logic
  // Slide the label towards the start node
  const labelPosFactor = isReverse ? 0.6 : 0.4;
  const [curveX, curveY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    offset: 0,
  }, labelPosFactor);

  const labelStyle = {
    fill: '#000',
    fontWeight: '500',
    transform: `translate(-50%, -50%) translate(${curveX + normalX * offset * 0.5}px,${curveY + normalY * offset * 0.5}px)`,
    pointerEvents: 'all',
    // Add logic here to dynamically "slide" the label if needed
  };

  return (
    <>
      <BaseEdge id={id} path={curvedPath[0]} style={{ stroke: isReverse ? 'blue' : 'green', strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div style={labelStyle}>
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomBidirectionalEdge;