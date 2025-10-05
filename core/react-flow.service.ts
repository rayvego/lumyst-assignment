import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

interface BidirectionalEdgePair {
	id: string;
	source: string;
	target: string;
	forwardLabel: string;
	backwardLabel: string;
	isBidirectional: true;
}

export class ReactFlowService {
	/**
	 * Detects bidirectional edge pairs (where both A→B and B→A exist)
	 * Returns a map of edge pairs and a set of edge IDs that are part of bidirectional relationships
	 */
	private detectBidirectionalEdges(edges: GraphEdge[]): {
		bidirectionalPairs: BidirectionalEdgePair[];
		processedEdgeIds: Set<string>;
	} {
		const edgeMap = new Map<string, GraphEdge>();
		const bidirectionalPairs: BidirectionalEdgePair[] = [];
		const processedEdgeIds = new Set<string>();

		// Create a map for quick lookup: "source-target" -> edge
		edges.forEach(edge => {
			const key = `${edge.source}-${edge.target}`;
			edgeMap.set(key, edge);
		});

		// Find bidirectional pairs
		edges.forEach(edge => {
			if (processedEdgeIds.has(edge.id)) return;

			const forwardKey = `${edge.source}-${edge.target}`;
			const backwardKey = `${edge.target}-${edge.source}`;
			const backwardEdge = edgeMap.get(backwardKey);

			if (backwardEdge && !processedEdgeIds.has(backwardEdge.id)) {
				// Found a bidirectional pair!
				bidirectionalPairs.push({
					id: `bidirectional-${edge.source}-${edge.target}`,
					source: edge.source,
					target: edge.target,
					forwardLabel: edge.label,
					backwardLabel: backwardEdge.label,
					isBidirectional: true,
				});

				// Mark both edges as processed
				processedEdgeIds.add(edge.id);
				processedEdgeIds.add(backwardEdge.id);
			}
		});

		return { bidirectionalPairs, processedEdgeIds };
	}

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

		// Detect bidirectional edges
		const { bidirectionalPairs, processedEdgeIds } = this.detectBidirectionalEdges(edges);

		// Create React Flow edges
		const reactFlowEdges = [
			// Add bidirectional edges with custom type
			...bidirectionalPairs.map((pair) => ({
				id: pair.id,
				source: pair.source,
				target: pair.target,
				type: 'bidirectional',
				data: {
					forwardLabel: pair.forwardLabel,
					backwardLabel: pair.backwardLabel,
				},
				style: pair.id.includes('c2_relationship')
					? { stroke: '#059669', strokeWidth: 2 }
					: pair.id.includes('cross_c1_c2')
					? { stroke: '#d97706', strokeWidth: 2 }
					: { stroke: '#374151', strokeWidth: 1.5 },
			})),
			// Add remaining unidirectional edges
			...edges
				.filter(edge => !processedEdgeIds.has(edge.id))
				.map((edge) => ({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					type: 'default',
					style: edge.label === 'contains'
						? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
						: edge.id.startsWith('c2_relationship')
						? { stroke: '#059669', strokeWidth: 2 }
						: edge.id.startsWith('cross_c1_c2_rel')
						? { stroke: '#d97706', strokeWidth: 2 }
						: { stroke: '#374151', strokeWidth: 1.5 },
					labelStyle: { fill: '#000', fontWeight: '500', fontSize: 12 },
					labelBgStyle: { fill: '#fff', fillOpacity: 0.8 },
					labelBgPadding: [4, 2] as [number, number],
					labelBgBorderRadius: 2,
				}))
		];

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
