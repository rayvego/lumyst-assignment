import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { useMemo } from 'react';

export function BidirectionalEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
	style,
	markerEnd,
}: EdgeProps) {
	const forwardLabel = (data as any)?.forwardLabel || '';
	const backwardLabel = (data as any)?.backwardLabel || '';

	// Calculate offset for parallel curves
	const offset = 20; // Distance between the two curves

	// Calculate the paths with curvature offset
	const { forwardPath, backwardPath, forwardLabelX, forwardLabelY, backwardLabelX, backwardLabelY } = useMemo(() => {
		// Calculate perpendicular offset vector for the control points
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const length = Math.sqrt(dx * dx + dy * dy);
		
		if (length === 0) {
			const [path, labelX, labelY] = getBezierPath({
				sourceX,
				sourceY,
				sourcePosition,
				targetX,
				targetY,
				targetPosition,
			});
			return {
				forwardPath: path,
				backwardPath: path,
				forwardLabelX: labelX,
				forwardLabelY: labelY,
				backwardLabelX: labelX,
				backwardLabelY: labelY + 20,
			};
		}
		
		// Perpendicular vector (rotate 90 degrees)
		const perpX = -dy / length;
		const perpY = dx / length;
		
		const offsetX = perpX * offset;
		const offsetY = perpY * offset;

		// Calculate midpoint for control point offset
		const midX = (sourceX + targetX) / 2;
		const midY = (sourceY + targetY) / 2;

		// Forward path: curves above the direct line
		const forwardControlX = midX + offsetX;
		const forwardControlY = midY + offsetY;
		
		// Backward path: curves below the direct line
		const backwardControlX = midX - offsetX;
		const backwardControlY = midY - offsetY;

		// Create custom SVG paths that start and end at nodes but curve offset
		const forwardPath = `M ${sourceX},${sourceY} Q ${forwardControlX},${forwardControlY} ${targetX},${targetY}`;
		const backwardPath = `M ${targetX},${targetY} Q ${backwardControlX},${backwardControlY} ${sourceX},${sourceY}`;

		return {
			forwardPath,
			backwardPath,
			forwardLabelX: forwardControlX,
			forwardLabelY: forwardControlY,
			backwardLabelX: backwardControlX,
			backwardLabelY: backwardControlY,
		};
	}, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, offset]);

	return (
		<>
			{/* Forward edge path */}
			<BaseEdge
				id={`${id}-forward`}
				path={forwardPath}
				style={style}
				markerEnd={markerEnd}
			/>
			
			{/* Backward edge path */}
			<BaseEdge
				id={`${id}-backward`}
				path={backwardPath}
				style={style}
				markerEnd={markerEnd}
			/>

			{/* Edge labels */}
			<EdgeLabelRenderer>
				{/* Forward label */}
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${forwardLabelX}px, ${forwardLabelY}px)`,
						pointerEvents: 'all',
						fontSize: 12,
						fontWeight: 500,
					}}
					className="nodrag nopan"
				>
					<div
						style={{
							background: 'white',
							padding: '4px 8px',
							borderRadius: '4px',
							border: '1px solid #e5e7eb',
							boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
							maxWidth: '200px',
							textAlign: 'center',
						}}
					>
						{forwardLabel}
					</div>
				</div>

				{/* Backward label */}
				<div
					style={{
						position: 'absolute',
						transform: `translate(-50%, -50%) translate(${backwardLabelX}px, ${backwardLabelY}px)`,
						pointerEvents: 'all',
						fontSize: 12,
						fontWeight: 500,
					}}
					className="nodrag nopan"
				>
					<div
						style={{
							background: 'white',
							padding: '4px 8px',
							borderRadius: '4px',
							border: '1px solid #e5e7eb',
							boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
							maxWidth: '200px',
							textAlign: 'center',
						}}
					>
						{backwardLabel}
					</div>
				</div>
			</EdgeLabelRenderer>
		</>
	);
}
