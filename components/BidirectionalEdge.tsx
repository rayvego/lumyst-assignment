import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

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
	const forwardLabel = data?.forwardLabel || '';
	const backwardLabel = data?.backwardLabel || '';

	const OFFSET = 25; // for spacing between curves

	const getOffset = (multiplier: number) => {
		const dx = targetX - sourceX;
		const dy = targetY - sourceY;
		const len = Math.sqrt(dx * dx + dy * dy) || 1; // Avoid division by zero
		return {
			x: (-dy / len) * OFFSET * multiplier,
			y: (dx / len) * OFFSET * multiplier
		};
	};

	const forwardOffset = getOffset(1);
	const backwardOffset = getOffset(-1);

	// Forward path (A → B, curved up)
	const [forwardPath, forwardLabelX, forwardLabelY] = getBezierPath({
		sourceX: sourceX + forwardOffset.x,
		sourceY: sourceY + forwardOffset.y,
		sourcePosition,
		targetX: targetX + forwardOffset.x,
		targetY: targetY + forwardOffset.y,
		targetPosition,
	});

	// Backward path (B → A, curved down)
	const [backwardPath, backwardLabelX, backwardLabelY] = getBezierPath({
		sourceX: targetX + backwardOffset.x,
		sourceY: targetY + backwardOffset.y,
		sourcePosition: targetPosition,
		targetX: sourceX + backwardOffset.x,
		targetY: sourceY + backwardOffset.y,
		targetPosition: sourcePosition,
	});

	const Label = ({ x, y, text }: { x: number; y: number; text: string }) => (
		<div
			style={{
				position: 'absolute',
				transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
				background: 'white',
				padding: '4px 8px',
				borderRadius: '4px',
				border: '1px solid #e5e7eb',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				fontSize: 12,
				fontWeight: 500,
				maxWidth: '200px',
				textAlign: 'center',
				pointerEvents: 'all',
			}}
			className="nodrag nopan"
		>
			{text}
		</div>
	);

	return (
		<>
			<BaseEdge id={`${id}-forward`} path={forwardPath} style={style} markerEnd={markerEnd} />
			<BaseEdge id={`${id}-backward`} path={backwardPath} style={style} markerEnd={markerEnd} />
			
			<EdgeLabelRenderer>
				<Label x={forwardLabelX} y={forwardLabelY} text={forwardLabel as string} />
				<Label x={backwardLabelX} y={backwardLabelY} text={backwardLabel as string} />
			</EdgeLabelRenderer>
		</>
	);
}