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
  
  // Enhanced color scheme for better visibility
  const getEdgeColor = () => {
    if (label === 'contains') return '#6b7280'; // Gray for containment
    if (id.includes('c2_relationship')) return '#059669'; // Green for C2 relationships
    if (id.includes('cross_c1_c2_rel')) return '#d97706'; // Orange for cross relationships
    return isReverse ? '#dc2626' : '#2563eb'; // Red for reverse, blue for forward
  };
  
  const edgeColor = getEdgeColor();
  
  // If nodes are too close, use straight line with better styling
  if (distance < 80) {
    const pathData = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    return (
      <>
        <BaseEdge
          path={pathData}
          style={{
            stroke: edgeColor,
            strokeWidth: label === 'contains' ? 1.5 : 2.5,
            strokeDasharray: label === 'contains' ? '6,4' : (isReverse ? '8,4' : 'none'),
            strokeOpacity: 0.8,
            ...style,
          }}
          markerEnd={markerEnd}
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: `1.5px solid ${edgeColor}`,
              color: edgeColor,
              pointerEvents: 'all',
              zIndex: 1000,
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(4px)',
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }
  
  // Enhanced curve calculation for better visual separation
  const offsetDistance = Math.max(25, Math.min(50, distance * 0.25)); // Improved offset calculation
  
  // Calculate perpendicular vector (normalized)
  const perpX = -deltaY / distance;
  const perpY = deltaX / distance;
  
  // Apply offset based on direction with improved separation
  const offset = isReverse ? -offsetDistance : offsetDistance;
  const offsetX = perpX * offset;
  const offsetY = perpY * offset;
  
  // Create smoother curve with better control point positioning
  const controlPointDistance = distance * 0.6; // More pronounced curve
  const midX = (sourceX + targetX) / 2 + offsetX;
  const midY = (sourceY + targetY) / 2 + offsetY;
  
  // Create curved path using quadratic Bézier curve
  const pathData = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
  
  // Calculate label position at the curve midpoint (closer to the actual curve)
  const t = 0.5; // Midpoint parameter for quadratic Bézier
  const labelX = (1 - t) * (1 - t) * sourceX + 2 * (1 - t) * t * midX + t * t * targetX;
  const labelY = (1 - t) * (1 - t) * sourceY + 2 * (1 - t) * t * midY + t * t * targetY;
  
  // Enhanced edge styling for better clarity
  const getStrokeWidth = () => {
    if (label === 'contains') return 1.5;
    if (id.includes('c2_relationship')) return 2.5;
    if (id.includes('cross_c1_c2_rel')) return 2.5;
    return 2;
  };
  
  const getStrokeDashArray = () => {
    if (label === 'contains') return '6,4';
    if (isReverse) return '8,4';
    return 'none';
  };
  
  const edgeStyle = {
    stroke: edgeColor,
    strokeWidth: getStrokeWidth(),
    fill: 'none',
    strokeDasharray: getStrokeDashArray(),
    strokeOpacity: 0.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
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
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(255, 255, 255, 0.95)',
            padding: '3px 8px',
            borderRadius: '6px',
            border: `1.5px solid ${edgeColor}`,
            color: edgeColor,
            pointerEvents: 'all',
            zIndex: 1000,
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(4px)',
            maxWidth: '140px',
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