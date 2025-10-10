import * as React from "react";
import { getEdgeCenter } from "@xyflow/react";

export interface BidirectionalEdgeProps {
    id: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: "left" | "right" | "top" | "bottom";
    targetPosition: "left" | "right" | "top" | "bottom";
    source: string;
    target: string;
    label?: string;
    style?: React.CSSProperties;
    markerEnd?: string;
}

export function BidirectionalEdge(props: BidirectionalEdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        label,
        style,
        markerEnd
    } = props;

    
    const offsetSign = source < target ? 1 : -1;
    const offset = 20 * offsetSign;

    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const controlX = midX + perpX * offset;
    const controlY = midY + perpY * offset;

    const edgePath = `M${sourceX},${sourceY} Q${controlX},${controlY} ${targetX},${targetY}`;

    const labelX = controlX;
    const labelY = controlY;

    return (
        <>
            <path
                id={id}
                d={edgePath}
                style={style}
                markerEnd={markerEnd}
                stroke="black"
                fill="none"
            />
            {label && (
                <text style={{ fontSize: 12, userSelect: "none" }}>
                    <textPath
                        href={`#${id}`}
                        startOffset="50%"
                        textAnchor="middle"
                    >
                        {label}
                    </textPath>
                </text>
            )}
        </>
    );
}