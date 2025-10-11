import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import { BidirectionalEdgeService, type BidirectionalEdge, type CursorPosition } from './bidirectional-edge.service';

export class ReactFlowService {
	private bidirectionalEdgeService = new BidirectionalEdgeService();

	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[],
		cursorPosition?: CursorPosition
	) {
		const reactFlowNodes = [
			// Regular graph nodes
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#dbeafe',
					border: '2px solid #3b82f6',
					color: '#1e40af',
					borderRadius: '6px'
				},
			})),
			// C1 category nodes
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#fef2f2',
					border: '3px solid #dc2626',
					color: '#991b1b',
					fontWeight: 'bold',
					borderRadius: '6px'
				},
			})),
			// C2 subcategory nodes
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#f0fdf4',
					border: '2px solid #16a34a',
					color: '#166534',
					borderRadius: '6px'
				},
			}))
		];

		// Process edges with bidirectional logic
		const allNodes = [...graphNodes, ...c1Nodes, ...c2Nodes];
		let processedEdges = this.bidirectionalEdgeService.applyLabelOffsets(edges, allNodes);

		// Apply cursor-based highlighting if cursor position is provided
		if (cursorPosition) {
			processedEdges = this.bidirectionalEdgeService.highlightLabelsOnCursor(
				processedEdges,
				cursorPosition,
				allNodes
			);
		}

		const reactFlowEdges = processedEdges.map((edge) => {
			// Calculate label position for curved edges
			const labelPosition = this.bidirectionalEdgeService.calculateCurvedLabelPosition(
				edge,
				allNodes,
				0.5
			);

			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				label: edge.label,
				labelStyle: { 
					fill: edge.highlightOnHover ? '#ef4444' : '#000', // Red highlight on hover
					fontWeight: edge.highlightOnHover ? 'bold' : '500',
					fontSize: edge.highlightOnHover ? '14px' : '12px'
				},
				labelBgStyle: edge.highlightOnHover ? {
					fill: '#fef2f2',
					fillOpacity: 0.8
				} : {
					fill: '#ffffff',
					fillOpacity: 0.7
				},
				labelBgPadding: [4, 8],
				labelBgBorderRadius: 4,
				style: edge.label === 'contains'
					? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 } // Dashed light gray for containment
					: edge.id.startsWith('c2_relationship')
					? { stroke: '#059669', strokeWidth: 2 } // Dark green for C2-C2 relationships
					: edge.id.startsWith('cross_c1_c2_rel')
					? { stroke: '#d97706', strokeWidth: 2 } // Dark orange for cross C1-C2 relationships
					: { stroke: '#374151', strokeWidth: 1 }, // Dark gray for other edges
				// Custom properties for bidirectional edges
				type: edge.isBidirectional ? 'enhancedBidirectional' : 'default',
				data: {
					isBidirectional: edge.isBidirectional,
					labelOffset: edge.labelOffset,
					labelPosition: edge.labelPosition,
					highlightOnHover: edge.highlightOnHover
				}
			};
		});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
