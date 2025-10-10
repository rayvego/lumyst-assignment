import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import React from 'react';


type BidirectionalEdgeData = {
  label1?: string;
  label2?: string;
};

export default function BidirectionalEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<BidirectionalEdgeData>) {
  if (!data?.label1 || !data?.label2) {
    return null;
  }

  const [edgePath1, labelX1, labelY1] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const [edgePath2, labelX2, labelY2] = getBezierPath({
    sourceX: targetX,
    sourceY: targetY,
    sourcePosition: targetPosition,
    targetX: sourceX,
    targetY: sourceY,
    targetPosition: sourcePosition,
    curvature: 0.25,
  });

  return (
    <>
      <BaseEdge path={edgePath1} markerEnd={markerEnd} style={{ stroke: '#374151', strokeWidth: 1 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX1}px,${labelY1}px)`,
            background: '#fff',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: 12,
            fontWeight: 500,
            color: '#000',
          }}
          className="nodrag nopan"
        >
          {data.label1}
        </div>
      </EdgeLabelRenderer>
      <BaseEdge path={edgePath2} markerEnd={markerEnd} style={{ stroke: '#374151', strokeWidth: 1 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX2}px,${labelY2}px)`,
            background: '#fff',
            padding: '2px 4px',
            borderRadius: '4px',
            fontSize: 12,
            fontWeight: 500,
            color: '#000',
          }}
          className="nodrag nopan"
        >
          {data.label2}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}