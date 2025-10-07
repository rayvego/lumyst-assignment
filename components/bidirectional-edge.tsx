import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";

export default function BidirectionalEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  markerStart,
  label,
  style,
}: EdgeProps) {
    
  // Only render one combined bidirectional edge
  const shouldRender = source < target;
  if (!shouldRender) return null;

  const [mainPath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const normX = dx / len;
  const normY = dy / len;

  const curveOffset = 25;
  const labelOffset = 20;

  // Forward and reverse curved paths
  const curvedPathA = getBezierPath({
    sourceX: sourceX - normY * curveOffset,
    sourceY: sourceY + normX * curveOffset,
    targetX: targetX - normY * curveOffset,
    targetY: targetY + normX * curveOffset,
    sourcePosition,
    targetPosition,
  });

  const curvedPathB = getBezierPath({
    sourceX: sourceX + normY * curveOffset,
    sourceY: sourceY - normX * curveOffset,
    targetX: targetX + normY * curveOffset,
    targetY: targetY - normX * curveOffset,
    sourcePosition,
    targetPosition,
  });

  const isVertical = Math.abs(normY) > 0.9;
  const isHorizontal = Math.abs(normX) > 0.9;

  let labelXA = labelX;
  let labelYA = labelY;
  let labelXB = labelX;
  let labelYB = labelY;

  if (isVertical || isHorizontal) {
    const verticalGap = 22;
    const horizontalGap = Math.min(curveOffset * 0.6, Math.abs(dx / 4)); // up to half distance between lines

    labelYA -= verticalGap;
    labelYB += verticalGap;

    labelXA -= horizontalGap;
    labelXB += horizontalGap;
  } else {
    labelXA = labelX + normY * labelOffset;
    labelYA = labelY - normX * labelOffset;
    labelXB = labelX - normY * labelOffset;
    labelYB = labelY + normX * labelOffset;
  }

  const edgeStyle = {
    strokeWidth: 2,
    stroke: "#2563eb",
    ...style,
  };

  const labelBaseStyle: React.CSSProperties = {
    position: "absolute",
    transform: "translate(-50%, -50%)",
    background: "white",
    padding: "0 4px",
    fontSize: 12,
    fontWeight: 500,
    color: "#000",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
  };

  return (
    <>
      {/* Forward curve */}
      <BaseEdge
        id={`${id}-forward`}
        path={curvedPathA[0]}
        style={edgeStyle}
        markerEnd={markerEnd}
      />

      {/* Reverse curve */}
      <BaseEdge
        id={`${id}-reverse`}
        path={curvedPathB[0]}
        style={edgeStyle}
        markerStart={markerStart}
      />

      {/* Labels */}
      {label && (
        <EdgeLabelRenderer>
          <>
            <div
              style={{
                ...labelBaseStyle,
                transform: `translate(-50%, -50%) translate(${labelXA}px, ${labelYA}px)`,
              }}
              className="nodrag nopan"
            >
              {label}
            </div>

            <div
              style={{
                ...labelBaseStyle,
                transform: `translate(-50%, -50%) translate(${labelXB}px, ${labelYB}px)`,
              }}
              className="nodrag nopan"
            >
              {label}
            </div>
          </>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
