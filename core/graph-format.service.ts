import ELK from 'elkjs/lib/elk.bundled.js';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';

export class GraphFormatService {
	private elk = new ELK();

	async layoutCategoriesWithNodes(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		// Create a mapping from C2 names to C2 IDs for relationships
		const c2NameToIdMap = new Map<string, string>();
		c2Subcategories.forEach(c2 => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});

		// Prepare nodes for ELK
		const elkNodes = [
			...graphNodes.map(node => ({
				id: node.id,
				width: 220,
				height: 80,
				layoutOptions: {
					'elk.nodeLabels.placement': 'INSIDE', // Label text inside the node
				}
			})),
			...c1Outputs.map(c1 => ({
				id: c1.id,
				width: 240,
				height: 90,
				layoutOptions: {
					'elk.nodeLabels.placement': 'INSIDE',
				}
			})),
			...c2Subcategories.map(c2 => ({
				id: c2.id,
				width: 220,
				height: 85,
				layoutOptions: {
					'elk.nodeLabels.placement': 'INSIDE',
				}
			}))
		];

		// Prepare edges for ELK
		const elkEdges = [
			...graphEdges.map(edge => ({
				id: edge.id,
				sources: [edge.source],
				targets: [edge.target]
			})),
			// Edges from C1 to their C2 subcategories
			...c2Subcategories.map(c2 => ({
				id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
				sources: [c2.c1CategoryId],
				targets: [c2.id]
			})),
			// Edges from C2 to their nodes
			...c2Subcategories.flatMap(c2 =>
				c2.nodeIds.map(nodeId => ({
					id: `c2-${c2.id}-to-node-${nodeId}`,
					sources: [c2.id],
					targets: [nodeId]
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
					sources: [sourceId],
					targets: [targetId]
				};
			}).filter(edge => edge !== null),
			// Cross C1-C2 relationships
			...crossC1C2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) {
					return null;
				}
				return {
					id: rel.id,
					sources: [sourceId],
					targets: [targetId]
				};
			}).filter(edge => edge !== null)
		];

		// Create ELK graph structure
		const elkGraph = {
			id: 'root',
			layoutOptions: {
				'elk.algorithm': 'layered',
				'elk.direction': 'DOWN',
				'elk.layered.layering.strategy': 'INTERACTIVE', // Use interactive layering to respect layer constraints
			},
			children: elkNodes,
			edges: elkEdges
		};

		try {
			// Calculate layout
			const layoutedGraph = await this.elk.layout(elkGraph);

			// Apply positions to all nodes
			const nodePositionMap = new Map<string, { x: number; y: number }>();
			layoutedGraph.children?.forEach(node => {
				nodePositionMap.set(node.id, { 
					x: node.x || 0, 
					y: node.y || 0 
				});
			});

			const positionedGraphNodes = graphNodes.map((node) => {
				const position = nodePositionMap.get(node.id) || { x: 0, y: 0 };
				return {
					...node,
					position
				};
			});

			const positionedC1Nodes = c1Outputs.map((node) => {
				const position = nodePositionMap.get(node.id) || { x: 0, y: 0 };
				return {
					...node,
					position
				};
			});

			const positionedC2Nodes = c2Subcategories.map((node) => {
				const position = nodePositionMap.get(node.id) || { x: 0, y: 0 };
				return {
					...node,
					position
				};
			});

			// Create all edges array
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

			return {
				graphNodes: positionedGraphNodes,
				c1Nodes: positionedC1Nodes,
				c2Nodes: positionedC2Nodes,
				edges: allEdges,
			};
		} catch (error) {
			throw new Error("ELK layout failed: " + error);
		}
	}
}
