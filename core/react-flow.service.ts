import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		const reactFlowNodes = [
			// Regular graph nodes - smaller, cleaner
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#dbeafe',
					border: '2px solid #3b82f6',
					color: '#1e40af',
					borderRadius: '8px',
					padding: '6px 10px',
					fontSize: '11px',
					width: '140px',
					height: '35px'
				},
			})),
			// C1 category nodes - larger, more prominent
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
					borderRadius: '12px',
					padding: '12px 16px',
					fontSize: '14px',
					width: '200px',
					height: '60px'
				},
			})),
			// C2 subcategory nodes - medium size
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#f0fdf4',
					border: '3px solid #16a34a',
					color: '#166534',
					fontWeight: '600',
					borderRadius: '10px',
					padding: '8px 12px',
					fontSize: '12px',
					width: '170px',
					height: '45px'
				},
			}))
		];

		const reactFlowEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label === 'contains' ? '' : edge.label, // Remove labels from containment edges
			style: edge.label === 'contains'
				? { stroke: '#e5e7eb', strokeDasharray: '3,3', strokeWidth: 0.5, opacity: 0.3 } // Very subtle containment edges
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2.5, opacity: 0.8 } // Prominent relationship edges
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2.5, opacity: 0.8 } // Prominent cross-category edges
				: { stroke: '#6b7280', strokeWidth: 1.5, opacity: 0.6 }, // Subtle other edges
			labelStyle: { fill: '#374151', fontWeight: '600', fontSize: '12px' },
		}));

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
