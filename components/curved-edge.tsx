import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';
import { memo } from 'react';

interface CustomEdgeData {
	pathOptions?: {
		curvature?: number;
	};
	isBidirectional?: boolean;
	isReverse?: boolean;
}

/**
 * Custom Curved Edge Component for Bidirectional Edges
 * Uses bezier curves with configurable curvature to handle bidirectional relationships
 */
const CurvedEdge = memo(({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	style = {},
	label,
	labelStyle = {},
	labelBgStyle = {},
	labelBgPadding = [8, 4],
	labelBgBorderRadius = 4,
	data,
}: EdgeProps) => {
	// Get curvature from data or use default
	// Default curvature is now 0.1 for slight curves on all edges
	const edgeData = data as CustomEdgeData | undefined;
	const curvature = edgeData?.pathOptions?.curvature ?? 0.1;
	
	// Calculate bezier path with custom curvature
	const [edgePath, labelX, labelY] = getBezierPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		curvature,
	});

	// Apply label offset transformations
	const labelTransform = labelStyle?.transform || '';

	// Enhanced styling for better visibility
	const enhancedLabelBgStyle = {
		fill: labelBgStyle?.fill || '#ffffff',
		fillOpacity: labelBgStyle?.fillOpacity || 0.95,
	};

	return (
		<>
			<BaseEdge id={id} path={edgePath} style={style} />
			{label && (
				<EdgeLabelRenderer>
					<div
						style={{
							position: 'absolute',
							transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px) ${labelTransform}`,
							pointerEvents: 'all',
							...labelStyle,
						}}
						className="nodrag nopan"
					>
						<div
							style={{
								background: enhancedLabelBgStyle.fill,
								opacity: enhancedLabelBgStyle.fillOpacity,
								padding: `${(labelBgPadding as number[])[1]}px ${(labelBgPadding as number[])[0]}px`,
								borderRadius: labelBgBorderRadius,
								fontSize: 12,
								fontWeight: 600,
								border: '1.5px solid #d1d5db',
								boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
								whiteSpace: 'nowrap',
								color: '#374151',
								letterSpacing: '0.01em',
							}}
						>
							{label}
						</div>
					</div>
				</EdgeLabelRenderer>
			)}
		</>
	);
});

CurvedEdge.displayName = 'CurvedEdge';

export default CurvedEdge;
