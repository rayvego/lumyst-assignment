import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
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

				const reactFlowEdges = edges.map((edge) => {
				const reverseEdge = edges.find(
					(e) => e.source === edge.target && e.target === edge.source
				);

				const isBidirectional = !!reverseEdge;

				return {
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					type: isBidirectional ? "bidirectional" : "default",
					style: {
					stroke: isBidirectional ? "#2563eb" : "#374151",
					strokeWidth: isBidirectional ? 2 : 1.5,
					},
					labelStyle: { fill: "#000", fontWeight: "500" },
				};
				});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
