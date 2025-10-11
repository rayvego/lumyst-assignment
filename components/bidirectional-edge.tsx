import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, Position } from '@xyflow/react';

/**
 * Custom edge component for bidirectional edges with enhanced label positioning
 * Ensures labels are always visible, non-overlapping, and properly aligned
 */
export function BidirectionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  label,
  labelStyle = {},
  labelBgStyle = {},
  labelBgPadding = [4, 8],
  labelBgBorderRadius = 4,
  data,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition: Position.Top,
    targetX,
    targetY,
    targetPosition: Position.Bottom,
  });

  // Calculate offset for label positioning based on bidirectional data
  const labelOffset = (data?.labelOffset as number) || 0;
  const isHighlighted = data?.highlightOnHover || false;
  
  // Adjust label position based on offset
  const adjustedLabelY = labelY + labelOffset;

  return (
    <>
      <path
        id={id}
        style={{
          stroke: style.stroke || '#374151',
          strokeWidth: style.strokeWidth || 1,
          fill: 'none',
          strokeDasharray: style.strokeDasharray,
          ...style,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${adjustedLabelY}px)`,
            fontSize: isHighlighted ? '14px' : '12px',
            fontWeight: isHighlighted ? 'bold' : '500',
            pointerEvents: 'all',
            ...labelStyle,
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              background: labelBgStyle.fill || '#ffffff',
              opacity: labelBgStyle.fillOpacity || 0.7,
              padding: `${labelBgPadding[0]}px ${labelBgPadding[1]}px`,
              borderRadius: `${labelBgBorderRadius}px`,
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: isHighlighted ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

/**
 * Enhanced bidirectional edge with dual curves
 * Creates two curved paths for true bidirectional visualization
 */
export function EnhancedBidirectionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  label,
  labelStyle = {},
  labelBgStyle = {},
  labelBgPadding = [4, 8],
  labelBgBorderRadius = 4,
  data,
  markerEnd,
}: EdgeProps) {
  // Calculate the distance between source and target
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate control points for curved edges
  const controlOffset = distance * 0.3;
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  
  // Create two curves - one above and one below the direct line
  const topControlY = midY - controlOffset;
  const bottomControlY = midY + controlOffset;
  
  // Top curve path
  const topCurvePath = `M ${sourceX} ${sourceY} Q ${midX} ${topControlY} ${targetX} ${targetY}`;
  
  // Bottom curve path
  const bottomCurvePath = `M ${sourceX} ${sourceY} Q ${midX} ${bottomControlY} ${targetX} ${targetY}`;
  
  // Determine which curve this edge represents
  const isTopCurve = data?.labelPosition === 'top';
  const edgePath = isTopCurve ? topCurvePath : bottomCurvePath;
  
  // Calculate label position
  const labelX = midX;
  const labelY = isTopCurve ? topControlY : bottomControlY;
  const labelOffset = (data?.labelOffset as number) || 0;
  const isHighlighted = data?.highlightOnHover || false;
  
  // Adjust label position based on offset
  const adjustedLabelY = labelY + labelOffset;

  return (
    <>
      <path
        id={id}
        style={{
          stroke: style.stroke || '#374151',
          strokeWidth: style.strokeWidth || 1,
          fill: 'none',
          strokeDasharray: style.strokeDasharray,
          ...style,
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${adjustedLabelY}px)`,
            fontSize: isHighlighted ? '14px' : '12px',
            fontWeight: isHighlighted ? 'bold' : '500',
            pointerEvents: 'all',
            ...labelStyle,
          }}
          className="nodrag nopan"
        >
          <div
            style={{
              background: labelBgStyle.fill || '#ffffff',
              opacity: labelBgStyle.fillOpacity || 0.7,
              padding: `${labelBgPadding[0]}px ${labelBgPadding[1]}px`,
              borderRadius: `${labelBgBorderRadius}px`,
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: isHighlighted ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease-in-out',
              whiteSpace: 'nowrap',
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
