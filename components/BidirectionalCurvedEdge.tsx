import { BaseEdge, EdgeLabelRenderer, EdgeProps } from "@xyflow/react";
import React from 'react';

export interface BidirectionalEdgeData {
    labels: [string, string]; 
    isReversed?: boolean;
}

/**
 * Calculates a curved Bézier path with a control point offset perpendicular to the source-target line.
 * This is used to create non-overlapping parallel paths.
 */
function getOffsetBezierPath(
    sourceX: number, 
    sourceY: number, 
    targetX: number, 
    targetY: number, 
    offset: number
): { path: string, centerX: number, centerY: number } {
    const mx = (sourceX + targetX) / 2;
    const my = (sourceY + targetY) / 2;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length === 0) {
        return { path: `M${sourceX},${sourceY} L${targetX},${targetY}`, centerX: sourceX, centerY: sourceY };
    }

    // Calculate the normalized vector perpendicular to the edge (Normal vector)
    const nx = -dy / length;
    const ny = dx / length;

    // Calculate the control point (Cp) by offsetting the midpoint (M) along the normal vector
    const cpX = mx + nx * offset;
    const cpY = my + ny * offset;

    // Create the Quadratic Bezier path string (Q)
    const path = `M${sourceX},${sourceY} Q${cpX},${cpY} ${targetX},${targetY}`;

    // Calculate the exact center point (t=0.5) of the Bezier curve for label placement
    const centerX = 0.25 * sourceX + 0.5 * cpX + 0.25 * targetX;
    const centerY = 0.25 * sourceY + 0.5 * cpY + 0.25 * targetY;

    return { path, centerX, centerY };
}


const BidirectionalCurvedEdge: React.FC<EdgeProps<BidirectionalEdgeData>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    data,
    style = {},
    markerEnd, 
    markerStart, 
}) => {
    
    const offset = 25; 
    
    // Path 1: S -> T. Use negative offset for separation.
    const { path: path1, centerX: center1X, centerY: center1Y } = getOffsetBezierPath(
        sourceX, sourceY, targetX, targetY, -offset
    );

    // Path 2: T -> S. By swapping target/source, the same negative offset pushes it parallel.
    const { path: path2, centerX: center2X, centerY: center2Y } = getOffsetBezierPath(
        targetX, targetY, sourceX, sourceY, -offset 
    );
    
    const [label1, label2] = data?.labels || ['', ''];

    return (
        <>
            {/* Path 1: Renders the S -> T direction. Uses markerEnd for the arrow at the target. */}
            <BaseEdge 
                id={`${id}-1`} 
                path={path1} 
                style={style} 
                markerEnd={markerEnd} 
            />
            
            {/* Path 2: Renders the T -> S direction. Uses markerStart for the arrow at the original source. */}
            <BaseEdge 
                id={`${id}-2`} 
                path={path2} 
                style={style} 
                markerEnd={markerStart} 
            />
            
            <EdgeLabelRenderer>
                {/* Label 1 (S -> T) positioned at center1 */}
                {label1 && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${center1X}px, ${center1Y}px)`,
                            pointerEvents: 'all',
                            fontSize: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            padding: '2px 4px',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            zIndex: 10,
                        }}
                        className="nodrag nopan"
                    >
                        {label1}
                    </div>
                )}

                {/* Label 2 (T -> S) positioned at center2 */}
                {label2 && (
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${center2X}px, ${center2Y}px)`,
                            pointerEvents: 'all',
                            fontSize: 10,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            padding: '2px 4px',
                            borderRadius: 4,
                            border: '1px solid #ccc',
                            zIndex: 10,
                        }}
                        className="nodrag nopan"
                    >
                        {label2}
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
};

export default BidirectionalCurvedEdge;
