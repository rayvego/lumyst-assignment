import React from 'react';
import { EdgeProps, getStraightPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

interface BidirectionalEdgeData extends Record<string, unknown> {
  label: string;
  isReverse?: boolean;
  bidirectionalPair?: string;
}

interface BidirectionalEdgeProps extends EdgeProps {
  data?: BidirectionalEdgeData;
}

export function BidirectionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: BidirectionalEdgeProps) {
  // Calculate if this edge has a bidirectional counterpart
  const isReverse = data?.isReverse || false;
  const label = data?.label || '';
  
  // Calculate the distance and direction between source and target
  const deltaX = targetX - sourceX;
  const deltaY = targetY - sourceY;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  // If nodes are too close, use minimal curve
  if (distance < 50) {
    const pathData = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    return (
      <>
        <BaseEdge
          path={pathData}
          style={{
            stroke: isReverse ? '#ef4444' : '#3b82f6',
            strokeWidth: 2,
            ...style,
          }}
          markerEnd={markerEnd}
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              fontSize: 12,
              fontWeight: 500,
              background: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              border: `1px solid ${isReverse ? '#ef4444' : '#3b82f6'}`,
              color: isReverse ? '#ef4444' : '#3b82f6',
              pointerEvents: 'all',
              zIndex: 1000,
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
  
  // Calculate perpendicular offset for bidirectional edges
  const offsetDistance = Math.min(30, distance * 0.2); // Dynamic offset based on distance
  
  // Calculate perpendicular vector (normalized)
  const perpX = -deltaY / distance;
  const perpY = deltaX / distance;
  
  // Apply offset based on direction (forward vs reverse)
  const offset = isReverse ? -offsetDistance : offsetDistance;
  const offsetX = perpX * offset;
  const offsetY = perpY * offset;
  
  // Calculate control point for quadratic Bézier curve
  // Place it at the midpoint with perpendicular offset
  const midX = (sourceX + targetX) / 2 + offsetX;
  const midY = (sourceY + targetY) / 2 + offsetY;
  
  // Create curved path using quadratic Bézier curve
  const pathData = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
  
  // Calculate label position at the curve midpoint (closer to the actual curve)
  const t = 0.5; // Midpoint parameter for quadratic Bézier
  const labelX = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * midX + t * t * targetX;
  const labelY = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * midY + t * t * targetY;
  
  // Determine edge color and style based on direction
  const edgeColor = isReverse ? '#ef4444' : '#3b82f6'; // red for reverse, blue for forward
  const edgeStyle = {
    stroke: edgeColor,
    strokeWidth: 2,
    fill: 'none',
    strokeDasharray: isReverse ? '8,4' : 'none', // Dashed for reverse edges
    ...style,
  };

  return (
    <>
      <BaseEdge
        path={pathData}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            fontSize: 12,
            fontWeight: 500,
            background: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            border: `1px solid ${edgeColor}`,
            color: edgeColor,
            pointerEvents: 'all',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          className="nodrag nopan"
          title={label} // Show full label on hover
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

// Function to detect and process bidirectional edges
export function processBidirectionalEdges(edges: any[]) {
  const edgeMap = new Map<string, any>();
  const bidirectionalPairs = new Set<string>();
  const processedEdges: any[] = [];
  
  // First pass: create edge map and identify all edges
  for (const edge of edges) {
    const key = `${edge.source}-${edge.target}`;
    edgeMap.set(key, edge);
  }
  
  // Second pass: identify bidirectional pairs
  for (const edge of edges) {
    const key = `${edge.source}-${edge.target}`;
    const reverseKey = `${edge.target}-${edge.source}`;
    
    if (edgeMap.has(reverseKey)) {
      bidirectionalPairs.add(key);
      bidirectionalPairs.add(reverseKey);
    }
  }
  
  // Third pass: create processed edges with bidirectional information
  for (const edge of edges) {
    const key = `${edge.source}-${edge.target}`;
    
    if (bidirectionalPairs.has(key)) {
      // This is part of a bidirectional pair
      // Determine which direction this edge represents
      // Use consistent ordering: smaller ID goes first for forward direction
      const isReverse = edge.source > edge.target;
      
      processedEdges.push({
        ...edge,
        type: 'bidirectional',
        data: {
          label: edge.label || '',
          isReverse,
          bidirectionalPair: key,
        },
      });
    } else {
      // Regular edge - not bidirectional
      processedEdges.push({
        ...edge,
        type: 'bidirectional',
        data: {
          label: edge.label || '',
          isReverse: false,
        },
      });
    }
  }
  
  return processedEdges;
}

// Edge type definition for React Flow
export const bidirectionalEdgeTypes = {
  bidirectional: BidirectionalEdge,
};