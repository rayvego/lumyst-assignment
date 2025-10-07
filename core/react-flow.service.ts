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

		// Process edges to detect and merge bidirectional pairs
		const processedEdges = this.mergeBidirectionalEdges(edges);

		return {
			nodes: reactFlowNodes,
			edges: processedEdges,
		};
	}

	private mergeBidirectionalEdges(edges: GraphEdge[]) {
		const processedEdges: any[] = [];
		const handledEdges = new Set<string>();
		const seenBidirectionalPairs = new Set<string>(); // Track bidirectional pairs

		edges.forEach((edge) => {
			// Skip if already processed as part of a bidirectional pair
			if (handledEdges.has(edge.id)) return;

			// Check if this is a self-loop (source === target)
			const isSelfLoop = edge.source === edge.target;

			if (isSelfLoop) {
				// Self-loop: treat as regular unidirectional edge
				processedEdges.push({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					style: this.getEdgeStyle(edge),
					labelStyle: { fill: '#000', fontWeight: '500' },
				});
				handledEdges.add(edge.id);
				return;
			}

			// Look for reverse edge (only for non-self-loops)
			const reverseEdge = edges.find(
				e => e.source === edge.target && 
				     e.target === edge.source && 
				     e.id !== edge.id &&
				     !handledEdges.has(e.id) // Make sure it hasn't been processed
			);

			if (reverseEdge) {
				// Create consistent ID by sorting source and target alphabetically
				const sortedNodes = [edge.source, edge.target].sort();
				const pairKey = `${sortedNodes[0]}-${sortedNodes[1]}`;
				
				// Check if we've already created a bidirectional edge for this pair
				if (seenBidirectionalPairs.has(pairKey)) {
					// Skip this duplicate pair
					handledEdges.add(edge.id);
					handledEdges.add(reverseEdge.id);
					return;
				}
				
				const uniqueId = `bidirectional-${pairKey}`;
				seenBidirectionalPairs.add(pairKey);
				
				// Determine which edge is "forward" based on sorted order
				const isForward = edge.source === sortedNodes[0];
				
				// Found bidirectional pair - merge them into a single bidirectional edge
				processedEdges.push({
					id: uniqueId,
					source: edge.source,
					target: edge.target,
					type: 'bidirectional-curved', // Use custom edge type
					data: {
						forwardLabel: isForward ? edge.label : reverseEdge.label,
						backwardLabel: isForward ? reverseEdge.label : edge.label,
						source: edge.source,
						target: edge.target,
					},
					style: this.getEdgeStyle(edge),
				});

				// Mark both edges as handled
				handledEdges.add(edge.id);
				handledEdges.add(reverseEdge.id);
			} else {
				// Regular unidirectional edge - keep as is
				processedEdges.push({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					style: this.getEdgeStyle(edge),
					labelStyle: { fill: '#000', fontWeight: '500' },
				});
				handledEdges.add(edge.id);
			}
		});

		return processedEdges;
	}

	private getEdgeStyle(edge: GraphEdge) {
		if (edge.label === 'contains') {
			return { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 };
		}
		if (edge.id.startsWith('c2_relationship')) {
			return { stroke: '#059669', strokeWidth: 2 };
		}
		if (edge.id.startsWith('cross_c1_c2_rel')) {
			return { stroke: '#d97706', strokeWidth: 2 };
		}
		return { stroke: '#374151', strokeWidth: 1 };
	}
}