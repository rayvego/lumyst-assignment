"use client";
 
import React from "react";
import { BaseEdge, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";

// A curved edge that supports rendering two opposite directions between the same nodes
// without their labels overlapping. The curve is achieved by offsetting the control
// points perpendicular to the line between source and target.

interface BidirectionalData {
  label?: string;
  // +1 or -1 determines which side of the straight line the curve bends to.
  // If 0 or undefined, defaults to +1.
  offset?: number;
  labelClassName?: string;
}

export default function BidirectionalEdge(
  props: EdgeProps<any>
) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    markerStart,
    style,
    data,
  } = props;

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const dist = Math.max(Math.hypot(dx, dy), 1);

  // Unit perpendicular vector (normal) to the line from source -> target.
  const nx = -dy / dist;
  const ny = dx / dist;

  // Curve magnitude scales a bit with distance but is capped to avoid extreme bends.
  const curveMagnitude = Math.min(60, Math.max(28, dist * 0.15));
  const side = data?.offset === -1 ? -1 : 1; // default to +1

  // Control points offset along the normal to create a smooth curved path.
  const c1x = sourceX + dx * 0.25 + nx * curveMagnitude * side;
  const c1y = sourceY + dy * 0.25 + ny * curveMagnitude * side;
  const c2x = targetX - dx * 0.25 + nx * curveMagnitude * side;
  const c2y = targetY - dy * 0.25 + ny * curveMagnitude * side;

  const path = `M ${sourceX},${sourceY} C ${c1x},${c1y} ${c2x},${c2y} ${targetX},${targetY}`;

  // Compute label position roughly at t=0.5 along the cubic Bezier
  const t = 0.5;
  const oneMinusT = 1 - t;
  const labelX =
    oneMinusT ** 3 * sourceX +
    3 * oneMinusT ** 2 * t * c1x +
    3 * oneMinusT * t ** 2 * c2x +
    t ** 3 * targetX;
  const labelY =
    oneMinusT ** 3 * sourceY +
    3 * oneMinusT ** 2 * t * c1y +
    3 * oneMinusT * t ** 2 * c2y +
    t ** 3 * targetY;

  // Offset label slightly further out on the same side as the curve so the two
  // edge labels do not overlap at the midpoint.
  const labelOffset = 16; // pixels
  const labelPosX = labelX + nx * (labelOffset + 2) * side;
  const labelPosY = labelY + ny * (labelOffset + 2) * side;

  return (
    <>
      <BaseEdge id={id} path={path} style={style} markerEnd={markerEnd} markerStart={markerStart} />
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelPosX}px, ${labelPosY}px)`,
              pointerEvents: "all",
              whiteSpace: "nowrap",
              fontWeight: 500,
              color: "#111827",
            }}
            className={data?.labelClassName}
          >
            <span
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "2px 6px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              {data.label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
