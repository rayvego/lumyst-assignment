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
		// Create a mapping from C2 names to C2 IDs for relationships
		const c2NameToIdMap = new Map();
		c2Subcategories.forEach(c2 => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});
		const dagreGraph = new dagre.graphlib.Graph();
		dagreGraph.setDefaultEdgeLabel(() => ({}));

		// Set up the graph
		dagreGraph.setGraph({ rankdir: 'TB' });

		// Add all nodes to dagre
		const allNodes = [
			...graphNodes,
			...c1Outputs.map(c1 => ({ ...c1, type: 'c1' })),
			...c2Subcategories.map(c2 => ({ ...c2, type: 'c2' }))
		];


		allNodes.forEach((node) => {
			dagreGraph.setNode(node.id, { width: 150, height: 50 });
		});

		// Add all edges to dagre
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
					// Skip relationships where C2 nodes don't exist
					return null;
				}
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label
				};
			}).filter((edge): edge is GraphEdge => edge !== null),
			// Cross C1-C2 relationships (connect C2 nodes across different C1 categories)
			...crossC1C2Relationships.map(rel => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) {
					// Skip relationships where C2 nodes don't exist
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

		allEdges.forEach((edge) => {
			if (edge) {
				dagreGraph.setEdge(edge.source, edge.target);
			}
		});

		// Calculate layout
		dagre.layout(dagreGraph);

		// Apply positions to all nodes
		const positionedGraphNodes = graphNodes.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			return {
				...node,
				position: {
					x: nodeWithPosition.x - nodeWithPosition.width / 2,
					y: nodeWithPosition.y - nodeWithPosition.height / 2,
				},
			};
		});

		const positionedC1Nodes = c1Outputs.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			return {
				...node,
				position: {
					x: nodeWithPosition.x - nodeWithPosition.width / 2,
					y: nodeWithPosition.y - nodeWithPosition.height / 2,
				},
			};
		});

		const positionedC2Nodes = c2Subcategories.map((node) => {
			const nodeWithPosition = dagreGraph.node(node.id);
			return {
				...node,
				position: {
					x: nodeWithPosition.x - nodeWithPosition.width / 2,
					y: nodeWithPosition.y - nodeWithPosition.height / 2,
				},
			};
		});

		return {
			graphNodes: positionedGraphNodes,
			c1Nodes: positionedC1Nodes,
			c2Nodes: positionedC2Nodes,
			edges: allEdges,
		};
	}
}

/**
 * layoutGraph: Hierarchical layout for large directed graphs (React/TypeScript version).
 * - Nodes are assigned to layers using topological sorting.
 * - Nodes in each layer are distributed horizontally with spacing and slight staggering.
 * - Reduces congestion, avoids node overlap, and keeps edges as straight as possible.
 * - Efficient for large graphs.
 *
 * Returns: { graphNodes, c1Nodes, c2Nodes, edges }
 */
export function layoutGraph(
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[],
  c1Outputs: C1Output[],
  c2Subcategories: C2Subcategory[],
  c2Relationships: C2Relationship[],
  crossC1C2Relationships: CrossC1C2Relationship[]
) {
  // 1. Build adjacency and reverse adjacency
  const adj = new Map<string, string[]>();
  const radj = new Map<string, string[]>();

  // Consolidate all node IDs for graph construction
  const allNodeIds = new Set<string>();
  graphNodes.forEach(n => allNodeIds.add(n.id));
  c1Outputs.forEach(n => allNodeIds.add(n.id));
  c2Subcategories.forEach(n => allNodeIds.add(n.id));

  allNodeIds.forEach(id => { adj.set(id, []); radj.set(id, []); });

  // Consolidate all edges for graph construction
  const c2NameToIdMap = new Map();
  c2Subcategories.forEach(c2 => {
    c2NameToIdMap.set(c2.c2Name, c2.id);
  });

  const tempAllEdges: GraphEdge[] = [
    ...graphEdges,
    ...c2Subcategories.map(c2 => ({
      id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
      source: c2.c1CategoryId,
      target: c2.id,
      label: 'contains',
    })),
    ...c2Subcategories.flatMap(c2 =>
      c2.nodeIds.map(nodeId => ({
        id: `c2-${c2.id}-to-node-${nodeId}`,
        source: c2.id,
        target: nodeId,
        label: 'contains',
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
        label: rel.label,
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
        label: rel.label,
      };
    }).filter((edge): edge is GraphEdge => edge !== null),
  ];

  tempAllEdges.forEach(e => {
    if (adj.has(e.source)) adj.get(e.source)!.push(e.target);
    if (radj.has(e.target)) radj.get(e.target)!.push(e.source);
  });

  // 2. Assign layers using longest path layering (topological)
  const layers = new Map<string, number>();
  const visitedForDfs = new Set<string>(); // Global visited set for cycle detection
  function dfs(node: string): number {
    if (layers.has(node)) return layers.get(node)!;
    if (visitedForDfs.has(node)) {
        // Handle cycles: if we revisit a node during DFS for layering,
        // it means there's a cycle. For layout, we can break the cycle
        // by assuming this node is in the current layer (layer 0 or current max).
        // This is a simplification; for true cycle breaking, dummy nodes or
        // edge reversals are needed. For now, return 0 to prevent infinite recursion.
        console.warn(`Cycle detected involving node: ${node}.`);
        return 0;
    }
    visitedForDfs.add(node);

    const preds = radj.get(node) || [];
    let layer = 0;
    for (const p of preds) {
      layer = Math.max(layer, dfs(p) + 1);
    }
    layers.set(node, layer);
    visitedForDfs.delete(node); // Remove from visited after processing
    return layer;
  }
  allNodeIds.forEach(id => { dfs(id); });


  // 3. Group nodes by layer
  const layerNodes: Map<number, string[]> = new Map();
  layers.forEach((layer, node) => {
    if (!layerNodes.has(layer)) layerNodes.set(layer, []);
    layerNodes.get(layer)!.push(node);
  });

  const maxLayer = layerNodes.size > 0 ? Math.max(...Array.from(layerNodes.keys())) : 0;

  // 4. Order nodes within each layer to minimize crossings (barycenter heuristic)
  for (let l = 1; l <= maxLayer; l++) {
    const prevLayer = layerNodes.get(l - 1) || [];
    const currLayer = layerNodes.get(l) || [];
    const barycenters: [number, string][] = currLayer.map(n => {
      const preds = radj.get(n) || [];
      if (preds.length) {
        const bary = preds.map(p => prevLayer.indexOf(p)).filter(i => i >= 0);
        return [bary.length ? bary.reduce((a, b) => a + b, 0) / bary.length : currLayer.indexOf(n), n];
      } else {
        return [currLayer.indexOf(n), n]; // If no predecessors, keep original order
      }
    });
    barycenters.sort((a, b) => a[0] - b[0]);
    layerNodes.set(l, barycenters.map(([_, n]) => n));
  }

  // 5. Assign (x, y) positions with staggering and explicit overlap avoidance
  const NODE_WIDTH = 180; // Standard node width for layout calculations
  const NODE_HEIGHT = 60; // Standard node height
  const LAYER_SPACING = 120; // Vertical space between layers
  const NODE_SPACING = 80; // Minimum horizontal space between nodes in the same layer
  const STAGGER = 30; // Horizontal stagger for alternating nodes in a layer
  const nodePositions = new Map<string, { x: number; y: number }>();

  layerNodes.forEach((nodesInLayer, l) => {
    const numNodes = nodesInLayer.length;
    let currentX = 0; // Starting X position for the layer

    // Calculate initial horizontal positions for nodes in the current layer
    const initialPositions: { id: string; x: number; y: number }[] = nodesInLayer.map((nodeId, i) => {
        // Base Y position for the layer
        const baseY = l * (NODE_HEIGHT + LAYER_SPACING);

        // Apply staggering for visual separation, but ensure initial spacing is wide enough
        const xPos = (i - (numNodes - 1) / 2) * (NODE_WIDTH + NODE_SPACING) + (i % 2 ? STAGGER : 0);

        return { id: nodeId, x: xPos, y: baseY };
    });

    // Sort by initial X to process from left to right
    initialPositions.sort((a, b) => a.x - b.x);

    // Apply horizontal overlap correction
    for (let i = 0; i < initialPositions.length; i++) {
        if (i > 0) {
            const prev = initialPositions[i - 1];
            const curr = initialPositions[i];
            const minRequiredX = prev.x + NODE_WIDTH + NODE_SPACING;
            if (curr.x < minRequiredX) {
                curr.x = minRequiredX;
            }
        }
    }

    // Recenter the entire layer horizontally to prevent drift
    if (initialPositions.length > 0) {
        const minX = initialPositions[0].x;
        const maxX = initialPositions[initialPositions.length - 1].x;
        const layerWidth = maxX - minX + NODE_WIDTH; // Include width of the last node
        const centerOffset = - (minX + layerWidth / 2); // Shift to center around 0
        initialPositions.forEach(item => {
            item.x += centerOffset;
        });
    }

    // Apply vertical offsets for nodes with very close horizontal positions within the same layer
    // This helps especially with C2 nodes if they end up clustered horizontally
    const groupedByCloseX = new Map<number, typeof initialPositions[0][]>();
    const X_BUCKET_SIZE = NODE_WIDTH / 2; // Nodes within this X difference are considered "close"

    initialPositions.forEach(item => {
        const bucketKey = Math.round(item.x / X_BUCKET_SIZE);
        if (!groupedByCloseX.has(bucketKey)) {
            groupedByCloseX.set(bucketKey, []);
        }
        groupedByCloseX.get(bucketKey)!.push(item);
    });

    const V_OFFSET_STEP = (NODE_HEIGHT + LAYER_SPACING / 2) / 2; // Vertical adjustment step

    groupedByCloseX.forEach(group => {
        if (group.length > 1) {
            // Sort group by original Y to maintain some order, then apply vertical spread
            group.sort((a, b) => a.y - b.y); // Use current Y or original Y if available
            const baseY = group[0].y; // Base Y for this cluster

            const totalOffsetHeight = (group.length - 1) * V_OFFSET_STEP;
            const startYOffset = -totalOffsetHeight / 2; // Center the cluster vertically

            group.forEach((item, idx) => {
                item.y = baseY + startYOffset + (idx * V_OFFSET_STEP);
            });
        }
    });

    // Commit final positions for the layer
    initialPositions.forEach(item => {
        nodePositions.set(item.id, { x: item.x, y: item.y });
    });
  });


  // 6. Apply positions to all node types
  const positionedGraphNodes = graphNodes.map(node => ({
    ...node,
    position: nodePositions.get(node.id) || { x: 0, y: 0 },
  }));
  const positionedC1Nodes = c1Outputs.map(node => ({
    ...node,
    position: nodePositions.get(node.id) || { x: 0, y: 0 },
  }));
  const positionedC2Nodes = c2Subcategories.map(node => ({
    ...node,
    position: nodePositions.get(node.id) || { x: 0, y: 0 },
  }));

  // 7. All edges (same as before) - ensure these are the actual edges after filtering nulls
  const allEdges: GraphEdge[] = tempAllEdges; // Use the already generated and filtered edges.

  return {
    graphNodes: positionedGraphNodes,
    c1Nodes: positionedC1Nodes,
    c2Nodes: positionedC2Nodes,
    edges: allEdges,
  };
}