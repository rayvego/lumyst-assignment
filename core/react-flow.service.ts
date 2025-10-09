import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import { processBidirectionalEdges } from '../components/bidirectional-edge';

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
				data: { 
					label: node.label,
					type: 'graphNode',
					syntaxType: 'element',
				},
				type: 'graphNode',
			})),
			// C1 category nodes
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { 
					label: node.label,
					type: 'c1Category',
					categoryData: {
						c1Category: node.c1Category,
						nodesInCategory: node.nodesInCategory,
					}
				},
				type: 'c1CategoryNode',
			})),
			// C2 subcategory nodes
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { 
					label: node.label,
					type: 'c2Subcategory',
					categoryData: {
						c2Name: node.c2Name,
						nodeCount: node.nodeCount,
						description: node.description,
					}
				},
				type: 'c2SubcategoryNode',
			}))
		];

		const reactFlowEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			style: edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 } // Dashed light gray for containment
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 } // Dark green for C2-C2 relationships
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 } // Dark orange for cross C1-C2 relationships
				: { stroke: '#374151', strokeWidth: 1 }, // Dark gray for other edges
			labelStyle: { fill: '#000', fontWeight: '500' },
		}));

		// Process edges for bidirectional visualization
		const processedEdges = processBidirectionalEdges(reactFlowEdges);

		return {
			nodes: reactFlowNodes,
			edges: processedEdges,
		};
	}
}
