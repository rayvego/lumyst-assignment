import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import { HierarchicalLayoutService, type LayoutNode } from './hierarchical-layout.service';
import { LayoutConfigService, type LayoutPreset } from './layout-config.service';

export interface LayoutAnalysis {
  nodeCount: number;
  edgeCount: number;
  maxDegree: number;
  avgDegree: number;
  clusterCount: number;
  maxLevels: number;
  complexity: 'low' | 'medium' | 'high' | 'very-high';
  recommendedPreset: LayoutPreset;
}

export interface LayoutMetrics {
  edgeCrossings: number;
  avgEdgeLength: number;
  nodeOverlaps: number;
  clusterSeparation: number;
  layoutDensity: number;
}

export class GraphLayoutManagerService {
  private hierarchicalLayoutService = new HierarchicalLayoutService();

  /**
   * Analyze the graph structure to recommend optimal layout
   */
  analyzeGraphStructure(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[]
  ): LayoutAnalysis {
    const totalNodes = graphNodes.length + c1Nodes.length + c2Nodes.length;
    const edgeCount = edges.length;
    
    // Calculate degree statistics
    const degreeMap = new Map<string, number>();
    edges.forEach(edge => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1);
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1);
    });
    
    const degrees = Array.from(degreeMap.values());
    const maxDegree = Math.max(...degrees, 0);
    const avgDegree = degrees.length > 0 ? degrees.reduce((a, b) => a + b, 0) / degrees.length : 0;
    
    // Estimate cluster count
    const c1Categories = new Set(c1Nodes.map(n => n.c1Category));
    const c2Categories = new Set(c2Nodes.map(n => n.c1CategoryId));
    const clusterCount = c1Categories.size + c2Categories.size;
    
    // Estimate complexity
    let complexity: LayoutAnalysis['complexity'] = 'low';
    if (totalNodes > 500 || edgeCount > 1000 || maxDegree > 20) {
      complexity = 'very-high';
    } else if (totalNodes > 200 || edgeCount > 400 || maxDegree > 10) {
      complexity = 'high';
    } else if (totalNodes > 50 || edgeCount > 100 || maxDegree > 5) {
      complexity = 'medium';
    }
    
    // Recommend layout preset
    let recommendedPreset: LayoutPreset = 'hierarchical';
    if (complexity === 'very-high') {
      recommendedPreset = clusterCount > 10 ? 'clustered' : 'compact';
    } else if (complexity === 'high') {
      recommendedPreset = 'clustered';
    } else if (complexity === 'low') {
      recommendedPreset = 'spacious';
    }
    
    return {
      nodeCount: totalNodes,
      edgeCount,
      maxDegree,
      avgDegree,
      clusterCount,
      maxLevels: 0, // Will be calculated after layout
      complexity,
      recommendedPreset
    };
  }

  /**
   * Apply the best layout algorithm based on graph characteristics
   */
  applyOptimalLayout(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[],
    preferredPreset?: LayoutPreset
  ): {
    nodes: LayoutNode[];
    boundingBox: { width: number; height: number };
    analysis: LayoutAnalysis;
    metrics: LayoutMetrics;
  } {
    // Analyze graph structure
    const analysis = this.analyzeGraphStructure(graphNodes, c1Nodes, c2Nodes, edges);
    
    // Use preferred preset or recommended one
    const preset = preferredPreset || analysis.recommendedPreset;
    const config = LayoutConfigService.getLayoutPreset(preset);
    
    // Apply performance optimizations for large graphs
    if (analysis.complexity === 'very-high') {
      const optimizedConfig = LayoutConfigService.getPerformanceOptimizedConfig(analysis.nodeCount);
      Object.assign(config, optimizedConfig);
    }
    
    // Apply hierarchical layout
    const layoutResult = this.hierarchicalLayoutService.arrangeGraphHierarchically(
      graphNodes,
      c1Nodes,
      c2Nodes,
      edges,
      config
    );
    
    // Update analysis with actual layout data
    analysis.maxLevels = Math.max(...layoutResult.nodes.map(n => n.level)) + 1;
    
    // Calculate layout metrics
    const metrics = this.calculateLayoutMetrics(layoutResult.nodes, edges);
    
    return {
      nodes: layoutResult.nodes,
      boundingBox: layoutResult.boundingBox,
      analysis,
      metrics
    };
  }

  /**
   * Calculate quality metrics for the layout
   */
  private calculateLayoutMetrics(nodes: LayoutNode[], edges: GraphEdge[]): LayoutMetrics {
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    
    // Count edge crossings (simplified estimation)
    let edgeCrossings = 0;
    const edgeLines: Array<{x1: number, y1: number, x2: number, y2: number}> = [];
    
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        edgeLines.push({
          x1: source.position.x,
          y1: source.position.y,
          x2: target.position.x,
          y2: target.position.y
        });
      }
    });
    
    // Count intersections between edge lines
    for (let i = 0; i < edgeLines.length; i++) {
      for (let j = i + 1; j < edgeLines.length; j++) {
        if (this.linesIntersect(edgeLines[i], edgeLines[j])) {
          edgeCrossings++;
        }
      }
    }
    
    // Calculate average edge length
    let totalEdgeLength = 0;
    let validEdges = 0;
    
    edges.forEach(edge => {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        const dx = target.position.x - source.position.x;
        const dy = target.position.y - source.position.y;
        totalEdgeLength += Math.sqrt(dx * dx + dy * dy);
        validEdges++;
      }
    });
    
    const avgEdgeLength = validEdges > 0 ? totalEdgeLength / validEdges : 0;
    
    // Count node overlaps
    let nodeOverlaps = 0;
    const nodeRadius = 30; // Approximate node size
    
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].position.x - nodes[i].position.x;
        const dy = nodes[j].position.y - nodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < nodeRadius * 2) {
          nodeOverlaps++;
        }
      }
    }
    
    // Calculate cluster separation (average distance between clusters)
    const clusters = new Map<string, LayoutNode[]>();
    nodes.forEach(node => {
      if (node.cluster) {
        if (!clusters.has(node.cluster)) {
          clusters.set(node.cluster, []);
        }
        clusters.get(node.cluster)!.push(node);
      }
    });
    
    let clusterSeparation = 0;
    const clusterCenters: Array<{x: number, y: number}> = [];
    
    clusters.forEach(clusterNodes => {
      const centerX = clusterNodes.reduce((sum, n) => sum + n.position.x, 0) / clusterNodes.length;
      const centerY = clusterNodes.reduce((sum, n) => sum + n.position.y, 0) / clusterNodes.length;
      clusterCenters.push({ x: centerX, y: centerY });
    });
    
    if (clusterCenters.length > 1) {
      let totalDistance = 0;
      let pairCount = 0;
      
      for (let i = 0; i < clusterCenters.length; i++) {
        for (let j = i + 1; j < clusterCenters.length; j++) {
          const dx = clusterCenters[j].x - clusterCenters[i].x;
          const dy = clusterCenters[j].y - clusterCenters[i].y;
          totalDistance += Math.sqrt(dx * dx + dy * dy);
          pairCount++;
        }
      }
      
      clusterSeparation = pairCount > 0 ? totalDistance / pairCount : 0;
    }
    
    // Calculate layout density
    const minX = Math.min(...nodes.map(n => n.position.x));
    const maxX = Math.max(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxY = Math.max(...nodes.map(n => n.position.y));
    
    const area = (maxX - minX) * (maxY - minY);
    const layoutDensity = area > 0 ? nodes.length / area : 0;
    
    return {
      edgeCrossings,
      avgEdgeLength,
      nodeOverlaps,
      clusterSeparation,
      layoutDensity
    };
  }

  /**
   * Check if two lines intersect
   */
  private linesIntersect(
    line1: {x1: number, y1: number, x2: number, y2: number},
    line2: {x1: number, y1: number, x2: number, y2: number}
  ): boolean {
    const det = (line1.x2 - line1.x1) * (line2.y2 - line2.y1) - (line2.x2 - line2.x1) * (line1.y2 - line1.y1);
    
    if (det === 0) {
      return false; // Lines are parallel
    }
    
    const lambda = ((line2.y2 - line2.y1) * (line2.x2 - line1.x1) + (line2.x1 - line2.x2) * (line2.y2 - line1.y1)) / det;
    const gamma = ((line1.y1 - line1.y2) * (line2.x2 - line1.x1) + (line1.x2 - line1.x1) * (line2.y2 - line1.y1)) / det;
    
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
  }

  /**
   * Provide layout improvement suggestions
   */
  suggestLayoutImprovements(
    analysis: LayoutAnalysis,
    metrics: LayoutMetrics
  ): string[] {
    const suggestions: string[] = [];
    
    if (metrics.edgeCrossings > analysis.nodeCount * 0.1) {
      suggestions.push("High edge crossings detected. Consider using 'hierarchical' preset or increasing level height.");
    }
    
    if (metrics.nodeOverlaps > 0) {
      suggestions.push("Node overlaps detected. Increase minimum node distance or use 'spacious' preset.");
    }
    
    if (metrics.avgEdgeLength > 300) {
      suggestions.push("Long edges detected. Consider reducing edge length multiplier or using 'compact' preset.");
    }
    
    if (analysis.complexity === 'very-high' && metrics.layoutDensity > 0.01) {
      suggestions.push("Very dense layout for large graph. Consider using 'clustered' preset with increased cluster spacing.");
    }
    
    if (metrics.clusterSeparation < 200 && analysis.clusterCount > 5) {
      suggestions.push("Clusters too close together. Increase cluster spacing for better visual separation.");
    }
    
    if (suggestions.length === 0) {
      suggestions.push("Layout quality looks good! Current configuration is working well for your graph structure.");
    }
    
    return suggestions;
  }

  /**
   * Export layout data for external analysis or saving
   */
  exportLayoutData(
    nodes: LayoutNode[],
    analysis: LayoutAnalysis,
    metrics: LayoutMetrics
  ): {
    layoutData: any;
    summary: string;
  } {
    const layoutData = {
      nodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        level: n.level,
        position: n.position,
        centrality: n.centrality,
        cluster: n.cluster
      })),
      analysis,
      metrics,
      timestamp: new Date().toISOString()
    };
    
    const summary = `
Layout Summary:
- Nodes: ${analysis.nodeCount}
- Edges: ${analysis.edgeCount}
- Levels: ${analysis.maxLevels}
- Clusters: ${analysis.clusterCount}
- Complexity: ${analysis.complexity}
- Edge Crossings: ${metrics.edgeCrossings}
- Node Overlaps: ${metrics.nodeOverlaps}
- Avg Edge Length: ${Math.round(metrics.avgEdgeLength)}px
    `.trim();
    
    return { layoutData, summary };
  }
}