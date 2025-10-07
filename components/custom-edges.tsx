import React from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

interface CustomEdgeProps extends EdgeProps {
  data?: {
    isBidirectional?: boolean;
    forwardLabel?: string;
    backwardLabel?: string;
  };
}

export function CustomBidirectionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
}: CustomEdgeProps) {
  
  // Calculate the bezier path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // If it's bidirectional, we need to create two curved paths
  if (data?.isBidirectional) {
    // Dynamic offset based on edge length for better scaling
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const edgeLength = Math.sqrt(dx * dx + dy * dy);
    
    // Handle edge case where nodes are very close
    if (edgeLength < 10) {
      return (
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      );
    }
    
    // Calculate dynamic offset (scales with edge length, but has min/max bounds)
    const offsetDistance = Math.max(15, Math.min(40, edgeLength * 0.1));
    
    // Calculate perpendicular vector for offset
    const unitX = dx / edgeLength;
    const unitY = dy / edgeLength;
    const perpX = -unitY * offsetDistance;
    const perpY = unitX * offsetDistance;

    // Create unique marker IDs for this edge
    const forwardMarkerId = `forward-arrow-${id}`;
    const backwardMarkerId = `backward-arrow-${id}`;

    // Create two curved paths with proper curvature
    const [forwardPath, forwardLabelX, forwardLabelY] = getBezierPath({
      sourceX: sourceX + perpX * 0.3, // Smaller offset near connection points
      sourceY: sourceY + perpY * 0.3,
      sourcePosition,
      targetX: targetX + perpX * 0.3,
      targetY: targetY + perpY * 0.3,
      targetPosition,
      curvature: 0.3, // Increased curvature for better separation
    });

    const [backwardPath, backwardLabelX, backwardLabelY] = getBezierPath({
      sourceX: sourceX - perpX * 0.3,
      sourceY: sourceY - perpY * 0.3,
      sourcePosition,
      targetX: targetX - perpX * 0.3,
      targetY: targetY - perpY * 0.3,
      targetPosition,
      curvature: 0.3,
    });

    // Calculate smart label positions that avoid overlap
    // Position labels at different points along their respective paths
    const forwardLabelOffset = Math.max(20, offsetDistance * 0.8);
    const backwardLabelOffset = Math.max(20, offsetDistance * 0.8);
    
    // Calculate label positions along the edge direction
    const labelOffsetX = unitX * 30; // Offset along edge direction
    const labelOffsetY = unitY * 30;
    
    const smartForwardLabelX = forwardLabelX + perpX * 0.5 - labelOffsetX;
    const smartForwardLabelY = forwardLabelY + perpY * 0.5 - labelOffsetY;
    
    const smartBackwardLabelX = backwardLabelX - perpX * 0.5 + labelOffsetX;
    const smartBackwardLabelY = backwardLabelY - perpY * 0.5 + labelOffsetY;

    return (
      <>
        {/* Arrow markers - define them first */}
        <defs>
          <marker
            id={forwardMarkerId}
            markerWidth="12"
            markerHeight="12"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto"
            refX="0"
            refY="0"
          >
            <polyline
              stroke="rgba(59, 130, 246, 0.95)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              points="-6,-4 0,0 -6,4"
            />
          </marker>
          <marker
            id={backwardMarkerId}  
            markerWidth="12"
            markerHeight="12"
            viewBox="-10 -10 20 20"
            markerUnits="strokeWidth"
            orient="auto"
            refX="0"
            refY="0"
          >
            <polyline
              stroke="rgba(239, 68, 68, 0.95)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              points="6,-4 0,0 6,4"
            />
          </marker>
        </defs>
        
        {/* Forward edge */}
        <BaseEdge
          path={forwardPath}
          markerEnd={`url(#${forwardMarkerId})`}
          style={{
            ...style,
            strokeWidth: style.strokeWidth || 1.5,
            stroke: 'rgba(59, 130, 246, 0.95)', // Consistent blue color for forward edge
          }}
        />
        
        {/* Backward edge */}
        <BaseEdge
          path={backwardPath}
          markerStart={`url(#${backwardMarkerId})`}
          style={{
            ...style,
            strokeWidth: style.strokeWidth || 1.5,
            stroke: 'rgba(239, 68, 68, 0.95)', // Consistent red color for backward edge
          }}
        />

        {/* Smart edge labels with dynamic positioning */}
        <EdgeLabelRenderer>
          {data.forwardLabel && (
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${smartForwardLabelX}px,${smartForwardLabelY}px)`,
                fontSize: 10,
                fontWeight: 600,
                background: 'rgba(59, 130, 246, 0.95)',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(4px)',
              }}
              className="nodrag nopan"
            >
              {data.forwardLabel}
            </div>
          )}
          {data.backwardLabel && (
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${smartBackwardLabelX}px,${smartBackwardLabelY}px)`,
                fontSize: 10,
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '3px 8px',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                pointerEvents: 'none',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                zIndex: 1000,
                whiteSpace: 'nowrap',
                backdropFilter: 'blur(4px)',
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

  // Regular single-direction edge
  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '3px 8px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              pointerEvents: 'none',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              zIndex: 1000,
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(4px)',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const edgeTypes = {
  bidirectional: CustomBidirectionalEdge
};
