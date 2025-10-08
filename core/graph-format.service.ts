import dagre from 'dagre';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';

export class GraphFormatService {
	layoutCategoriesWithNodes(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		const c2NameToIdMap = new Map();
		c2Subcategories.forEach(c2 => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});

		// Build all edges
		const allEdges: GraphEdge[] = [
			...graphEdges,
			...c2Subcategories.map(c2 => ({
				id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
				source: c2.c1CategoryId,
				target: c2.id,
				label: 'contains'
			})),
			...c2Subcategories.flatMap(c2 =>
				c2.nodeIds.map(nodeId => ({
					id: `c2-${c2.id}-to-node-${nodeId}`,
					source: c2.id,
					target: nodeId,
					label: 'contains'
				}))
			),
			...c2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) return null;
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label
				};
			}).filter((edge): edge is GraphEdge => edge !== null),
			...crossC1C2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) return null;
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label
				};
			}).filter((edge): edge is GraphEdge => edge !== null)
		];

		// Sort nodes based on dependencies
		const sortedC2 = this.sortByDependencies(c2Subcategories, allEdges);
		const sortedGraphNodes = this.sortNodesByDependencies(graphNodes, allEdges);

		// Hierarchical layout with proper spacing
		const { positionedC1Nodes, positionedC2Nodes, positionedGraphNodes } = 
			this.hierarchicalLayout(c1Outputs, sortedC2, sortedGraphNodes, allEdges);

		return {
			graphNodes: positionedGraphNodes,
			c1Nodes: positionedC1Nodes,
			c2Nodes: positionedC2Nodes,
			edges: allEdges,
		};
	}

	private sortByDependencies(nodes: C2Subcategory[], edges: GraphEdge[]): C2Subcategory[] {
		// Build adjacency map for C2 nodes
		const adjacency = new Map<string, Set<string>>();
		nodes.forEach(node => adjacency.set(node.id, new Set()));

		edges.forEach(edge => {
			if (edge.label !== 'contains') {
				const sourceNode = nodes.find(n => n.id === edge.source);
				const targetNode = nodes.find(n => n.id === edge.target);
				if (sourceNode && targetNode) {
					adjacency.get(edge.source)?.add(edge.target);
					adjacency.get(edge.target)?.add(edge.source);
				}
			}
		});

		// Group by C1, then sort within each group
		const byC1 = new Map<string, C2Subcategory[]>();
		nodes.forEach(node => {
			if (!byC1.has(node.c1CategoryId)) {
				byC1.set(node.c1CategoryId, []);
			}
			byC1.get(node.c1CategoryId)!.push(node);
		});

		const result: C2Subcategory[] = [];
		byC1.forEach(group => {
			const sorted = this.greedySort(group, adjacency);
			result.push(...sorted);
		});

		return result;
	}

	private sortNodesByDependencies(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
		// Build adjacency map
		const adjacency = new Map<string, Set<string>>();
		nodes.forEach(node => adjacency.set(node.id, new Set()));

		edges.forEach(edge => {
			if (edge.label !== 'contains') {
				const sourceNode = nodes.find(n => n.id === edge.source);
				const targetNode = nodes.find(n => n.id === edge.target);
				if (sourceNode && targetNode) {
					adjacency.get(edge.source)?.add(edge.target);
					adjacency.get(edge.target)?.add(edge.source);
				}
			}
		});

		return this.greedySort(nodes, adjacency);
	}

	private greedySort<T extends { id: string }>(nodes: T[], adjacency: Map<string, Set<string>>): T[] {
		if (nodes.length === 0) return [];

		const result: T[] = [];
		const remaining = new Set(nodes);

		// Start with node that has most connections
		let current = nodes.reduce((max, node) => 
			(adjacency.get(node.id)?.size || 0) > (adjacency.get(max.id)?.size || 0) ? node : max
		);

		result.push(current);
		remaining.delete(current);

		// Greedily add nodes that are most connected to already placed nodes
		while (remaining.size > 0) {
			let maxScore = -1;
			let nextNode: T | null = null;

			remaining.forEach(node => {
				let score = 0;
				result.forEach(placedNode => {
					if (adjacency.get(node.id)?.has(placedNode.id)) {
						score++;
					}
				});
				if (score > maxScore) {
					maxScore = score;
					nextNode = node;
				}
			});

			// If no connections found, pick any remaining node
			if (nextNode === null) {
				nextNode = Array.from(remaining)[0];
			}

			result.push(nextNode);
			remaining.delete(nextNode);
		}

		return result;
	}

	private hierarchicalLayout(
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		graphNodes: GraphNode[],
		edges: GraphEdge[]
	) {
		// Spacing configuration
		const C1_HORIZONTAL_SPACING = 800;
		const C2_HORIZONTAL_SPACING = 600;
		const NODE_HORIZONTAL_SPACING = 280;
		const VERTICAL_SPACING_C1_TO_C2 = 250;
		const VERTICAL_SPACING_C2_TO_NODE = 250;
		const NODE_VERTICAL_SPACING = 180;

		// Layer 1: C1 Categories
		const positionedC1Nodes = c1Outputs.map((c1, idx) => ({
			...c1,
			position: {
				x: idx * C1_HORIZONTAL_SPACING,
				y: 0
			}
		}));

		// Group C2 nodes by their C1 parent
		const c2ByC1 = new Map<string, C2Subcategory[]>();
		c2Subcategories.forEach(c2 => {
			if (!c2ByC1.has(c2.c1CategoryId)) {
				c2ByC1.set(c2.c1CategoryId, []);
			}
			c2ByC1.get(c2.c1CategoryId)!.push(c2);
		});

		// Layer 2: C2 Subcategories - positioned under their parent C1
		const positionedC2Nodes: (C2Subcategory & { position: { x: number; y: number } })[] = [];
		let c2GlobalIndex = 0;

		c1Outputs.forEach((c1, c1Index) => {
			const c2Children = c2ByC1.get(c1.id) || [];
			const c1X = c1Index * C1_HORIZONTAL_SPACING;

			c2Children.forEach((c2, c2LocalIdx) => {
				const c2X = c1X + (c2LocalIdx - (c2Children.length - 1) / 2) * C2_HORIZONTAL_SPACING;
				positionedC2Nodes.push({
					...c2,
					position: {
						x: c2X,
						y: VERTICAL_SPACING_C1_TO_C2
					}
				});
				c2GlobalIndex++;
			});
		});

		// Group graph nodes by their C2 parent
		const nodesByC2 = new Map<string, GraphNode[]>();
		c2Subcategories.forEach(c2 => {
			const c2Nodes = graphNodes.filter(node => c2.nodeIds.includes(node.id));
			if (c2Nodes.length > 0) {
				nodesByC2.set(c2.id, c2Nodes);
			}
		});

		// Layer 3: Individual nodes - positioned under their parent C2
		const positionedGraphNodes: (GraphNode & { position: { x: number; y: number } })[] = [];
		
		positionedC2Nodes.forEach(c2 => {
			const children = nodesByC2.get(c2.id) || [];
			
			// Sort children by their connections to minimize edge lengths
			const childAdjacency = new Map<string, Set<string>>();
			children.forEach(child => childAdjacency.set(child.id, new Set()));
			
			edges.forEach(edge => {
				const sourceInChildren = children.find(n => n.id === edge.source);
				const targetInChildren = children.find(n => n.id === edge.target);
				if (sourceInChildren && targetInChildren && edge.label !== 'contains') {
					childAdjacency.get(edge.source)?.add(edge.target);
					childAdjacency.get(edge.target)?.add(edge.source);
				}
			});
			
			const sortedChildren = this.greedySort(children, childAdjacency);
			const nodesPerRow = Math.ceil(Math.sqrt(sortedChildren.length));
			
			sortedChildren.forEach((node, idx) => {
				const row = Math.floor(idx / nodesPerRow);
				const col = idx % nodesPerRow;
				const totalCols = Math.min(sortedChildren.length - row * nodesPerRow, nodesPerRow);
				
				positionedGraphNodes.push({
					...node,
					position: {
						x: c2.position.x + (col - (totalCols - 1) / 2) * NODE_HORIZONTAL_SPACING,
						y: VERTICAL_SPACING_C1_TO_C2 + VERTICAL_SPACING_C2_TO_NODE + row * NODE_VERTICAL_SPACING
					}
				});
			});
		});

		return { positionedC1Nodes, positionedC2Nodes, positionedGraphNodes };
	}
}
