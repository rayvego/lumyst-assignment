import dagre from 'dagre';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';

export interface LayoutConfig {
  nodeSpacing: number;
  rankSpacing: number;
  edgeSpacing: number;
  clusterPadding: number;
  minimumNodeSize: { width: number; height: number };
  maximumNodesPerRank: number;
}

export class HierarchicalLayoutService {
  private config: LayoutConfig = {
    nodeSpacing: 400,     // Much larger horizontal spacing to prevent clustering
    rankSpacing: 350,     // Larger vertical spacing for clear hierarchy
    edgeSpacing: 80,      // Increased edge spacing
    clusterPadding: 100,  // Much larger padding between clusters
    minimumNodeSize: { width: 200, height: 70 },
    maximumNodesPerRank: 4  // Fewer nodes per rank to reduce clustering
  };

  /**
   * Main layout function that creates a hierarchical arrangement optimized for large codebases
   */
  layoutHierarchicalGraph(
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ) {
    // Step 1: Create hierarchical clusters
    const clusters = this.createHierarchicalClusters(c1Outputs, c2Subcategories, graphNodes);
    
    // Step 2: Layout each cluster separately
    const layoutedClusters = this.layoutClusters(clusters, graphEdges);
    
    // Step 3: Position clusters relative to each other
    const globalLayout = this.positionClustersGlobally(layoutedClusters);
    
    // Step 4: Create edges with optimized routing
    const optimizedEdges = this.createOptimizedEdges(
      globalLayout,
      graphEdges,
      c2Relationships,
      crossC1C2Relationships
    );

    return {
      graphNodes: globalLayout.graphNodes,
      c1Nodes: globalLayout.c1Nodes,
      c2Nodes: globalLayout.c2Nodes,
      edges: optimizedEdges,
    };
  }

  /**
   * Creates hierarchical clusters from the data
   */
  private createHierarchicalClusters(
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    graphNodes: GraphNode[]
  ) {
    const clusters = c1Outputs.map(c1 => {
      const c2Children = c2Subcategories.filter(c2 => c2.c1CategoryId === c1.id);
      const nodeChildren = graphNodes.filter(node => 
        c2Children.some(c2 => c2.nodeIds.includes(node.id))
      );

      return {
        c1Node: c1,
        c2Nodes: c2Children,
        graphNodes: nodeChildren,
        bounds: { width: 0, height: 0, x: 0, y: 0 }
      };
    });

    return clusters;
  }

  /**
   * Layout individual clusters using a force-directed approach within bounds
   */
  private layoutClusters(clusters: any[], graphEdges: GraphEdge[]) {
    return clusters.map(cluster => {
      // Create a sub-graph for this cluster
      const subGraph = new dagre.graphlib.Graph();
      subGraph.setDefaultEdgeLabel(() => ({}));
      subGraph.setGraph({ 
        rankdir: 'TB',  // Top to Bottom
        nodesep: this.config.nodeSpacing,
        ranksep: this.config.rankSpacing,
        marginx: this.config.clusterPadding,
        marginy: this.config.clusterPadding
      });

      // Add C1 node at the top
      subGraph.setNode(cluster.c1Node.id, {
        width: this.config.minimumNodeSize.width * 1.5,
        height: this.config.minimumNodeSize.height * 1.2
      });

      // Add C2 nodes in the middle tier
      cluster.c2Nodes.forEach((c2: any) => {
        subGraph.setNode(c2.id, {
          width: this.config.minimumNodeSize.width * 1.2,
          height: this.config.minimumNodeSize.height
        });
        // Connect C1 to C2
        subGraph.setEdge(cluster.c1Node.id, c2.id);
      });

      // Add graph nodes and organize them by C2 parent
      const nodesByC2 = new Map();
      cluster.c2Nodes.forEach((c2: any) => {
        nodesByC2.set(c2.id, cluster.graphNodes.filter((node: any) => 
          c2.nodeIds.includes(node.id)
        ));
      });

      // Layout graph nodes in a grid pattern under their C2 parents
      nodesByC2.forEach((nodes, c2Id) => {
        const nodesPerRow = Math.min(this.config.maximumNodesPerRank, Math.ceil(Math.sqrt(nodes.length)));
        
        nodes.forEach((node: any, index: number) => {
          subGraph.setNode(node.id, {
            width: this.config.minimumNodeSize.width,
            height: this.config.minimumNodeSize.height
          });
          // Connect C2 to graph node
          subGraph.setEdge(c2Id, node.id);
        });
      });

      // Add edges between graph nodes within this cluster
      const clusterNodeIds = new Set(cluster.graphNodes.map((n: any) => n.id));
      const intraClusterEdges = graphEdges.filter(edge => 
        clusterNodeIds.has(edge.source) && clusterNodeIds.has(edge.target)
      );
      
      intraClusterEdges.forEach(edge => {
        if (subGraph.hasNode(edge.source) && subGraph.hasNode(edge.target)) {
          subGraph.setEdge(edge.source, edge.target);
        }
      });

      // Apply layout
      dagre.layout(subGraph);

      // Extract positioned nodes
      const positionedC1 = {
        ...cluster.c1Node,
        position: this.getNodePosition(subGraph, cluster.c1Node.id)
      };

      const positionedC2Nodes = cluster.c2Nodes.map((c2: any) => ({
        ...c2,
        position: this.getNodePosition(subGraph, c2.id)
      }));

      const positionedGraphNodes = cluster.graphNodes.map((node: any) => ({
        ...node,
        position: this.getNodePosition(subGraph, node.id)
      }));

      // Calculate cluster bounds
      const allPositions = [
        positionedC1.position,
        ...positionedC2Nodes.map(n => n.position),
        ...positionedGraphNodes.map(n => n.position)
      ];

      const bounds = this.calculateBounds(allPositions);

      return {
        ...cluster,
        c1Node: positionedC1,
        c2Nodes: positionedC2Nodes,
        graphNodes: positionedGraphNodes,
        bounds
      };
    });
  }

  /**
   * Position clusters globally to minimize edge crossings and optimize space usage
   */
  private positionClustersGlobally(clusters: any[]) {
    // Sort clusters by size (larger clusters get positioned first)
    const sortedClusters = [...clusters].sort((a, b) => 
      (b.bounds.width * b.bounds.height) - (a.bounds.width * a.bounds.height)
    );

    // Use fewer clusters per row for better spread
    const clustersPerRow = Math.min(3, Math.ceil(Math.sqrt(sortedClusters.length)));
    let currentX = 0;
    let currentY = 0;
    let maxHeightInRow = 0;
    let clustersInCurrentRow = 0;

    const positionedClusters = sortedClusters.map((cluster, index) => {
      if (clustersInCurrentRow >= clustersPerRow) {
        // Move to next row
        currentX = 0;
        currentY += maxHeightInRow + this.config.clusterPadding * 2;
        maxHeightInRow = 0;
        clustersInCurrentRow = 0;
      }

      const offsetX = currentX - cluster.bounds.x;
      const offsetY = currentY - cluster.bounds.y;

      // Apply offset to all nodes in cluster
      const offsetC1Node = {
        ...cluster.c1Node,
        position: {
          x: cluster.c1Node.position.x + offsetX,
          y: cluster.c1Node.position.y + offsetY
        }
      };

      const offsetC2Nodes = cluster.c2Nodes.map((node: any) => ({
        ...node,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY
        }
      }));

      const offsetGraphNodes = cluster.graphNodes.map((node: any) => ({
        ...node,
        position: {
          x: node.position.x + offsetX,
          y: node.position.y + offsetY
        }
      }));

      // Update for next cluster
      currentX += cluster.bounds.width + this.config.clusterPadding * 2;
      maxHeightInRow = Math.max(maxHeightInRow, cluster.bounds.height);
      clustersInCurrentRow++;

      return {
        c1Node: offsetC1Node,
        c2Nodes: offsetC2Nodes,
        graphNodes: offsetGraphNodes
      };
    });

    // Flatten the results
    const allC1Nodes = positionedClusters.map(c => c.c1Node);
    const allC2Nodes = positionedClusters.flatMap(c => c.c2Nodes);
    const allGraphNodes = positionedClusters.flatMap(c => c.graphNodes);

    return {
      c1Nodes: allC1Nodes,
      c2Nodes: allC2Nodes,
      graphNodes: allGraphNodes
    };
  }

  /**
   * Create optimized edges with better routing to reduce crossings
   */
  private createOptimizedEdges(
    layout: any,
    graphEdges: GraphEdge[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ): GraphEdge[] {
    const c2NameToIdMap = new Map();
    layout.c2Nodes.forEach((c2: any) => {
      c2NameToIdMap.set(c2.c2Name, c2.id);
    });

    const edges: GraphEdge[] = [
      // Only include important original graph edges (filter out excessive connections)
      ...graphEdges.filter(edge => 
        !edge.id.includes('contains') || Math.random() > 0.7 // Randomly filter some containment edges to reduce clutter
      ),
      
      // Containment edges (C1 -> C2) - essential structure
      ...layout.c2Nodes.map((c2: any) => ({
        id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
        source: c2.c1CategoryId,
        target: c2.id,
        label: 'contains'
      })),
      
      // Only show containment edges for nodes that don't have many connections
      ...layout.c2Nodes.flatMap((c2: any) =>
        c2.nodeIds.slice(0, Math.min(5, c2.nodeIds.length)).map((nodeId: string) => ({
          id: `c2-${c2.id}-to-node-${nodeId}`,
          source: c2.id,
          target: nodeId,
          label: 'contains'
        }))
      ),
      
      // C2 relationships - important connections
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
      
      // Cross C1-C2 relationships - important cross-cluster connections
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

    return edges;
  }

  /**
   * Helper function to get node position from dagre graph
   */
  private getNodePosition(graph: dagre.graphlib.Graph, nodeId: string) {
    const node = graph.node(nodeId);
    return {
      x: node.x - node.width / 2,
      y: node.y - node.height / 2
    };
  }

  /**
   * Calculate bounding box for a set of positions
   */
  private calculateBounds(positions: Array<{ x: number; y: number }>) {
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);
    
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs) + this.config.minimumNodeSize.width,
      height: Math.max(...ys) - Math.min(...ys) + this.config.minimumNodeSize.height
    };
  }

  /**
   * Update layout configuration
   */
  updateConfig(newConfig: Partial<LayoutConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}