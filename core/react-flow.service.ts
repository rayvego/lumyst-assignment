import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		// De-duplicate nodes by id across all categories
		const nodeById = new Map<string, { id: string; position: { x: number; y: number }; data: { label: string }; type: 'default'; style: Record<string, string> }>();
		const pushUnique = (n: { id: string; position?: { x: number; y: number }; data: { label: string }; type: 'default'; style: Record<string, string> }) => {
			if (!nodeById.has(n.id)) {
				nodeById.set(n.id, { ...n, position: n.position || { x: 0, y: 0 } });
			}
		};

		// Regular graph nodes
		graphNodes.forEach((node) => pushUnique({
			id: node.id,
			position: node.position,
			data: { label: node.label },
			type: 'default',
			style: {
				background: '#dbeafe',
				border: '2px solid #3b82f6',
				color: '#1e40af',
				borderRadius: '6px'
			},
		}));
		// C1 category nodes
		c1Nodes.forEach((node) => pushUnique({
			id: node.id,
			position: node.position,
			data: { label: node.label },
			type: 'default',
			style: {
				background: '#fef2f2',
				border: '3px solid #dc2626',
				color: '#991b1b',
				fontWeight: 'bold',
				borderRadius: '6px'
			},
		}));
		// C2 subcategory nodes
		c2Nodes.forEach((node) => pushUnique({
			id: node.id,
			position: node.position,
			data: { label: node.label },
			type: 'default',
			style: {
				background: '#f0fdf4',
				border: '2px solid #16a34a',
				color: '#166534',
				borderRadius: '6px'
			},
		}));

		const reactFlowNodes = Array.from(nodeById.values());

		// Build a lookup to detect reciprocal edges (A->B and B->A)
		const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
		const pairCounts = new Map<string, number>();
		edges.forEach((e) => {
			const key = pairKey(e.source, e.target);
			pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
		});

		const reactFlowEdges = edges.map((edge) => {
	const key = pairKey(edge.source, edge.target);
	const hasReciprocal = (pairCounts.get(key) ?? 0) > 1;
	const offsetSign = hasReciprocal ? (edge.source < edge.target ? 1 : -1) : 0;
	const labelYOffset = hasReciprocal ? 18 * offsetSign : 0;
	const labelXOffset = hasReciprocal ? 12 * offsetSign : 0;
		const labelBorder =
    edge.label === 'contains'
      ? { stroke: '#9ca3af', strokeWidth: 1 }
      : edge.id.startsWith('c2_relationship')
      ? { stroke: '#059669', strokeWidth: 1.5 }
      : edge.id.startsWith('cross_c1_c2_rel')
      ? { stroke: '#d97706', strokeWidth: 1.5 }
      : { stroke: '#6b7280', strokeWidth: 1 };
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label,
		style:
			edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 }
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 }
				: { stroke: '#374151', strokeWidth: 1 },

		labelStyle: {
			fill: '#000',
			fontWeight: '500',
			pointerEvents: 'none',
			transform: `translate(${labelXOffset}px, ${labelYOffset}px)`
		},

		labelShowBg: true,
		labelBgPadding: [6, 4] as [number, number],
		labelBgBorderRadius: 4,
		labelBgStyle: {
			fill: '#ffffff',
			transform: `translate(${labelXOffset}px, ${labelYOffset}px)` ,
			...labelBorder,    // <-- sync bg offset
		}
	};
});


		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
