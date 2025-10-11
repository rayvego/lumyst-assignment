import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';
import { arrangeGraphHierarchically, type LayoutOptions } from './react-flow.service';

export class GraphFormatService {
	private layoutOptions: LayoutOptions = {
		algorithm: 'hierarchical',
		direction: 'TB',
		spacing: 40,
		clusterSimilar: true,
		reduceCrossings: true,
	};

	layoutCategoriesWithNodes(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[],
		options?: LayoutOptions
	) {
		// Use provided options or default ones
		const layoutOptions = options ? { ...this.layoutOptions, ...options } : this.layoutOptions;

		// Create a mapping from C2 names to C2 IDs for relationships
		const c2NameToIdMap = new Map();
		c2Subcategories.forEach(c2 => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});

		// Prepare all nodes with type information
		const allNodes = [
			...graphNodes.map(node => ({ ...node, type: 'graph' })),
			...c1Outputs.map(c1 => ({ ...c1, type: 'c1' })),
			...c2Subcategories.map(c2 => ({ ...c2, type: 'c2' }))
		];

		// Prepare all edges
		const allEdges: GraphEdge[] = [
			...graphEdges,
			// Edges from C1 to their C2 subcategories
			...c2Subcategories.map(c2 => ({
				id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
				source: c2.c1CategoryId,
				target: c2.id,
				label: 'contains'
			})),
			// Edges from C2 to their nodes
			...c2Subcategories.flatMap(c2 =>
				c2.nodeIds.map(nodeId => ({
					id: `c2-${c2.id}-to-node-${nodeId}`,
					source: c2.id,
					target: nodeId,
					label: 'contains'
				}))
			),
			// C2 relationships
			...c2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) {
					return null;
				}
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label
				};
			}).filter((edge): edge is GraphEdge => edge !== null),
			// Cross C1-C2 relationships
			...crossC1C2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) {
					return null;
				}
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label
				};
			}).filter((edge): edge is GraphEdge => edge !== null)
		];

		// Use the enhanced layout algorithm
		const positionedNodes = arrangeGraphHierarchically(allNodes, allEdges, layoutOptions);

		// Separate nodes back by type
		const positionedGraphNodes = positionedNodes
			.filter(node => node.type === 'graph')
			.map(node => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, ...rest } = node;
				return rest as unknown as GraphNode;
			});

		const positionedC1Nodes = positionedNodes
			.filter(node => node.type === 'c1')
			.map(node => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, ...rest } = node;
				return rest as unknown as C1Output;
			});

		const positionedC2Nodes = positionedNodes
			.filter(node => node.type === 'c2')
			.map(node => {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { type, ...rest } = node;
				return rest as unknown as C2Subcategory;
			});

		return {
			graphNodes: positionedGraphNodes,
			c1Nodes: positionedC1Nodes,
			c2Nodes: positionedC2Nodes,
			edges: allEdges,
		};
	}

	// Method to update layout options
	setLayoutOptions(options: Partial<LayoutOptions>) {
		this.layoutOptions = { ...this.layoutOptions, ...options };
	}

	// Method to get current layout options
	getLayoutOptions(): LayoutOptions {
		return { ...this.layoutOptions };
	}
}
