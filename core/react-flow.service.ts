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

		// Build a quick lookup to detect reverse-direction pairs
		const hasReverse = new Set<string>();
		for (const e of edges) {
			hasReverse.add(`${e.source}__${e.target}`);
		}

		const reactFlowEdges = edges.map((edge) => {
			const style = edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 }
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 }
				: { stroke: '#374151', strokeWidth: 1 };

			// Determine if this edge is part of a bidirectional pair (excluding containment edges)
			const isContainment = edge.label === 'contains';
			const reverseKey = `${edge.target}__${edge.source}`;
			const isBidirectional = !isContainment && hasReverse.has(reverseKey);

			if (isBidirectional) {
				// Assign opposite sides deterministically so the two edges never overlap
				const sign = edge.source < edge.target ? 1 : -1;
				return {
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: undefined, // label will be rendered by custom edge via data.label
					type: 'bidirectional',
					data: { label: edge.label, offset: sign },
					style,
					labelStyle: { fill: '#000', fontWeight: '500' },
				};
			}

			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				label: edge.label,
				style,
				labelStyle: { fill: '#000', fontWeight: '500' },
			};
		});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
