import React from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, Position } from "@xyflow/react";

interface BidirectionalEdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
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
}: BidirectionalEdgeProps) {
  const offset = 25; 
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const offsetX = (dy / dist) * offset;
  const offsetY = (-dx / dist) * offset;

  const paths = [
    getBezierPath({
      sourceX: sourceX + offsetX,
      sourceY: sourceY + offsetY,
      sourcePosition,
      targetX: targetX + offsetX,
      targetY: targetY + offsetY,
      targetPosition,
    }),
    getBezierPath({
      sourceX: sourceX - offsetX,
      sourceY: sourceY - offsetY,
      sourcePosition,
      targetX: targetX - offsetX,
      targetY: targetY - offsetY,
      targetPosition,
    }),
  ];

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
        path={paths[0][0]}
        style={{ stroke: "#2563eb", strokeWidth: 2, ...style }}
        markerEnd="url(#arrowhead)"
      />

      <BaseEdge
        id={`${id}-reverse`}
        path={paths[1][0]}
        style={{ stroke: "#f87171", strokeWidth: 2, strokeDasharray: "5,5", ...style }}
        markerEnd="url(#arrowhead)"
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${(paths[0][1] + paths[1][1]) / 2}px, ${(paths[0][2] + paths[1][2]) / 2}px)`,
            fontSize: 12,
            color: "#333",
            background: "white",
            padding: "2px 4px",
            borderRadius: "4px",
            pointerEvents: "none",
          }}
          className="nodrag nopan"
        >
          ↔
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
