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
): [string, number, number] => {
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

  return [path, controlX, controlY];
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

  const [path, labelX, labelY] = getSpecialPath(
    edgePathParams,
    sourceX < targetX ? 25 : -25,
  );

  return (
    <>
      <BaseEdge path={path} markerEnd={markerEnd} style={data?.style as React.CSSProperties | undefined} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
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
