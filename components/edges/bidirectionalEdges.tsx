import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react';

export type GetSpecialPathParams = {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

export const getSpecialPath = (
  { sourceX, sourceY, targetX, targetY }: GetSpecialPathParams,
  offset: number,
): [string, number, number, boolean] => {
  const centerX = (sourceX + targetX) / 2;   
  const centerY = (sourceY + targetY) / 2;
  
  const isVertical = Math.abs(targetX - sourceX) < 50;
  
  let controlX = centerX;
  let controlY = centerY;
  
  if (isVertical) {
    controlX += offset;
  } else {
    controlY += offset;
  }
  
  const path = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

  return [path, controlX, controlY, isVertical];
};

export default function CustomEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
  label,
}: EdgeProps) {
  const edgePathParams = {
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  };

  const offset = sourceX < targetX ? 25 : -25;
  const [path, labelX, labelY, isVertical] = getSpecialPath(edgePathParams, offset);

  let adjustedLabelY = labelY;
  
  if (isVertical) {
    // Offset the label for vertical edges
    adjustedLabelY = labelY + (sourceY < targetY ? -10 : 10);
  }

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={data?.style as React.CSSProperties | undefined} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${adjustedLabelY}px)`,
              background: `${data?.stroke || 'grey'}`,
              padding: '2px 4px',
              borderRadius: '4px',
              color: 'white',
              fontSize: 12,
              fontWeight: 500,
              pointerEvents: 'all',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
