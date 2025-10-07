import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export class GraphFormatService {
  // IMPROVED: Increased spacing for better visibility
  private readonly LEVEL_HEIGHT = 500;  // Increased from 400
  private readonly C1_HORIZONTAL_GAP = 800;  // Increased from 600
  private readonly C2_HORIZONTAL_GAP = 500;  // Increased from 400
  private readonly NODE_HORIZONTAL_GAP = 320;  // Increased from 280
  private readonly NODE_VERTICAL_GAP = 240;  // Increased from 200
  
  // IMPROVED: Adjusted node sizes for better label visibility
  private readonly C1_WIDTH = 280;  // Increased from 240
  private readonly C1_HEIGHT = 120;  // Increased from 100
  private readonly C2_WIDTH = 240;  // Increased from 200
  private readonly C2_HEIGHT = 100;  // Increased from 80
  private readonly NODE_WIDTH = 180;  // Increased from 160
  private readonly NODE_HEIGHT = 70;  // Increased from 60

    layoutCategoriesWithNodes(
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ) {
    const c2NameToIdMap = new Map<string, string>();
    c2Subcategories.forEach(c2 => {
      c2NameToIdMap.set(c2.c2Name, c2.id);
    });

    // Build hierarchies
    const c1ToC2Map = new Map<string, C2Subcategory[]>();
    c2Subcategories.forEach(c2 => {
      if (!c1ToC2Map.has(c2.c1CategoryId)) {
        c1ToC2Map.set(c2.c1CategoryId, []);
      }
      c1ToC2Map.get(c2.c1CategoryId)!.push(c2);
    });

    const c2ToNodesMap = new Map<string, string[]>();
    c2Subcategories.forEach(c2 => {
      c2ToNodesMap.set(c2.id, c2.nodeIds);
    });

    // IMPROVED: Track nodes that belong to C2 categories
    const nodesInC2 = new Set<string>();
    c2Subcategories.forEach(c2 => {
      c2.nodeIds.forEach(nodeId => nodesInC2.add(nodeId));
    });

    // IMPROVED: Separate nodes into categorized and uncategorized
    const categorizedNodes = graphNodes.filter(n => nodesInC2.has(n.id));
    const uncategorizedNodes = graphNodes.filter(n => !nodesInC2.has(n.id));

    // Calculate cluster widths with improved spacing
    const c1ClusterWidths = new Map<string, number>();
    c1Outputs.forEach(c1 => {
      const c2Children = c1ToC2Map.get(c1.id) || [];
      let maxWidth = 0;
      
      c2Children.forEach(c2 => {
        const nodeIds = c2ToNodesMap.get(c2.id) || [];
        const nodesPerRow = Math.min(4, Math.ceil(Math.sqrt(nodeIds.length)));  // Reduced from 5 to 4
        const nodeClusterWidth = nodesPerRow * this.NODE_HORIZONTAL_GAP;
        maxWidth = Math.max(maxWidth, nodeClusterWidth);
      });
      
      const c2ClusterWidth = c2Children.length * this.C2_HORIZONTAL_GAP;
      const totalWidth = Math.max(maxWidth, c2ClusterWidth, 500);  // Increased minimum from 400
      c1ClusterWidths.set(c1.id, totalWidth);
    });

    const layoutNodes = new Map<string, LayoutNode>();
    
    // LEVEL 0: Position C1 nodes with improved spacing
    let currentX = 100;  // Start with left margin
    const c1Positions = new Map<string, number>();
    c1Outputs.forEach((c1) => {
      const clusterWidth = c1ClusterWidths.get(c1.id) || 500;
      const c1X = currentX + clusterWidth / 2;
      c1Positions.set(c1.id, c1X);
      layoutNodes.set(c1.id, { 
        id: c1.id, 
        x: c1X, 
        y: 100,  // Added top margin
        width: this.C1_WIDTH, 
        height: this.C1_HEIGHT, 
        level: 0 
      });
      currentX += clusterWidth + this.C1_HORIZONTAL_GAP;
    });

    // LEVEL 1: Position C2 nodes with improved spacing
    c1Outputs.forEach((c1) => {
      const c2Children = c1ToC2Map.get(c1.id) || [];
      const c1X = c1Positions.get(c1.id)!;
      if (c2Children.length === 0) return;
      
      const totalC2Width = (c2Children.length - 1) * this.C2_HORIZONTAL_GAP;
      const startX = c1X - totalC2Width / 2;
      
      c2Children.forEach((c2, idx) => {
        const c2X = startX + idx * this.C2_HORIZONTAL_GAP;
        layoutNodes.set(c2.id, { 
          id: c2.id, 
          x: c2X, 
          y: 100 + this.LEVEL_HEIGHT,  // Adjusted for top margin
          width: this.C2_WIDTH, 
          height: this.C2_HEIGHT, 
          level: 1 
        });
      });
    });

    // LEVEL 2: Position categorized leaf nodes with improved spacing
    c2Subcategories.forEach((c2) => {
      const nodeIds = c2ToNodesMap.get(c2.id) || [];
      const c2Node = layoutNodes.get(c2.id);
      if (!c2Node || nodeIds.length === 0) return;
      
      const nodesPerRow = Math.min(4, Math.ceil(Math.sqrt(nodeIds.length)));  // Reduced from 5
      const gridWidth = (nodesPerRow - 1) * this.NODE_HORIZONTAL_GAP;
      const startX = c2Node.x - gridWidth / 2;
      const startY = 100 + this.LEVEL_HEIGHT * 2;  // Adjusted for top margin
      
      nodeIds.forEach((nodeId, idx) => {
        const row = Math.floor(idx / nodesPerRow);
        const col = idx % nodesPerRow;
        layoutNodes.set(nodeId, { 
          id: nodeId, 
          x: startX + col * this.NODE_HORIZONTAL_GAP, 
          y: startY + row * this.NODE_VERTICAL_GAP, 
          width: this.NODE_WIDTH, 
          height: this.NODE_HEIGHT, 
          level: 2 
        });
      });
    });

    // IMPROVED: Handle uncategorized nodes in a dedicated area at the bottom
    if (uncategorizedNodes.length > 0) {
      let maxY = 0;
      layoutNodes.forEach(node => { 
        if (node.y + node.height > maxY) maxY = node.y + node.height; 
      });
      
      const startY = maxY + this.NODE_VERTICAL_GAP * 2;
      const nodesPerRow = 6;  // Reduced from 8 for better spacing
      const totalWidth = (nodesPerRow - 1) * this.NODE_HORIZONTAL_GAP;
      const startX = 100;  // Left-aligned with margin

      uncategorizedNodes.forEach((node, idx) => {
        const row = Math.floor(idx / nodesPerRow);
        const col = idx % nodesPerRow;
        layoutNodes.set(node.id, {
          id: node.id,
          x: startX + col * this.NODE_HORIZONTAL_GAP,
          y: startY + row * this.NODE_VERTICAL_GAP,
          width: this.NODE_WIDTH,
          height: this.NODE_HEIGHT,
          level: 3
        });
      });
    }

    // Apply force-directed layout with adjusted parameters
    this.applyAdvancedForceLayout(layoutNodes, 150);  // Increased iterations

    // Convert to positioned nodes
    const positionedGraphNodes = graphNodes.map(node => {
      const layoutNode = layoutNodes.get(node.id);
      return { 
        ...node, 
        position: layoutNode 
          ? { x: layoutNode.x - layoutNode.width / 2, y: layoutNode.y - layoutNode.height / 2 } 
          : { x: 0, y: 0 } 
      };
    });

    const positionedC1Nodes = c1Outputs.map(node => {
      const layoutNode = layoutNodes.get(node.id);
      return { 
        ...node, 
        position: layoutNode 
          ? { x: layoutNode.x - layoutNode.width / 2, y: layoutNode.y - layoutNode.height / 2 } 
          : { x: 0, y: 0 } 
      };
    });

    const positionedC2Nodes = c2Subcategories.map(node => {
      const layoutNode = layoutNodes.get(node.id);
      return { 
        ...node, 
        position: layoutNode 
          ? { x: layoutNode.x - layoutNode.width / 2, y: layoutNode.y - layoutNode.height / 2 } 
          : { x: 0, y: 0 } 
      };
    });

    // Build edge list
    const allEdges: GraphEdge[] = [];
    allEdges.push(
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
        return { id: rel.id, source: sourceId, target: targetId, label: rel.label };
      }).filter((edge): edge is GraphEdge => edge !== null),
      ...crossC1C2Relationships.map(rel => {
        const sourceId = c2NameToIdMap.get(rel.fromC2);
        const targetId = c2NameToIdMap.get(rel.toC2);
        if (!sourceId || !targetId) return null;
        return { id: rel.id, source: sourceId, target: targetId, label: rel.label };
      }).filter((edge): edge is GraphEdge => edge !== null)
    );

    return {
      graphNodes: positionedGraphNodes,
      c1Nodes: positionedC1Nodes,
      c2Nodes: positionedC2Nodes,
      edges: allEdges,
    };
  }

  // IMPROVED: Enhanced force layout with better parameters
  private applyAdvancedForceLayout(nodes: Map<string, LayoutNode>, iterations: number): void {
    const nodeArray = Array.from(nodes.values());
    const minDistance = 260;  // Increased from 220
    
    for (let iter = 0; iter < iterations; iter++) {
      const damping = 1 - (iter / iterations) * 0.5;
      
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const nodeA = nodeArray[i];
          const nodeB = nodeArray[j];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance && distance > 0) {
            const force = ((minDistance - distance) / distance) * damping;
            const fx = (dx / distance) * force * 2.5;  // Adjusted force
            const fy = (dy / distance) * force * 1.2;  // Adjusted force
            
            nodeA.x -= fx;
            nodeB.x += fx;
            
            if (nodeA.level === nodeB.level) {
              nodeA.y -= fy * 0.4;  // Increased from 0.3
              nodeB.y += fy * 0.4;
            }
          }
        }
      }
    }
    
    nodeArray.forEach(node => {
      nodes.set(node.id, node);
    });
  }
}