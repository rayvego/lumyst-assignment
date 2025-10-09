import dagre from 'dagre';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

interface LayoutNode {
	id: string;
	label: string;
	type: 'graph' | 'c1' | 'c2';
	layer?: number;
	cluster?: string;
	position?: { x: number; y: number };
}

interface LayoutConfig {
	rankdir: 'TB' | 'LR' | 'BT' | 'RL';
	nodeWidth: number;
	nodeHeight: number;
	rankSep: number;
	nodeSep: number;
	edgeSep: number;
	marginX: number;
	marginY: number;
	clusterSpacing: number;
}

export class LayoutAlgorithmService {
	private defaultConfig: LayoutConfig = {
		rankdir: 'TB', // Top to Bottom
		nodeWidth: 180,
		nodeHeight: 60,
		rankSep: 150, // Vertical spacing between ranks
		nodeSep: 80, // Horizontal spacing between nodes
		edgeSep: 30, // Edge separation
		marginX: 100,
		marginY: 100,
		clusterSpacing: 200, // Extra spacing between C1 clusters
	};

	/**
	 * Advanced hierarchical layout algorithm optimized for large codebase graphs
	 * Features:
	 * - Hierarchical clustering by C1 categories
	 * - Layer-based positioning with proper rank assignment
	 * - Edge crossing minimization
	 * - Force-directed spacing adjustments
	 * - Clear visual separation between clusters
	 */
	layoutGraph(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: any[],
		crossC1C2Relationships: any[],
		config: Partial<LayoutConfig> = {}
	) {
		const layoutConfig = { ...this.defaultConfig, ...config };

		// Step 1: Build node hierarchy and clusters
		const nodeHierarchy = this.buildNodeHierarchy(
			graphNodes,
			c1Outputs,
			c2Subcategories
		);

		// Step 2: Create edges with proper relationships
		const allEdges = this.buildEdgeList(
			graphEdges,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		);

		// Step 3: Apply hierarchical layout with clustering
		const layoutResult = this.applyClusteredHierarchicalLayout(
			nodeHierarchy,
			allEdges,
			c1Outputs,
			layoutConfig
		);

		// Step 4: Apply force-directed adjustments for better spacing
		const adjustedLayout = this.applyForceDirectedAdjustments(
			layoutResult,
			allEdges,
			layoutConfig
		);

		// Step 5: Separate the positioned nodes back into their types
		return this.separateNodesByType(
			adjustedLayout,
			graphNodes,
			c1Outputs,
			c2Subcategories,
			allEdges
		);
	}

	/**
	 * Build a unified node hierarchy with type information
	 */
	private buildNodeHierarchy(
		graphNodes: GraphNode[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[]
	): LayoutNode[] {
		const nodes: LayoutNode[] = [];

		// Add C1 nodes (top level - layer 0)
		c1Outputs.forEach((c1, idx) => {
			nodes.push({
				id: c1.id,
				label: c1.label,
				type: 'c1',
				layer: 0,
				cluster: c1.id,
			});
		});

		// Add C2 nodes (middle level - layer 1)
		c2Subcategories.forEach((c2) => {
			nodes.push({
				id: c2.id,
				label: c2.label,
				type: 'c2',
				layer: 1,
				cluster: c2.c1CategoryId,
			});
		});

		// Add graph nodes (bottom level - layer 2)
		// Assign cluster based on which C2 they belong to
		const nodeToCluster = new Map<string, string>();
		c2Subcategories.forEach((c2) => {
			c2.nodeIds.forEach((nodeId) => {
				nodeToCluster.set(nodeId, c2.c1CategoryId);
			});
		});

		graphNodes.forEach((node) => {
			nodes.push({
				id: node.id,
				label: node.label,
				type: 'graph',
				layer: 2,
				cluster: nodeToCluster.get(node.id) || 'default',
			});
		});

		return nodes;
	}

	/**
	 * Build complete edge list with all relationships
	 */
	private buildEdgeList(
		graphEdges: GraphEdge[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: any[],
		crossC1C2Relationships: any[]
	): GraphEdge[] {
		const c2NameToIdMap = new Map();
		c2Subcategories.forEach((c2) => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});

		const allEdges: GraphEdge[] = [
			...graphEdges,
			// C1 to C2 containment edges
			...c2Subcategories.map((c2) => ({
				id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
				source: c2.c1CategoryId,
				target: c2.id,
				label: 'contains',
			})),
			// C2 to node containment edges
			...c2Subcategories.flatMap((c2) =>
				c2.nodeIds.map((nodeId) => ({
					id: `c2-${c2.id}-to-node-${nodeId}`,
					source: c2.id,
					target: nodeId,
					label: 'contains',
				}))
			),
			// C2 relationships
			...c2Relationships
				.map((rel) => {
					const sourceId = c2NameToIdMap.get(rel.fromC2);
					const targetId = c2NameToIdMap.get(rel.toC2);
					if (!sourceId || !targetId) return null;
					return {
						id: rel.id,
						source: sourceId,
						target: targetId,
						label: rel.label,
					};
				})
				.filter((edge): edge is GraphEdge => edge !== null),
			// Cross C1-C2 relationships
			...crossC1C2Relationships
				.map((rel) => {
					const sourceId = c2NameToIdMap.get(rel.fromC2);
					const targetId = c2NameToIdMap.get(rel.toC2);
					if (!sourceId || !targetId) return null;
					return {
						id: rel.id,
						source: sourceId,
						target: targetId,
						label: rel.label,
					};
				})
				.filter((edge): edge is GraphEdge => edge !== null),
		];

		return allEdges;
	}

	/**
	 * Apply hierarchical layout with cluster-based organization
	 */
	private applyClusteredHierarchicalLayout(
		nodes: LayoutNode[],
		edges: GraphEdge[],
		c1Outputs: C1Output[],
		config: LayoutConfig
	): LayoutNode[] {
		// Group nodes by cluster (C1 category)
		const clusterGroups = new Map<string, LayoutNode[]>();
		nodes.forEach((node) => {
			const cluster = node.cluster || 'default';
			if (!clusterGroups.has(cluster)) {
				clusterGroups.set(cluster, []);
			}
			clusterGroups.get(cluster)!.push(node);
		});

		// Layout each cluster separately using Dagre
		const positionedNodes: LayoutNode[] = [];
		let clusterXOffset = config.marginX;

		// Sort clusters by C1 order for consistent layout
		const sortedClusters = Array.from(clusterGroups.entries()).sort(
			(a, b) => {
				const orderA = c1Outputs.findIndex((c1) => c1.id === a[0]);
				const orderB = c1Outputs.findIndex((c1) => c1.id === b[0]);
				return orderA - orderB;
			}
		);

		sortedClusters.forEach(([clusterId, clusterNodes]) => {
			const dagreGraph = new dagre.graphlib.Graph();
			dagreGraph.setDefaultEdgeLabel(() => ({}));
			dagreGraph.setGraph({
				rankdir: config.rankdir,
				ranksep: config.rankSep,
				nodesep: config.nodeSep,
				edgesep: config.edgeSep,
				marginx: config.marginX,
				marginy: config.marginY,
			});

			// Add nodes to this cluster's graph
			clusterNodes.forEach((node) => {
				const height =
					node.type === 'c1'
						? config.nodeHeight * 1.2
						: node.type === 'c2'
						? config.nodeHeight * 1.1
						: config.nodeHeight;
				const width =
					node.type === 'c1'
						? config.nodeWidth * 1.2
						: node.type === 'c2'
						? config.nodeWidth * 1.1
						: config.nodeWidth;

				dagreGraph.setNode(node.id, {
					width,
					height,
					rank: node.layer,
				});
			});

			// Add edges within this cluster
			edges.forEach((edge) => {
				const sourceNode = clusterNodes.find((n) => n.id === edge.source);
				const targetNode = clusterNodes.find((n) => n.id === edge.target);
				if (sourceNode && targetNode) {
					dagreGraph.setEdge(edge.source, edge.target);
				}
			});

			// Run layout for this cluster
			dagre.layout(dagreGraph);

			// Calculate cluster width for next offset
			let maxX = 0;
			let minX = Infinity;

			// Apply positions with cluster offset
			clusterNodes.forEach((node) => {
				const dagreNode = dagreGraph.node(node.id);
				if (dagreNode) {
					const x = clusterXOffset + dagreNode.x - dagreNode.width / 2;
					const y = dagreNode.y - dagreNode.height / 2;

					positionedNodes.push({
						...node,
						position: { x, y },
					});

					maxX = Math.max(maxX, x + dagreNode.width);
					minX = Math.min(minX, x);
				}
			});

			// Update offset for next cluster
			clusterXOffset = maxX + config.clusterSpacing;
		});

		return positionedNodes;
	}

	/**
	 * Apply force-directed adjustments to reduce congestion
	 * This helps spread out nodes that are too close together
	 */
	private applyForceDirectedAdjustments(
		nodes: LayoutNode[],
		edges: GraphEdge[],
		config: LayoutConfig
	): LayoutNode[] {
		const adjustedNodes = [...nodes];
		const iterations = 50;
		const repulsionForce = 5000;
		const attractionForce = 0.01;
		const minDistance = config.nodeSep;

		// Build adjacency list for connected nodes
		const adjacencyList = new Map<string, Set<string>>();
		edges.forEach((edge) => {
			if (!adjacencyList.has(edge.source)) {
				adjacencyList.set(edge.source, new Set());
			}
			if (!adjacencyList.has(edge.target)) {
				adjacencyList.set(edge.target, new Set());
			}
			adjacencyList.get(edge.source)!.add(edge.target);
			adjacencyList.get(edge.target)!.add(edge.source);
		});

		// Apply force-directed algorithm
		for (let iter = 0; iter < iterations; iter++) {
			const forces = new Map<string, { x: number; y: number }>();

			// Initialize forces
			adjustedNodes.forEach((node) => {
				forces.set(node.id, { x: 0, y: 0 });
			});

			// Calculate repulsion forces between all node pairs
			for (let i = 0; i < adjustedNodes.length; i++) {
				for (let j = i + 1; j < adjustedNodes.length; j++) {
					const node1 = adjustedNodes[i];
					const node2 = adjustedNodes[j];

					if (!node1.position || !node2.position) continue;

					const dx = node2.position.x - node1.position.x;
					const dy = node2.position.y - node1.position.y;
					const distance = Math.sqrt(dx * dx + dy * dy) || 1;

					// Only apply repulsion if nodes are too close
					if (distance < minDistance * 2) {
						const force = repulsionForce / (distance * distance);
						const fx = (dx / distance) * force;
						const fy = (dy / distance) * force;

						const force1 = forces.get(node1.id)!;
						const force2 = forces.get(node2.id)!;

						force1.x -= fx;
						force1.y -= fy;
						force2.x += fx;
						force2.y += fy;
					}
				}
			}

			// Calculate attraction forces for connected nodes
			edges.forEach((edge) => {
				const sourceNode = adjustedNodes.find((n) => n.id === edge.source);
				const targetNode = adjustedNodes.find((n) => n.id === edge.target);

				if (
					!sourceNode?.position ||
					!targetNode?.position
				)
					return;

				const dx = targetNode.position.x - sourceNode.position.x;
				const dy = targetNode.position.y - sourceNode.position.y;
				const distance = Math.sqrt(dx * dx + dy * dy) || 1;

				const force = distance * attractionForce;
				const fx = (dx / distance) * force;
				const fy = (dy / distance) * force;

				const sourceForce = forces.get(edge.source)!;
				const targetForce = forces.get(edge.target)!;

				sourceForce.x += fx;
				sourceForce.y += fy;
				targetForce.x -= fx;
				targetForce.y -= fy;
			});

			// Apply forces with damping (only horizontal adjustments to maintain hierarchy)
			const damping = 0.1 * (1 - iter / iterations);
			adjustedNodes.forEach((node) => {
				if (!node.position) return;

				const force = forces.get(node.id)!;
				
				// Apply horizontal force to reduce congestion
				node.position.x += force.x * damping;
				
				// Keep vertical position stable (only minor adjustments)
				node.position.y += force.y * damping * 0.3;
			});
		}

		return adjustedNodes;
	}

	/**
	 * Separate positioned nodes back into their original types
	 */
	private separateNodesByType(
		positionedNodes: LayoutNode[],
		graphNodes: GraphNode[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		edges: GraphEdge[]
	) {
		const nodeMap = new Map<string, LayoutNode>();
		positionedNodes.forEach((node) => {
			nodeMap.set(node.id, node);
		});

		return {
			graphNodes: graphNodes.map((node) => ({
				...node,
				position: nodeMap.get(node.id)?.position || { x: 0, y: 0 },
			})),
			c1Nodes: c1Outputs.map((node) => ({
				...node,
				position: nodeMap.get(node.id)?.position || { x: 0, y: 0 },
			})),
			c2Nodes: c2Subcategories.map((node) => ({
				...node,
				position: nodeMap.get(node.id)?.position || { x: 0, y: 0 },
			})),
			edges,
		};
	}

	/**
	 * Alternative layout: Sugiyama-style hierarchical layout
	 * Better for minimizing edge crossings
	 */
	layoutWithMinimalCrossings(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: any[],
		crossC1C2Relationships: any[]
	) {
		const config: LayoutConfig = {
			...this.defaultConfig,
			rankSep: 200,
			nodeSep: 100,
			edgeSep: 50,
		};

		return this.layoutGraph(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships,
			config
		);
	}

	/**
	 * Compact layout for large graphs
	 */
	layoutCompact(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: any[],
		crossC1C2Relationships: any[]
	) {
		const config: LayoutConfig = {
			...this.defaultConfig,
			rankSep: 100,
			nodeSep: 50,
			edgeSep: 20,
			clusterSpacing: 150,
		};

		return this.layoutGraph(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships,
			config
		);
	}

	/**
	 * Wide layout for better horizontal space
	 */
	layoutWide(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: any[],
		crossC1C2Relationships: any[]
	) {
		const config: LayoutConfig = {
			...this.defaultConfig,
			rankSep: 150,
			nodeSep: 120,
			edgeSep: 40,
			clusterSpacing: 250,
		};

		return this.layoutGraph(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships,
			config
		);
	}
}
