import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export interface LayoutNode {
  id: string;
  label: string;
  type: 'graph' | 'c1' | 'c2';
  level: number;
  position: { x: number; y: number };
  dependencies: string[];
  dependents: string[];
  centrality: number;
  cluster?: string;
  originalData?: any;
}

export interface LayoutConfig {
  levelHeight: number;
  nodeSpacing: number;
  clusterSpacing: number;
  minimumNodeDistance: number;
  edgeLengthMultiplier: number;
  centralityWeight: number;
  forceDirectedIterations: number;
}

export class HierarchicalLayoutService {
  private defaultConfig: LayoutConfig = {
    levelHeight: 250,
    nodeSpacing: 180,
    clusterSpacing: 300,
    minimumNodeDistance: 120,
    edgeLengthMultiplier: 1.5,
    centralityWeight: 0.3,
    forceDirectedIterations: 100
  };

  /**
   * Main method to arrange graph nodes hierarchically
   */
  public arrangeGraphHierarchically(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[],
    config: Partial<LayoutConfig> = {}
  ): {
    nodes: LayoutNode[];
    boundingBox: { width: number; height: number };
  } {
    const layoutConfig = { ...this.defaultConfig, ...config };
    
    // Step 1: Convert to layout nodes and build dependency graph
    const layoutNodes = this.createLayoutNodes(graphNodes, c1Nodes, c2Nodes, edges);
    
    // Step 2: Calculate node centrality and importance
    this.calculateCentralityScores(layoutNodes, edges);
    
    // Step 3: Detect clusters and communities
    const clusters = this.detectClusters(layoutNodes, edges);
    
    // Step 4: Assign hierarchical levels
    this.assignHierarchicalLevels(layoutNodes, edges);
    
    // Step 5: Position nodes within levels
    this.positionNodesInLevels(layoutNodes, clusters, layoutConfig);
    
    // Step 6: Apply force-directed refinement
    this.applyForceDirectedRefinement(layoutNodes, edges, layoutConfig);
    
    // Step 7: Final optimization to reduce edge crossings
    this.optimizeEdgeCrossings(layoutNodes, edges);
    
    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(layoutNodes);
    
    return { nodes: layoutNodes, boundingBox };
  }

  /**
   * Convert different node types to unified layout nodes
   */
  private createLayoutNodes(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[]
  ): LayoutNode[] {
    const edgeMap = this.buildEdgeMap(edges);
    const layoutNodes: LayoutNode[] = [];

    // Convert graph nodes
    graphNodes.forEach(node => {
      const deps = edgeMap.outgoing.get(node.id) || [];
      const dependents = edgeMap.incoming.get(node.id) || [];
      
      layoutNodes.push({
        id: node.id,
        label: node.label,
        type: 'graph',
        level: 0,
        position: { x: 0, y: 0 },
        dependencies: deps,
        dependents: dependents,
        centrality: 0,
        originalData: node
      });
    });

    // Convert C1 nodes
    c1Nodes.forEach(node => {
      const deps = edgeMap.outgoing.get(node.id) || [];
      const dependents = edgeMap.incoming.get(node.id) || [];
      
      layoutNodes.push({
        id: node.id,
        label: node.label,
        type: 'c1',
        level: 0,
        position: { x: 0, y: 0 },
        dependencies: deps,
        dependents: dependents,
        centrality: 0,
        cluster: `c1_${node.c1Category}`,
        originalData: node
      });
    });

    // Convert C2 nodes
    c2Nodes.forEach(node => {
      const deps = edgeMap.outgoing.get(node.id) || [];
      const dependents = edgeMap.incoming.get(node.id) || [];
      
      layoutNodes.push({
        id: node.id,
        label: node.label,
        type: 'c2',
        level: 0,
        position: { x: 0, y: 0 },
        dependencies: deps,
        dependents: dependents,
        centrality: 0,
        cluster: `c2_${node.c1CategoryId}`,
        originalData: node
      });
    });

    return layoutNodes;
  }

  /**
   * Build edge maps for quick lookup
   */
  private buildEdgeMap(edges: GraphEdge[]): {
    outgoing: Map<string, string[]>;
    incoming: Map<string, string[]>;
  } {
    const outgoing = new Map<string, string[]>();
    const incoming = new Map<string, string[]>();

    edges.forEach(edge => {
      // Outgoing edges
      if (!outgoing.has(edge.source)) {
        outgoing.set(edge.source, []);
      }
      outgoing.get(edge.source)!.push(edge.target);

      // Incoming edges
      if (!incoming.has(edge.target)) {
        incoming.set(edge.target, []);
      }
      incoming.get(edge.target)!.push(edge.source);
    });

    return { outgoing, incoming };
  }

  /**
   * Calculate centrality scores for node importance
   */
  private calculateCentralityScores(nodes: LayoutNode[], edges: GraphEdge[]): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Calculate degree centrality (normalized)
    const maxDegree = Math.max(...nodes.map(n => n.dependencies.length + n.dependents.length));
    
    nodes.forEach(node => {
      const degree = node.dependencies.length + node.dependents.length;
      let centrality = maxDegree > 0 ? degree / maxDegree : 0;
      
      // Boost centrality for nodes with many unique connections
      const uniqueConnections = new Set([...node.dependencies, ...node.dependents]).size;
      centrality += (uniqueConnections * 0.1);
      
      // Boost centrality for C1 nodes (they're architectural components)
      if (node.type === 'c1') {
        centrality += 0.2;
      }
      
      node.centrality = Math.min(centrality, 1.0);
    });
  }

  /**
   * Detect clusters using node relationships
   */
  private detectClusters(nodes: LayoutNode[], edges: GraphEdge[]): Map<string, LayoutNode[]> {
    const clusters = new Map<string, LayoutNode[]>();
    
    // Group by existing cluster assignments (C1/C2 categories)
    nodes.forEach(node => {
      if (node.cluster) {
        if (!clusters.has(node.cluster)) {
          clusters.set(node.cluster, []);
        }
        clusters.get(node.cluster)!.push(node);
      }
    });
    
    // Group remaining nodes by strong connectivity
    const unclusteredNodes = nodes.filter(n => !n.cluster);
    const visited = new Set<string>();
    
    unclusteredNodes.forEach(node => {
      if (visited.has(node.id)) return;
      
      const clusterNodes = this.findConnectedComponent(node, unclusteredNodes, edges, visited);
      if (clusterNodes.length > 1) {
        const clusterId = `auto_cluster_${clusters.size}`;
        clusterNodes.forEach(n => n.cluster = clusterId);
        clusters.set(clusterId, clusterNodes);
      }
    });
    
    return clusters;
  }

  /**
   * Find connected component using DFS
   */
  private findConnectedComponent(
    startNode: LayoutNode,
    availableNodes: LayoutNode[],
    edges: GraphEdge[],
    visited: Set<string>
  ): LayoutNode[] {
    const component: LayoutNode[] = [];
    const nodeMap = new Map(availableNodes.map(n => [n.id, n]));
    const stack = [startNode];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current.id)) continue;
      
      visited.add(current.id);
      component.push(current);
      
      // Add connected nodes to stack
      [...current.dependencies, ...current.dependents].forEach(connectedId => {
        const connectedNode = nodeMap.get(connectedId);
        if (connectedNode && !visited.has(connectedId)) {
          stack.push(connectedNode);
        }
      });
    }
    
    return component;
  }

  /**
   * Assign hierarchical levels using topological sorting with refinements
   */
  private assignHierarchicalLevels(nodes: LayoutNode[], edges: GraphEdge[]): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    
    // Initialize in-degrees
    nodes.forEach(node => {
      inDegree.set(node.id, node.dependents.length);
    });
    
    // Topological sort with level assignment
    const queue: LayoutNode[] = [];
    let currentLevel = 0;
    
    // Start with nodes having no dependencies (level 0)
    nodes.filter(n => inDegree.get(n.id) === 0).forEach(n => {
      n.level = currentLevel;
      queue.push(n);
    });
    
    while (queue.length > 0) {
      const levelSize = queue.length;
      const nextLevelNodes: LayoutNode[] = [];
      
      // Process all nodes at current level
      for (let i = 0; i < levelSize; i++) {
        const node = queue.shift()!;
        
        // Update dependencies' in-degrees
        node.dependencies.forEach(depId => {
          const depNode = nodeMap.get(depId);
          if (depNode) {
            const newInDegree = inDegree.get(depId)! - 1;
            inDegree.set(depId, newInDegree);
            
            if (newInDegree === 0) {
              depNode.level = currentLevel + 1;
              nextLevelNodes.push(depNode);
            }
          }
        });
      }
      
      // Add next level nodes to queue
      nextLevelNodes.forEach(n => queue.push(n));
      currentLevel++;
    }
    
    // Handle any remaining nodes (cycles) by assigning them to appropriate levels
    const unassignedNodes = nodes.filter(n => n.level === 0 && inDegree.get(n.id)! > 0);
    this.handleCyclicNodes(unassignedNodes, nodeMap, currentLevel);
  }

  /**
   * Handle nodes that are part of cycles
   */
  private handleCyclicNodes(
    cyclicNodes: LayoutNode[],
    nodeMap: Map<string, LayoutNode>,
    startLevel: number
  ): void {
    cyclicNodes.forEach((node, index) => {
      // Assign level based on the maximum level of its dependencies
      let maxDepLevel = -1;
      node.dependents.forEach(depId => {
        const depNode = nodeMap.get(depId);
        if (depNode && depNode.level > maxDepLevel) {
          maxDepLevel = depNode.level;
        }
      });
      
      node.level = Math.max(maxDepLevel + 1, startLevel + Math.floor(index / 10));
    });
  }

  /**
   * Position nodes within their assigned levels
   */
  private positionNodesInLevels(
    nodes: LayoutNode[],
    clusters: Map<string, LayoutNode[]>,
    config: LayoutConfig
  ): void {
    // Group nodes by level
    const levelGroups = new Map<number, LayoutNode[]>();
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });
    
    // Position each level
    levelGroups.forEach((levelNodes, level) => {
      this.positionNodesInSingleLevel(levelNodes, level, clusters, config);
    });
  }

  /**
   * Position nodes within a single level
   */
  private positionNodesInSingleLevel(
    levelNodes: LayoutNode[],
    level: number,
    clusters: Map<string, LayoutNode[]>,
    config: LayoutConfig
  ): void {
    const y = level * config.levelHeight;
    
    // Group nodes by cluster
    const clusterGroups = new Map<string, LayoutNode[]>();
    const unclusteredNodes: LayoutNode[] = [];
    
    levelNodes.forEach(node => {
      if (node.cluster) {
        if (!clusterGroups.has(node.cluster)) {
          clusterGroups.set(node.cluster, []);
        }
        clusterGroups.get(node.cluster)!.push(node);
      } else {
        unclusteredNodes.push(node);
      }
    });
    
    // Sort clusters by importance (centrality)
    const sortedClusters = Array.from(clusterGroups.entries()).sort((a, b) => {
      const avgCentralityA = a[1].reduce((sum, n) => sum + n.centrality, 0) / a[1].length;
      const avgCentralityB = b[1].reduce((sum, n) => sum + n.centrality, 0) / b[1].length;
      return avgCentralityB - avgCentralityA;
    });
    
    // Sort unclustered nodes by centrality
    unclusteredNodes.sort((a, b) => b.centrality - a.centrality);
    
    let currentX = 0;
    
    // Position clustered nodes
    sortedClusters.forEach(([clusterId, clusterNodes]) => {
      const clusterWidth = this.positionCluster(clusterNodes, currentX, y, config);
      currentX += clusterWidth + config.clusterSpacing;
    });
    
    // Position unclustered nodes with extra spacing
    if (unclusteredNodes.length > 0) {
      this.positionNodesHorizontally(unclusteredNodes, currentX, y, config.nodeSpacing * 1.3);
    }
  }

  /**
   * Position nodes within a cluster
   */
  private positionCluster(
    clusterNodes: LayoutNode[],
    startX: number,
    y: number,
    config: LayoutConfig
  ): number {
    // Sort by centrality (most important in center)
    clusterNodes.sort((a, b) => b.centrality - a.centrality);
    
    if (clusterNodes.length === 1) {
      clusterNodes[0].position = { x: startX, y };
      return config.nodeSpacing;
    }
    
    // Use circular arrangement for clusters with many nodes
    if (clusterNodes.length > 6) {
      return this.arrangeNodesInCircle(clusterNodes, startX, y, config);
    } else {
      // Linear arrangement for smaller clusters
      return this.positionNodesHorizontally(clusterNodes, startX, y, config.nodeSpacing);
    }
  }

  /**
   * Arrange nodes in a circular pattern
   */
  private arrangeNodesInCircle(
    nodes: LayoutNode[],
    centerX: number,
    centerY: number,
    config: LayoutConfig
  ): number {
    const radius = Math.max(config.nodeSpacing * 1.5, nodes.length * 20);
    const angleStep = (2 * Math.PI) / nodes.length;
    
    nodes.forEach((node, index) => {
      const angle = index * angleStep;
      node.position = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    
    return radius * 2.2;
  }

  /**
   * Position nodes horizontally in a line
   */
  private positionNodesHorizontally(
    nodes: LayoutNode[],
    startX: number,
    y: number,
    spacing: number
  ): number {
    nodes.forEach((node, index) => {
      node.position = {
        x: startX + index * spacing,
        y: y
      };
    });
    
    return nodes.length * spacing;
  }

  /**
   * Apply force-directed refinement to improve layout
   */
  private applyForceDirectedRefinement(
    nodes: LayoutNode[],
    edges: GraphEdge[],
    config: LayoutConfig
  ): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    for (let iteration = 0; iteration < config.forceDirectedIterations; iteration++) {
      const forces = new Map<string, { x: number; y: number }>();
      
      // Initialize forces
      nodes.forEach(node => {
        forces.set(node.id, { x: 0, y: 0 });
      });
      
      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          const dx = nodeB.position.x - nodeA.position.x;
          const dy = nodeB.position.y - nodeA.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < config.minimumNodeDistance * 4) {
            const force = config.minimumNodeDistance * config.minimumNodeDistance / (distance * distance);
            const fx = (dx / distance) * force * 1.5; // Increased repulsion force
            const fy = (dy / distance) * force * 1.5;
            
            forces.get(nodeA.id)!.x -= fx;
            forces.get(nodeA.id)!.y -= fy;
            forces.get(nodeB.id)!.x += fx;
            forces.get(nodeB.id)!.y += fy;
          }
        }
      }
      
      // Attractive forces for connected nodes
      edges.forEach(edge => {
        const sourceNode = nodeMap.get(edge.source);
        const targetNode = nodeMap.get(edge.target);
        
        if (sourceNode && targetNode) {
          const dx = targetNode.position.x - sourceNode.position.x;
          const dy = targetNode.position.y - sourceNode.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const optimalDistance = config.nodeSpacing * config.edgeLengthMultiplier;
            const force = (distance - optimalDistance) * 0.1;
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;
            
            forces.get(sourceNode.id)!.x += fx;
            forces.get(sourceNode.id)!.y += fy;
            forces.get(targetNode.id)!.x -= fx;
            forces.get(targetNode.id)!.y -= fy;
          }
        }
      });
      
      // Apply forces with damping
      const damping = 0.1 * (1 - iteration / config.forceDirectedIterations);
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        node.position.x += force.x * damping;
        node.position.y += force.y * damping;
      });
    }
  }

  /**
   * Optimize to reduce edge crossings
   */
  private optimizeEdgeCrossings(nodes: LayoutNode[], edges: GraphEdge[]): void {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const levelGroups = new Map<number, LayoutNode[]>();
    
    // Group nodes by level
    nodes.forEach(node => {
      if (!levelGroups.has(node.level)) {
        levelGroups.set(node.level, []);
      }
      levelGroups.get(node.level)!.push(node);
    });
    
    // Apply barycenter heuristic to reduce crossings
    const levels = Array.from(levelGroups.keys()).sort((a, b) => a - b);
    
    for (let i = 0; i < 3; i++) { // Multiple passes
      levels.forEach(level => {
        const levelNodes = levelGroups.get(level)!;
        if (levelNodes.length <= 1) return;
        
        // Calculate barycenter for each node
        const barycenters = levelNodes.map(node => {
          let barycenter = 0;
          let connectedCount = 0;
          
          [...node.dependencies, ...node.dependents].forEach(connectedId => {
            const connectedNode = nodeMap.get(connectedId);
            if (connectedNode && connectedNode.level !== level) {
              barycenter += connectedNode.position.x;
              connectedCount++;
            }
          });
          
          return {
            node,
            barycenter: connectedCount > 0 ? barycenter / connectedCount : node.position.x
          };
        });
        
        // Sort by barycenter and update positions
        barycenters.sort((a, b) => a.barycenter - b.barycenter);
        barycenters.forEach((item, index) => {
          item.node.position.x = index * 180; // Increased spacing
        });
      });
    }
  }

  /**
   * Calculate the bounding box of all nodes
   */
  private calculateBoundingBox(nodes: LayoutNode[]): { width: number; height: number } {
    if (nodes.length === 0) return { width: 0, height: 0 };
    
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    
    nodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    });
    
    // Add padding
    const padding = 100;
    return {
      width: (maxX - minX) + padding * 2,
      height: (maxY - minY) + padding * 2
    };
  }

  /**
   * Convert layout nodes back to the format expected by ReactFlow
   */
  public convertToReactFlowFormat(layoutNodes: LayoutNode[]): {
    graphNodes: GraphNode[];
    c1Nodes: C1Output[];
    c2Nodes: C2Subcategory[];
  } {
    const graphNodes: GraphNode[] = [];
    const c1Nodes: C1Output[] = [];
    const c2Nodes: C2Subcategory[] = [];
    
    layoutNodes.forEach(layoutNode => {
      const position = layoutNode.position;
      
      switch (layoutNode.type) {
        case 'graph':
          graphNodes.push({
            id: layoutNode.id,
            label: layoutNode.label,
            position: position
          });
          break;
          
        case 'c1':
          c1Nodes.push({
            ...layoutNode.originalData,
            position: position
          });
          break;
          
        case 'c2':
          c2Nodes.push({
            ...layoutNode.originalData,
            position: position
          });
          break;
      }
    });
    
    return { graphNodes, c1Nodes, c2Nodes };
  }
}