import ELK, { ElkNode, ElkExtendedEdge } from 'elkjs/lib/elk.bundled.js';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

const elk = new ELK();

// Node dimensions based on hierarchy level
const NODE_DIMENSIONS = {
	c1: { width: 300, height: 80 },
	c2: { width: 220, height: 60 },
	graphNode: { width: 220, height: 50 },
} as const;

// Spacing configuration for clean hierarchy
const SPACING_CONFIG = {
	'elk.algorithm': 'layered',
	'elk.direction': 'DOWN',
	'elk.spacing.nodeNode': '80',
	'elk.layered.spacing.nodeNodeBetweenLayers': '120',
	'elk.spacing.edgeNode': '50',
	'elk.spacing.edgeEdge': '30',
	'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
	'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF',
	'elk.edgeRouting': 'SPLINES',
	'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
	'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
	'elk.spacing.componentComponent': '100',
} as const;

interface LayoutInput {
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	c1Categories: C1Output[];
	c2Subcategories: C2Subcategory[];
}

interface LayoutOutput {
	graphNodes: (GraphNode & { position: { x: number; y: number } })[];
	c1Nodes: (C1Output & { position: { x: number; y: number }; bounds?: { width: number; height: number } })[];
	c2Nodes: (C2Subcategory & { position: { x: number; y: number }; bounds?: { width: number; height: number } })[];
	edges: GraphEdge[];
}

/**
 * ELK Layout Service
 * 
 * Architecture:
 * - Client-side computation (fast for <5k nodes)
 * - Clean interface that can be swapped for API calls later
 * - Flat graph structure for reliable layout
 */
export class ELKLayoutService {
	/**
	 * Main layout function - can be easily replaced with API call
	 */
	async computeLayout(input: LayoutInput): Promise<LayoutOutput> {
		const elkGraph = this.buildHierarchicalGraph(input);
		const layoutedGraph = await elk.layout(elkGraph);
		return this.flattenLayout(layoutedGraph, input);
	}

	/**
	 * Build flat ELK graph - all nodes at same level, no nesting
	 */
	private buildHierarchicalGraph(input: LayoutInput): ElkNode {
		const { c1Categories, c2Subcategories, graphNodes, graphEdges } = input;

		// Log graph construction
		console.log('Building ELK graph:', {
			c1Count: c1Categories.length,
			c2Count: c2Subcategories.length,
			nodeCount: graphNodes.length,
			edgeCount: graphEdges.length,
		});

		// Build FLAT structure - all nodes at root level
		const allNodes: ElkNode[] = [
			// C1 nodes
			...c1Categories.map((c1) => ({
				id: c1.id,
				width: NODE_DIMENSIONS.c1.width,
				height: NODE_DIMENSIONS.c1.height,
			})),
			// C2 nodes
			...c2Subcategories.map((c2) => ({
				id: c2.id,
				width: NODE_DIMENSIONS.c2.width,
				height: NODE_DIMENSIONS.c2.height,
			})),
			// Graph nodes
			...graphNodes.map((node) => ({
				id: node.id,
				width: NODE_DIMENSIONS.graphNode.width,
				height: NODE_DIMENSIONS.graphNode.height,
			})),
		];

		// Map edges
		const elkEdges: ElkExtendedEdge[] = graphEdges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		}));

		console.log(`Mapped ${elkEdges.length} edges, ${allNodes.length} total nodes`);

		return {
			id: 'root',
			layoutOptions: SPACING_CONFIG,
			children: allNodes, // FLAT structure
			edges: elkEdges,
		};
	}

	/**
	 * Extract positioned nodes from flat ELK layout
	 */
	private flattenLayout(layouted: ElkNode, input: LayoutInput): LayoutOutput {
		const { graphNodes, c1Categories, c2Subcategories, graphEdges } = input;

		// Extract positioned nodes from FLAT structure
		const positionedC1: (C1Output & { position: { x: number; y: number }; bounds?: { width: number; height: number } })[] = [];
		const positionedC2: (C2Subcategory & { position: { x: number; y: number }; bounds?: { width: number; height: number } })[] = [];
		const positionedNodes: (GraphNode & { position: { x: number; y: number } })[] = [];

		// Process all nodes at root level
		layouted.children?.forEach((nodeLayout) => {
			// Check if it's a C1 node
			const c1Data = c1Categories.find((c) => c.id === nodeLayout.id);
			if (c1Data) {
				positionedC1.push({
					...c1Data,
					position: { x: nodeLayout.x ?? 0, y: nodeLayout.y ?? 0 },
					bounds: {
						width: nodeLayout.width ?? NODE_DIMENSIONS.c1.width,
						height: nodeLayout.height ?? NODE_DIMENSIONS.c1.height,
					},
				});
				return;
			}

			// Check if it's a C2 node
			const c2Data = c2Subcategories.find((c) => c.id === nodeLayout.id);
			if (c2Data) {
				positionedC2.push({
					...c2Data,
					position: { x: nodeLayout.x ?? 0, y: nodeLayout.y ?? 0 },
					bounds: {
						width: nodeLayout.width ?? NODE_DIMENSIONS.c2.width,
						height: nodeLayout.height ?? NODE_DIMENSIONS.c2.height,
					},
				});
				return;
			}

			// Check if it's a graph node
			const nodeData = graphNodes.find((n) => n.id === nodeLayout.id);
			if (nodeData) {
				positionedNodes.push({
					...nodeData,
					position: { x: nodeLayout.x ?? 0, y: nodeLayout.y ?? 0 },
				});
				return;
			}
		});

		console.log(`Layout complete: ${positionedC1.length} C1, ${positionedC2.length} C2, ${positionedNodes.length} graph nodes`);

		return {
			graphNodes: positionedNodes,
			c1Nodes: positionedC1,
			c2Nodes: positionedC2,
			edges: graphEdges,
		};
	}
}

/**
 * Factory function for easy backend migration
 * 
 * Future: Replace this with API client
 * export async function computeLayout(input) {
 *   return fetch('/api/layout', { method: 'POST', body: JSON.stringify(input) })
 * }
 */
export async function computeLayout(input: LayoutInput): Promise<LayoutOutput> {
	const service = new ELKLayoutService();
	return service.computeLayout(input);
}

