import dagre from 'dagre';
import type { 
  GraphNode, 
  GraphEdge, 
  C1Output, 
  C2Subcategory, 
  C2Relationship, 
  CrossC1C2Relationship 
} from './types';
import { performanceMonitor } from './performance-monitor';

interface LayoutConfig {
  // Spacing configuration
  rankSep: number;        // Vertical spacing between ranks
  nodeSep: number;        // Horizontal spacing between nodes
  edgeSep: number;        // Minimum spacing between edges
  c1GroupPadding: number; // Padding around C1 groups
  
  // Node dimensions
  c1NodeWidth: number;
  c1NodeHeight: number;
  c2NodeWidth: number;
  c2NodeHeight: number;
  leafNodeWidth: number;
  leafNodeHeight: number;
}

export class HierarchicalLayoutService {
  private config: LayoutConfig = {
    rankSep: 150,        // Increased vertical spacing
    nodeSep: 100,        // Increased horizontal spacing
    edgeSep: 20,
    c1GroupPadding: 80,
    c1NodeWidth: 200,
    c1NodeHeight: 60,
    c2NodeWidth: 180,
    c2NodeHeight: 50,
    leafNodeWidth: 160,
    leafNodeHeight: 40,
  };

  /**
   * Main layout algorithm using hierarchical approach
   * Strategy:
   * 1. Group nodes by C1 categories
   * 2. Layout each C1 group separately
   * 3. Arrange C1 groups horizontally with proper spacing
   * 4. Minimize edge crossings
   */
  layoutCategoriesWithNodes(
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ) {
    // Start performance monitoring
    performanceMonitor.startLayout();

    // Create C2 name to ID mapping
    const c2NameToIdMap = this.createC2NameMap(c2Subcategories);
    
    // Group nodes by C1 category
    const c1Groups = this.groupByC1Category(
      c1Outputs, 
      c2Subcategories, 
      graphNodes
    );

    // Layout each C1 group independently
    const layoutedGroups = c1Groups.map(group => 
      this.layoutC1Group(group, graphEdges)
    );

    // Arrange C1 groups horizontally with optimal spacing
    const { positionedGroups, groupBounds } = this.arrangeC1Groups(layoutedGroups);

    // Extract all positioned nodes
    const allPositionedNodes = this.extractPositionedNodes(positionedGroups);

    // Build all edges with proper routing
    const allEdges = this.buildEdges(
      graphEdges,
      c2Subcategories,
      c2Relationships,
      crossC1C2Relationships,
      c2NameToIdMap
    );

    // Record performance metrics
    const totalNodes = allPositionedNodes.graphNodes.length + 
                      allPositionedNodes.c1Nodes.length + 
                      allPositionedNodes.c2Nodes.length;
    const metrics = performanceMonitor.endLayout(totalNodes, allEdges.length, c1Groups.length);
    
    // Log performance summary in development
    if (process.env.NODE_ENV === 'development') {
      performanceMonitor.logSummary();
    }

    return {
      graphNodes: allPositionedNodes.graphNodes,
      c1Nodes: allPositionedNodes.c1Nodes,
      c2Nodes: allPositionedNodes.c2Nodes,
      edges: allEdges,
      groupBounds, // For rendering background boxes
      performanceMetrics: metrics, // For debugging and optimization
    };
  }

  /**
   * Create mapping from C2 names to IDs
   */
  private createC2NameMap(c2Subcategories: C2Subcategory[]): Map<string, string> {
    const map = new Map<string, string>();
    c2Subcategories.forEach(c2 => {
      map.set(c2.c2Name, c2.id);
    });
    return map;
  }

  /**
   * Group all nodes by their C1 category
   */
  private groupByC1Category(
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    graphNodes: GraphNode[]
  ) {
    const nodeIdToNodeMap = new Map(graphNodes.map(n => [n.id, n]));

    return c1Outputs.map(c1 => {
      const c2s = c2Subcategories.filter(c2 => c2.c1CategoryId === c1.id);
      const leafNodes = c1.nodeIds
        .map(id => nodeIdToNodeMap.get(id))
        .filter((n): n is GraphNode => n !== undefined);

      return {
        c1Node: c1,
        c2Nodes: c2s,
        leafNodes,
      };
    });
  }

  /**
   * Layout a single C1 group using hierarchical strategy
   * Creates 3 layers: C1 (top) → C2s (middle) → Leaf nodes (bottom)
   */
  private layoutC1Group(
    group: {
      c1Node: C1Output;
      c2Nodes: C2Subcategory[];
      leafNodes: GraphNode[];
    },
    graphEdges: GraphEdge[]
  ) {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    
    // Configure for hierarchical top-to-bottom layout
    g.setGraph({
      rankdir: 'TB',
      ranksep: this.config.rankSep,
      nodesep: this.config.nodeSep,
      edgesep: this.config.edgeSep,
      ranker: 'longest-path', // Better for hierarchical structures
    });

    // Add C1 node (top layer)
    g.setNode(group.c1Node.id, {
      width: this.config.c1NodeWidth,
      height: this.config.c1NodeHeight,
      rank: 0, // Force C1 to top
    });

    // Add C2 nodes (middle layer)
    group.c2Nodes.forEach(c2 => {
      g.setNode(c2.id, {
        width: this.config.c2NodeWidth,
        height: this.config.c2NodeHeight,
        rank: 1, // Force C2s to middle
      });
      // Connect C1 to C2
      g.setEdge(group.c1Node.id, c2.id);
    });

    // Add leaf nodes (bottom layer)
    group.leafNodes.forEach(leaf => {
      g.setNode(leaf.id, {
        width: this.config.leafNodeWidth,
        height: this.config.leafNodeHeight,
        rank: 2, // Force leaves to bottom
      });
    });

    // Add containment edges (C2 → leaf nodes)
    group.c2Nodes.forEach(c2 => {
      c2.nodeIds.forEach(nodeId => {
        if (g.hasNode(nodeId)) {
          g.setEdge(c2.id, nodeId);
        }
      });
    });

    // Add relationship edges between leaf nodes within this group
    const nodeIdsInGroup = new Set(group.leafNodes.map(n => n.id));
    graphEdges.forEach(edge => {
      if (
        nodeIdsInGroup.has(edge.source) && 
        nodeIdsInGroup.has(edge.target) &&
        g.hasNode(edge.source) && 
        g.hasNode(edge.target)
      ) {
        g.setEdge(edge.source, edge.target);
      }
    });

    // Run layout
    dagre.layout(g);

    // Extract positioned nodes
    const c1Positioned = {
      ...group.c1Node,
      position: this.getNodePosition(g, group.c1Node.id),
    };

    const c2sPositioned = group.c2Nodes.map(c2 => ({
      ...c2,
      position: this.getNodePosition(g, c2.id),
    }));

    const leavesPositioned = group.leafNodes.map(leaf => ({
      ...leaf,
      position: this.getNodePosition(g, leaf.id),
    }));

    // Calculate group bounds
    const allNodes = [c1Positioned, ...c2sPositioned, ...leavesPositioned];
    const bounds = this.calculateBounds(allNodes);

    return {
      c1Node: c1Positioned,
      c2Nodes: c2sPositioned,
      leafNodes: leavesPositioned,
      bounds,
    };
  }

  /**
   * Extract node position from dagre graph
   */
  private getNodePosition(g: dagre.graphlib.Graph, nodeId: string) {
    const node = g.node(nodeId);
    return {
      x: node.x - node.width / 2,
      y: node.y - node.height / 2,
    };
  }

  /**
   * Calculate bounding box for a set of nodes
   */
  private calculateBounds(nodes: Array<{ position?: { x: number; y: number } }>) {
    const positions = nodes
      .map(n => n.position)
      .filter((p): p is { x: number; y: number } => p !== undefined);

    if (positions.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    return {
      x: minX - this.config.c1GroupPadding,
      y: minY - this.config.c1GroupPadding,
      width: maxX - minX + this.config.c1NodeWidth + this.config.c1GroupPadding * 2,
      height: maxY - minY + this.config.leafNodeHeight + this.config.c1GroupPadding * 2,
    };
  }

  /**
   * Arrange C1 groups horizontally with optimal spacing
   * Uses a simple horizontal packing algorithm
   */
  private arrangeC1Groups(
    layoutedGroups: Array<{
      c1Node: C1Output & { position: { x: number; y: number } };
      c2Nodes: Array<C2Subcategory & { position: { x: number; y: number } }>;
      leafNodes: Array<GraphNode & { position: { x: number; y: number } }>;
      bounds: { x: number; y: number; width: number; height: number };
    }>
  ) {
    let currentX = 0;
    const groupSpacing = 200; // Space between C1 groups

    const positionedGroups = layoutedGroups.map(group => {
      const offsetX = currentX - group.bounds.x;
      const offsetY = -group.bounds.y;

      // Apply offset to all nodes in the group
      const c1Node = {
        ...group.c1Node,
        position: {
          x: group.c1Node.position.x + offsetX,
          y: group.c1Node.position.y + offsetY,
        },
      };

      const c2Nodes = group.c2Nodes.map(c2 => ({
        ...c2,
        position: {
          x: c2.position.x + offsetX,
          y: c2.position.y + offsetY,
        },
      }));

      const leafNodes = group.leafNodes.map(leaf => ({
        ...leaf,
        position: {
          x: leaf.position.x + offsetX,
          y: leaf.position.y + offsetY,
        },
      }));

      const bounds = {
        x: group.bounds.x + offsetX,
        y: group.bounds.y + offsetY,
        width: group.bounds.width,
        height: group.bounds.height,
      };

      // Update currentX for next group
      currentX += group.bounds.width + groupSpacing;

      return { c1Node, c2Nodes, leafNodes, bounds };
    });

    const groupBounds = positionedGroups.map(g => g.bounds);

    return { positionedGroups, groupBounds };
  }

  /**
   * Extract all positioned nodes from groups
   */
  private extractPositionedNodes(
    positionedGroups: Array<{
      c1Node: C1Output & { position: { x: number; y: number } };
      c2Nodes: Array<C2Subcategory & { position: { x: number; y: number } }>;
      leafNodes: Array<GraphNode & { position: { x: number; y: number } }>;
    }>
  ) {
    const graphNodes: GraphNode[] = [];
    const c1Nodes: C1Output[] = [];
    const c2Nodes: C2Subcategory[] = [];

    positionedGroups.forEach(group => {
      c1Nodes.push(group.c1Node);
      c2Nodes.push(...group.c2Nodes);
      graphNodes.push(...group.leafNodes);
    });

    return { graphNodes, c1Nodes, c2Nodes };
  }

  /**
   * Build all edges with proper categorization
   */
  private buildEdges(
    graphEdges: GraphEdge[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[],
    c2NameToIdMap: Map<string, string>
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    // 1. Original graph edges (leaf node relationships)
    edges.push(...graphEdges);

    // 2. C1 → C2 containment edges
    c2Subcategories.forEach(c2 => {
      edges.push({
        id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
        source: c2.c1CategoryId,
        target: c2.id,
        label: 'contains',
      });
    });

    // 3. C2 → leaf node containment edges
    c2Subcategories.forEach(c2 => {
      c2.nodeIds.forEach(nodeId => {
        edges.push({
          id: `c2-${c2.id}-to-node-${nodeId}`,
          source: c2.id,
          target: nodeId,
          label: 'contains',
        });
      });
    });

    // 4. C2 relationships (within same C1)
    c2Relationships.forEach(rel => {
      const sourceId = c2NameToIdMap.get(rel.fromC2);
      const targetId = c2NameToIdMap.get(rel.toC2);
      if (sourceId && targetId) {
        edges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          label: rel.label,
        });
      }
    });

    // 5. Cross C1-C2 relationships
    crossC1C2Relationships.forEach(rel => {
      const sourceId = c2NameToIdMap.get(rel.fromC2);
      const targetId = c2NameToIdMap.get(rel.toC2);
      if (sourceId && targetId) {
        edges.push({
          id: rel.id,
          source: sourceId,
          target: targetId,
          label: rel.label,
        });
      }
    });

    return edges;
  }
}
