import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import { BidirectionalEdgeService } from './bidirectional-edge.service';

export class ReactFlowService {
	private bidirectionalEdgeService: BidirectionalEdgeService;

	constructor() {
		this.bidirectionalEdgeService = new BidirectionalEdgeService();
	}

	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		const reactFlowNodes = [
			// Regular graph nodes (leaf nodes)
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
					border: '2px solid #3b82f6',
					color: '#1e40af',
					borderRadius: '8px',
					padding: '10px 16px',
					fontSize: '12px',
					fontWeight: '500',
					minWidth: '140px',
					textAlign: 'center' as const,
					boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
				},
			})),
			// C1 category nodes (top-level categories)
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
					border: '3px solid #dc2626',
					color: '#991b1b',
					fontWeight: 'bold',
					borderRadius: '12px',
					padding: '14px 20px',
					fontSize: '14px',
					minWidth: '180px',
					textAlign: 'center' as const,
					boxShadow: '0 4px 8px rgba(220, 38, 38, 0.2)',
				},
			})),
			// C2 subcategory nodes (middle layer)
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
					border: '2px solid #10b981',
					color: '#065f46',
					borderRadius: '8px',
					padding: '10px 16px',
					fontSize: '12px',
					fontWeight: '600',
					minWidth: '160px',
					textAlign: 'center' as const,
					boxShadow: '0 2px 4px rgba(16, 185, 129, 0.15)',
				},
			}))
		];

		// Create base edges with enhanced styling
		const baseEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			type: 'enhanced', // Use enhanced edge type
			animated: !edge.label?.includes('contains'), // Animate non-containment edges
			style: edge.label === 'contains'
				? { stroke: '#d1d5db', strokeDasharray: '5,5', strokeWidth: 1.5 } // Dashed light gray for containment
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#10b981', strokeWidth: 2.5 } // Emerald for C2-C2 relationships
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#f59e0b', strokeWidth: 2.5 } // Amber for cross C1-C2 relationships
				: { stroke: '#6366f1', strokeWidth: 2 }, // Indigo for leaf node relationships
			labelStyle: { fill: '#374151', fontWeight: '500', fontSize: 11 },
			data: {}, // Will be populated by bidirectional edge service
		}));

		// Apply bidirectional edge handling
		const processedEdges = this.bidirectionalEdgeService.processBidirectionalEdges(
			edges,
			baseEdges
		);

		return {
			nodes: reactFlowNodes,
			edges: processedEdges,
		};
	}
}
