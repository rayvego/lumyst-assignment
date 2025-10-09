import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";

export function BidirectionalEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	label,
	style,
	markerEnd,
	data,
	source,
	target,
}: EdgeProps) {
	// Extract bidirectional data
	const isBidirectional = data?.isBidirectional || false;
	const isReverse = data?.isReverse || false;
	
	// Calculate dynamic curvature based on edge length and bidirectional status
	let curvature = 0.25; // Default curvature for normal edges
	
	if (isBidirectional) {
		// Calculate distance between nodes to adjust curvature
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		// Adjust curvature based on distance - closer nodes need more curve
		const baseCurvature = Math.min(0.6, Math.max(0.3, 200 / distance));
		
		// Apply opposite curvature for bidirectional edges
		curvature = isReverse ? -baseCurvature : baseCurvature;
	}

	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		curvature,
	});

	// Calculate label position with better spacing for bidirectional edges
	let labelOffsetX = 0;
	let labelOffsetY = 0;

	if (isBidirectional && label) {
		// Calculate the midpoint and direction of the edge
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		// Normalize the direction vector
		const normX = dx / distance;
		const normY = dy / distance;
		
		// Calculate perpendicular vector for label offset
		const perpX = -normY;
		const perpY = normX;
		
		// Offset distance based on curve direction and edge length
		const baseOffset = Math.min(40, Math.max(20, distance * 0.1));
		const offsetDistance = isReverse ? -baseOffset : baseOffset;
		
		labelOffsetX = perpX * offsetDistance;
		labelOffsetY = perpY * offsetDistance;
		
		// Additional adjustment for very curved edges
		if (Math.abs(curvature) > 0.4) {
			const extraOffset = Math.abs(curvature) * 20;
			labelOffsetX += perpX * (isReverse ? -extraOffset : extraOffset);
			labelOffsetY += perpY * (isReverse ? -extraOffset : extraOffset);
		}
	}

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
			{label && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: "absolute",
							transform: `translate(-50%, -50%) translate(${labelX + labelOffsetX}px,${
								labelY + labelOffsetY
							}px)`,
							background: "rgba(255, 255, 255, 0.95)",
							padding: isBidirectional ? "3px 6px" : "4px 8px",
							borderRadius: "4px",
							fontSize: isBidirectional ? "10px" : "11px",
							fontWeight: 500,
							border: "1px solid #e5e7eb",
							pointerEvents: "all",
							boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
							zIndex: 1000,
							maxWidth: "120px",
							textAlign: "center",
							lineHeight: 1.2,
							whiteSpace: "nowrap",
							overflow: "hidden",
							textOverflow: "ellipsis",
						}}
						className="nodrag nopan"
						title={typeof label === 'string' ? label : undefined} // Add tooltip for truncated labels
					>
						{label}
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
}
