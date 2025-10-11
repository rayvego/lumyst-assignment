import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import dagre from 'dagre';

const nodeWidth = 220; // Match your node width in the UI
const nodeHeight = 80; // Adjust as needed for your node height

// Enhanced layout configuration with better spacing
const LAYOUT_CONFIG = {
  nodeWidth,
  nodeHeight,
  nodeSpacing: 40, // Minimum spacing between nodes
  rankSpacing: 120, // Spacing between ranks/levels
  clusterSpacing: 200, // Extra spacing between different clusters
  edgeLength: 150, // Preferred edge length
};

export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type LayoutAlgorithm = 'hierarchical' | 'force-directed' | 'circular' | 'tree';

export interface LayoutOptions {
  direction?: LayoutDirection;
  algorithm?: LayoutAlgorithm;
  spacing?: number;
  clusterSimilar?: boolean;
  reduceCrossings?: boolean;
}

interface NodeWithType {
  id: string;
  type?: string;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

interface EdgeWithWeight {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export function arrangeGraphHierarchically(
  nodes: NodeWithType[],
  edges: EdgeWithWeight[],
  options: LayoutOptions = {}
): NodeWithType[] {
  const {
    direction = 'TB',
    algorithm = 'hierarchical',
    spacing = LAYOUT_CONFIG.nodeSpacing,
    clusterSimilar = true,
    reduceCrossings = true,
  } = options;

  switch (algorithm) {
    case 'hierarchical':
      return arrangeHierarchicalLayout(nodes, edges, direction, spacing, clusterSimilar);
    case 'force-directed':
      return arrangeForceDirectedLayout(nodes, edges, spacing);
    case 'circular':
      return arrangeCircularLayout(nodes, edges, spacing);
    case 'tree':
      return arrangeTreeLayout(nodes, edges, direction, spacing);
    default:
      return arrangeHierarchicalLayout(nodes, edges, direction, spacing, clusterSimilar);
  }
}

function arrangeHierarchicalLayout(
  nodes: NodeWithType[],
  edges: EdgeWithWeight[],
  direction: LayoutDirection,
  spacing: number,
  clusterSimilar: boolean
): NodeWithType[] {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Enhanced graph configuration for better spacing
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: spacing,
    ranksep: LAYOUT_CONFIG.rankSpacing,
    edgesep: 10,
    marginx: 50,
    marginy: 50,
    align: 'UL', // Align nodes to upper-left within their rank
  });

  // Add nodes with appropriate dimensions
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: LAYOUT_CONFIG.nodeWidth, 
      height: LAYOUT_CONFIG.nodeHeight,
      // Add weight to control node positioning priority
      weight: getNodeWeight(node)
    });
  });

  // Add edges with weights to influence layout
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, {
      weight: getEdgeWeight(edge),
      minlen: 1,
    });
  });

  // Apply layout
  dagre.layout(dagreGraph);

  // Get positioned nodes
  const positionedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: nodeWithPosition.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
      draggable: false,
    };
  });

  // Apply post-processing for better spacing
  if (clusterSimilar) {
    return applyClusteringOptimization(positionedNodes, edges);
  }

  return positionedNodes;
}

function arrangeForceDirectedLayout(nodes: NodeWithType[], edges: EdgeWithWeight[], spacing: number): NodeWithType[] {
  // Simple force-directed layout implementation
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  
  // Initialize positions randomly
  nodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    const radius = Math.sqrt(nodes.length) * spacing;
    positions.set(node.id, {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      vx: 0,
      vy: 0,
    });
  });

  // Run force simulation
  const iterations = 100;
  const k = Math.sqrt((400 * 400) / nodes.length); // Optimal distance
  const c = 0.1; // Cooling factor

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = positions.get(nodes[i].id)!;
        const nodeB = positions.get(nodes[j].id)!;
        
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (k * k) / distance;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    }

    // Attractive forces between connected nodes
    edges.forEach((edge) => {
      const nodeA = positions.get(edge.source);
      const nodeB = positions.get(edge.target);
      
      if (nodeA && nodeB) {
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (distance * distance) / k;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        nodeA.vx += fx;
        nodeA.vy += fy;
        nodeB.vx -= fx;
        nodeB.vy -= fy;
      }
    });

    // Update positions and apply cooling
    positions.forEach((pos) => {
      pos.x += pos.vx * c;
      pos.y += pos.vy * c;
      pos.vx *= 0.9; // Damping
      pos.vy *= 0.9;
    });
  }

  return nodes.map((node) => {
    const pos = positions.get(node.id)!;
    return {
      ...node,
      position: {
        x: pos.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: pos.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
      draggable: false,
    };
  });
}

function arrangeCircularLayout(nodes: NodeWithType[], _edges: EdgeWithWeight[], spacing: number): NodeWithType[] {
  const centerX = 0;
  const centerY = 0;
  const radius = Math.max(200, nodes.length * spacing / (2 * Math.PI));

  return nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length;
    return {
      ...node,
      position: {
        x: centerX + radius * Math.cos(angle) - LAYOUT_CONFIG.nodeWidth / 2,
        y: centerY + radius * Math.sin(angle) - LAYOUT_CONFIG.nodeHeight / 2,
      },
      draggable: false,
    };
  });
}

function arrangeTreeLayout(nodes: NodeWithType[], edges: EdgeWithWeight[], direction: LayoutDirection, spacing: number): NodeWithType[] {
  // Find root nodes (nodes with no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  const rootNodes = nodes.filter(node => !incomingEdges.has(node.id));
  
  if (rootNodes.length === 0) {
    // No root found, use first node
    return arrangeHierarchicalLayout(nodes, edges, direction, spacing, false);
  }

  const positions = new Map<string, { x: number; y: number; level: number }>();
  const visited = new Set<string>();

  // DFS to assign levels
  function assignLevels(nodeId: string, level: number = 0) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    positions.set(nodeId, { x: 0, y: 0, level });
    
    const children = edges.filter(e => e.source === nodeId);
    children.forEach(child => assignLevels(child.target, level + 1));
  }

  rootNodes.forEach(root => assignLevels(root.id));

  // Position nodes within levels
  const levelGroups = new Map<number, string[]>();
  positions.forEach((pos, nodeId) => {
    if (!levelGroups.has(pos.level)) {
      levelGroups.set(pos.level, []);
    }
    levelGroups.get(pos.level)!.push(nodeId);
  });

  levelGroups.forEach((nodeIds, level) => {
    const levelWidth = nodeIds.length * (LAYOUT_CONFIG.nodeWidth + spacing);
    const startX = -levelWidth / 2;
    
    nodeIds.forEach((nodeId, index) => {
      const pos = positions.get(nodeId)!;
      pos.x = startX + index * (LAYOUT_CONFIG.nodeWidth + spacing);
      pos.y = level * LAYOUT_CONFIG.rankSpacing;
    });
  });

  return nodes.map((node) => {
    const pos = positions.get(node.id) || { x: 0, y: 0, level: 0 };
    return {
      ...node,
      position: {
        x: pos.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: pos.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
      draggable: false,
    };
  });
}

function getNodeWeight(node: NodeWithType): number {
  // Assign weights based on node type for better positioning
  if (node.type === 'c1') return 3; // C1 categories get highest priority
  if (node.type === 'c2') return 2; // C2 subcategories get medium priority
  return 1; // Regular nodes get lowest priority
}

function getEdgeWeight(edge: EdgeWithWeight): number {
  // Assign weights to edges to influence layout
  if (edge.label === 'contains') return 3; // Containment relationships are strong
  if (edge.label && edge.label !== '') return 2; // Other labeled relationships
  return 1; // Default weight
}

function applyClusteringOptimization(nodes: NodeWithType[], _edges: EdgeWithWeight[]): NodeWithType[] {
  // Group nodes by type and apply additional spacing between clusters
  const clusters = new Map<string, NodeWithType[]>();
  
  nodes.forEach(node => {
    const clusterKey = getClusterKey(node);
    if (!clusters.has(clusterKey)) {
      clusters.set(clusterKey, []);
    }
    clusters.get(clusterKey)!.push(node);
  });

  // Apply cluster-based positioning
  const clusterCenters = new Map<string, { x: number; y: number }>();
  
  // Calculate cluster centers
  clusters.forEach((clusterNodes, clusterKey) => {
    const centerX = clusterNodes.reduce((sum, node) => sum + (node.position?.x || 0), 0) / clusterNodes.length;
    const centerY = clusterNodes.reduce((sum, node) => sum + (node.position?.y || 0), 0) / clusterNodes.length;
    clusterCenters.set(clusterKey, { x: centerX, y: centerY });
  });

  // Adjust positions to maintain cluster separation
  const adjustedNodes = nodes.map(node => {
    const clusterKey = getClusterKey(node);
    const clusterCenter = clusterCenters.get(clusterKey)!;
    const nodeCenter = clusterCenter;
    
    return {
      ...node,
      position: {
        x: nodeCenter.x - LAYOUT_CONFIG.nodeWidth / 2,
        y: nodeCenter.y - LAYOUT_CONFIG.nodeHeight / 2,
      },
    };
  });

  return adjustedNodes;
}

function getClusterKey(node: NodeWithType): string {
  // Determine cluster based on node type and properties
  if (node.type === 'c1') return 'c1-cluster';
  if (node.type === 'c2') return `c2-cluster-${(node as any).c1CategoryId || 'default'}`;
  
  // For regular nodes, try to group by file or similar attributes
  const filePath = (node as any).filePath;
  if (filePath && typeof filePath === 'string') {
    const fileDir = filePath.split('/').slice(0, -1).join('/');
    return `file-cluster-${fileDir}`;
  }
  
  return 'default-cluster';
}

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
				data: { 
					label: node.label,
					type: 'graph',
					filePath: (node as any).filePath as string,
					syntaxType: (node as any).syntaxType as string,
					isAbstract: (node as any).isAbstract as boolean,
					isOverride: (node as any).isOverride as boolean
				},
				type: 'graphNode',
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
				data: { 
					label: node.label,
					categoryData: {
						c1Category: node.c1Category,
						nodesInCategory: node.nodesInCategory
					}
				},
				type: 'c1CategoryNode',
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
				data: { 
					label: node.label,
					categoryData: {
						c2Name: node.c2Name,
						nodeCount: node.nodeCount,
						categoryDescription: node.description
					}
				},
				type: 'c2SubcategoryNode',
				style: {
					background: '#f0fdf4',
					border: '2px solid #16a34a',
					color: '#166534',
					borderRadius: '6px'
				},
			}))
		];

		// Enhanced edge routing with better styling and path optimization
		const reactFlowEdges = edges.map((edge) => {
			const edgeStyle = getEdgeStyle(edge);
			return {
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
				type: 'smoothstep', // Use smoothstep for better edge routing
				animated: edge.label !== 'contains', // Animate non-containment edges
				style: edgeStyle,
				labelStyle: { 
					fill: '#000', 
					fontWeight: '500',
					fontSize: '12px'
				},
				// Add path finding hints for better routing
				pathOptions: {
					borderRadius: 10,
					offset: getEdgeOffset(edge)
				}
			};
		});

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}

function getEdgeStyle(edge: GraphEdge): React.CSSProperties {
	const baseStyle = {
		strokeWidth: 2,
		strokeLinecap: 'round' as const,
	};

	if (edge.label === 'contains') {
		return {
			...baseStyle,
			stroke: '#9ca3af',
			strokeDasharray: '8,4',
			strokeWidth: 1.5,
			opacity: 0.7
		};
	}

	if (edge.id.startsWith('c2_relationship')) {
		return {
			...baseStyle,
			stroke: '#059669',
			strokeWidth: 2.5,
			opacity: 0.8
		};
	}

	if (edge.id.startsWith('cross_c1_c2_rel')) {
		return {
			...baseStyle,
			stroke: '#d97706',
			strokeWidth: 2.5,
			opacity: 0.8
		};
	}

	// Regular edges
	return {
		...baseStyle,
		stroke: '#374151',
		strokeWidth: 1.5,
		opacity: 0.6
	};
}

function getEdgeOffset(edge: GraphEdge): number {
	// Provide different offsets for different edge types to reduce overlap
	if (edge.label === 'contains') return 0;
	if (edge.id.startsWith('c2_relationship')) return 15;
	if (edge.id.startsWith('cross_c1_c2_rel')) return -15;
	return 0;
}
