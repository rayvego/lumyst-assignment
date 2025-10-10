import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		const reactFlowNodes = [
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label, type: node.type, code: node.code },
				type: 'graphNode',
			})),
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label, categoryData: { c1Category: node.c1Category, nodesInCategory: node.nodesInCategory } },
				type: 'c1CategoryNode',
			})),
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label, categoryData: { c2Name: node.c2Name, nodeCount: node.nodeCount } },
				type: 'c2SubcategoryNode',
			}))
		];

		const reactFlowEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			style: edge.data?.isCycle
				? { stroke: '#ef4444', strokeDasharray: '5,5', strokeWidth: 2 }
				: edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 }
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 }
				: { stroke: '#374151', strokeWidth: 1 },
			labelStyle: { fill: '#000', fontWeight: '500' },
		}));

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}