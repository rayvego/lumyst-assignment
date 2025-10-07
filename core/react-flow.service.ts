import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import type { Edge } from '@xyflow/react';

export class ReactFlowService {
	
	// Helper function to detect bidirectional edges
	private detectBidirectionalEdges(edges: GraphEdge[]): Map<string, { forward: GraphEdge, backward: GraphEdge }> {
		const bidirectionalMap = new Map<string, { forward: GraphEdge, backward: GraphEdge }>();
		const edgeMap = new Map<string, GraphEdge>();
		
		// Create a map of edges by source-target pair
		edges.forEach(edge => {
			const key = `${edge.source}-${edge.target}`;
			edgeMap.set(key, edge);
		});
		
		// Find bidirectional pairs
		edges.forEach(edge => {
			const forwardKey = `${edge.source}-${edge.target}`;
			const backwardKey = `${edge.target}-${edge.source}`;
			const backwardEdge = edgeMap.get(backwardKey);
			
			if (backwardEdge && !bidirectionalMap.has(backwardKey)) {
				// Ensure we use a consistent key for the pair (alphabetically sorted)
				const pairKey = edge.source < edge.target ? forwardKey : backwardKey;
				bidirectionalMap.set(pairKey, {
					forward: edge.source < edge.target ? edge : backwardEdge,
					backward: edge.source < edge.target ? backwardEdge : edge,
				});
			}
		});
		
		return bidirectionalMap;
	}

	// Helper function to get edge styles based on edge type
	private getEdgeStyle(edge: GraphEdge) {
		if (edge.label === 'contains') {
			return { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }; // Dashed light gray for containment
		} else if (edge.id.startsWith('c2_relationship')) {
			return { stroke: '#059669', strokeWidth: 2 }; // Dark green for C2-C2 relationships
		} else if (edge.id.startsWith('cross_c1_c2_rel')) {
			return { stroke: '#d97706', strokeWidth: 2 }; // Dark orange for cross C1-C2 relationships
		} else {
			return { stroke: '#374151', strokeWidth: 1 }; // Dark gray for other edges
		}
	}
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		// Detect bidirectional edges
		const bidirectionalEdges = this.detectBidirectionalEdges(edges);
		const processedEdgeIds = new Set<string>();
		
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

		const reactFlowEdges: Edge[] = [];

		// Process bidirectional edges first
		bidirectionalEdges.forEach(({ forward, backward }, pairKey) => {
			if(forward.id === backward.id) return; // Skip self-loop edges
			processedEdgeIds.add(forward.id);
			processedEdgeIds.add(backward.id);
			
			// Create a single bidirectional edge
			reactFlowEdges.push({
				id: `bidirectional_${forward.source}_${forward.target}`,
				source: forward.source,
				target: forward.target,
				type: 'bidirectional',
				data: {
					isBidirectional: true,
					forwardLabel: forward.label,
					backwardLabel: backward.label,
				},
				style: this.getEdgeStyle(forward),
				labelStyle: { fill: '#000', fontWeight: '500' },
			});
		});

		// Process remaining non-bidirectional edges
		edges.forEach((edge) => {
			if (!processedEdgeIds.has(edge.id)) {
				reactFlowEdges.push({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					style: this.getEdgeStyle(edge),
					labelStyle: { fill: '#000', fontWeight: '500' },
				});
			}
		});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
