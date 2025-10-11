import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";

interface BidirectionalEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: any;
  targetPosition: any;
  style?: React.CSSProperties;
  markerEnd?: string;
}

export default function BidirectionalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: BidirectionalEdgeProps) {
  const offset = 40; 
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const offsetX = (dy / dist) * offset;
  const offsetY = (-dx / dist) * offset;

  const sourceXOffset = sourceX + offsetX / 2;
  const sourceYOffset = sourceY + offsetY / 2;
  const targetXOffset = targetX + offsetX / 2;
  const targetYOffset = targetY + offsetY / 2;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourceXOffset,
    sourceY: sourceYOffset,
    sourcePosition,
    targetX: targetXOffset,
    targetY: targetYOffset,
    targetPosition,
  });

  return (
    <>
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="10"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#555" />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: "#555", strokeWidth: 2, ...style }}
        markerEnd="url(#arrowhead)"
      />

      <BaseEdge
        id={`${id}-reverse`}
        path={edgePath}
        style={{
          stroke: "#555",
          strokeWidth: 2,
          strokeDasharray: "5,5",
          ...style,
        }}
        markerStart="url(#arrowhead)"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 10,
            color: "#333",
            background: "white",
            padding: "2px 4px",
            borderRadius: "4px",
          }}
          className="nodrag nopan"
        >
          ↔
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
