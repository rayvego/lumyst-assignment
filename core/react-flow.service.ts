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

		// Detect bidirectional edges - improved logic
		const edgeMap = new Map<string, GraphEdge[]>();
		const bidirectionalPairs = new Set<string>();
		
		// First pass: group edges by node pairs
		edges.forEach((edge) => {
			const key = `${edge.source}-${edge.target}`;
			if (!edgeMap.has(key)) {
				edgeMap.set(key, []);
			}
			edgeMap.get(key)!.push(edge);
		});
		
		// Second pass: detect bidirectional relationships
		edges.forEach((edge) => {
			const forwardKey = `${edge.source}-${edge.target}`;
			const reverseKey = `${edge.target}-${edge.source}`;
			
			// Check if there are edges in both directions
			if (edgeMap.has(forwardKey) && edgeMap.has(reverseKey)) {
				const pairKey = [edge.source, edge.target].sort().join('-');
				bidirectionalPairs.add(pairKey);
			}
		});

		const reactFlowEdges = edges.map((edge, index) => {
			const pairKey = [edge.source, edge.target].sort().join('-');
			const isBidirectional = bidirectionalPairs.has(pairKey);
			
			// For bidirectional edges, determine curve direction based on lexicographic order
			const isReverse = isBidirectional && edge.source > edge.target;
			
			// Add edge index for unique identification
			const edgeIndex = index;
			
			return {
				id: `${edge.id}-${edgeIndex}`,
				source: edge.source,
				target: edge.target,
				label: edge.label,
				type: isBidirectional ? 'bidirectional' : 'default',
				style: edge.label === 'contains'
					? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 } // Dashed light gray for containment
					: edge.id.startsWith('c2_relationship')
					? { stroke: '#059669', strokeWidth: 2 } // Dark green for C2-C2 relationships
					: edge.id.startsWith('cross_c1_c2_rel')
					? { stroke: '#d97706', strokeWidth: 2 } // Dark orange for cross C1-C2 relationships
					: { stroke: '#374151', strokeWidth: 1 }, // Dark gray for other edges
				labelStyle: { fill: '#000', fontWeight: '500' },
				animated: false,
				data: {
					isBidirectional,
					isReverse,
					edgeIndex,
					originalId: edge.id,
					source: edge.source,
					target: edge.target,
				},
			};
		});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}

	updateEdgeCurvatures(edges: any[], nodes: any[]) {
		// Create a map of node positions for quick lookup
		const nodePositions = new Map();
		nodes.forEach(node => {
			nodePositions.set(node.id, node.position);
		});

		// Group edges by node pairs to detect bidirectional relationships
		const edgeGroups = new Map<string, any[]>();
		edges.forEach(edge => {
			const pairKey = [edge.source, edge.target].sort().join('-');
			if (!edgeGroups.has(pairKey)) {
				edgeGroups.set(pairKey, []);
			}
			edgeGroups.get(pairKey)!.push(edge);
		});

		// Update edge data with fresh curvature calculations
		return edges.map(edge => {
			const pairKey = [edge.source, edge.target].sort().join('-');
			const groupEdges = edgeGroups.get(pairKey) || [];
			const isBidirectional = groupEdges.length > 1;
			
			// Calculate if this is the reverse edge
			const isReverse = isBidirectional && edge.source > edge.target;
			
			return {
				...edge,
				data: {
					...edge.data,
					isBidirectional,
					isReverse,
					// Force re-render by updating a timestamp
					lastUpdate: Date.now(),
				}
			};
		});
	}
}
