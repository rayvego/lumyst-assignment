// components/edges/CustomOffsetEdge.tsx

import React from 'react';
import { BaseEdge, getSmoothStepPath, EdgeLabelRenderer, EdgeProps } from '@xyflow/react';

// Define the shape of the data prop on your custom edge
interface CustomEdgeData {
  offsetX?: number;
  reversed?: boolean;
}

const CustomOffsetEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
  label,
  labelBgStyle,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  // Apply the offsetX from the data prop to the control points
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const adjustedPath = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    offset: data?.offsetX || 0,
  })[0];

  return (
    <>
      <BaseEdge id={id} path={adjustedPath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div
              className="react-flow__edge-label-container"
              style={{
                padding: labelBgPadding,
                borderRadius: labelBgBorderRadius,
                ...labelBgStyle,
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomOffsetEdge;