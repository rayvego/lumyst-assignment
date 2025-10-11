import type { GraphEdge, GraphNode } from './types';

/**
 * Interface for enhanced edge with bidirectional support
 */
export interface BidirectionalEdge extends GraphEdge {
  isBidirectional: boolean;
  labelOffset?: number;
  labelPosition?: 'top' | 'bottom';
  highlightOnHover?: boolean;
}

/**
 * Interface for cursor position
 */
export interface CursorPosition {
  x: number;
  y: number;
}

/**
 * Interface for edge label positioning
 */
export interface EdgeLabelPosition {
  x: number;
  y: number;
  rotation?: number;
}

/**
 * Service for managing bidirectional edges and their labels
 * Handles detection, offset calculation, and cursor-based highlighting
 */
export class BidirectionalEdgeService {
  private readonly LABEL_HEIGHT = 20;
  private readonly LABEL_SPACING = 15;
  private readonly HIGHLIGHT_DISTANCE = 50;

  /**
   * Detects bidirectional edges in the graph
   * A bidirectional edge exists when there are two edges between the same nodes
   * in opposite directions
   */
  detectBidirectionalEdges(edges: GraphEdge[]): Map<string, BidirectionalEdge[]> {
    const bidirectionalMap = new Map<string, BidirectionalEdge[]>();
    const edgeMap = new Map<string, GraphEdge>();

    // First pass: group edges by node pairs
    edges.forEach(edge => {
      const key = this.createEdgeKey(edge.source, edge.target);
      const reverseKey = this.createEdgeKey(edge.target, edge.source);
      
      edgeMap.set(key, edge);
      
      // Check if there's a reverse edge
      if (edgeMap.has(reverseKey)) {
        const reverseEdge = edgeMap.get(reverseKey)!;
        const bidirectionalKey = this.createBidirectionalKey(edge.source, edge.target);
        
        if (!bidirectionalMap.has(bidirectionalKey)) {
          bidirectionalMap.set(bidirectionalKey, []);
        }
        
        // Add both edges as bidirectional
        bidirectionalMap.get(bidirectionalKey)!.push(
          { ...edge, isBidirectional: true },
          { ...reverseEdge, isBidirectional: true }
        );
      }
    });

    return bidirectionalMap;
  }

  /**
   * Calculates label offset for bidirectional edges to prevent overlap
   * Uses curved edge geometry to position labels along the curve
   */
  calculateLabelOffset(
    edge: BidirectionalEdge,
    nodes: GraphNode[],
    bidirectionalEdges: BidirectionalEdge[],
    edgeIndex: number
  ): number {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) {
      return 0;
    }

    // Calculate the distance between nodes
    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // For bidirectional edges, we need to offset labels to avoid overlap
    // Use the edge index to determine offset direction and magnitude
    const baseOffset = this.LABEL_HEIGHT + this.LABEL_SPACING;
    
    // Calculate offset based on edge index and curve direction
    let offset = 0;
    if (edgeIndex === 0) {
      // First edge (usually top curve) - offset upward
      offset = -baseOffset;
    } else if (edgeIndex === 1) {
      // Second edge (usually bottom curve) - offset downward
      offset = baseOffset;
    }

    // Adjust offset based on edge direction and label length
    const labelLength = edge.label.length * 6; // Approximate character width
    const labelOffsetFactor = Math.max(1, labelLength / 100);
    
    return offset * labelOffsetFactor;
  }

  /**
   * Applies label offsets to all bidirectional edges
   */
  applyLabelOffsets(
    edges: GraphEdge[],
    nodes: GraphNode[]
  ): BidirectionalEdge[] {
    const bidirectionalMap = this.detectBidirectionalEdges(edges);
    const processedEdges: BidirectionalEdge[] = [];

    // Process bidirectional edges first
    bidirectionalMap.forEach((bidirectionalEdges, key) => {
      bidirectionalEdges.forEach((edge, index) => {
        const offset = this.calculateLabelOffset(edge, nodes, bidirectionalEdges, index);
        const labelPosition = index === 0 ? 'top' : 'bottom';
        
        processedEdges.push({
          ...edge,
          labelOffset: offset,
          labelPosition,
          isBidirectional: true
        });
      });
    });

    // Add non-bidirectional edges
    edges.forEach(edge => {
      const key = this.createEdgeKey(edge.source, edge.target);
      const reverseKey = this.createEdgeKey(edge.target, edge.source);
      const bidirectionalKey = this.createBidirectionalKey(edge.source, edge.target);
      
      // Only add if not already processed as bidirectional
      if (!bidirectionalMap.has(bidirectionalKey) && 
          !bidirectionalMap.has(this.createBidirectionalKey(edge.target, edge.source))) {
        processedEdges.push({
          ...edge,
          isBidirectional: false,
          labelOffset: 0,
          labelPosition: 'top'
        });
      }
    });

    return processedEdges;
  }

  /**
   * Highlights labels near the cursor for better readability
   */
  highlightLabelsOnCursor(
    edges: BidirectionalEdge[],
    cursorPosition: CursorPosition,
    nodes: GraphNode[]
  ): BidirectionalEdge[] {
    return edges.map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) {
        return edge;
      }

      // Calculate edge midpoint
      const midX = (sourceNode.position.x + targetNode.position.x) / 2;
      const midY = (sourceNode.position.y + targetNode.position.y) / 2;
      
      // Apply label offset to get actual label position
      const labelY = midY + (edge.labelOffset || 0);
      
      // Calculate distance from cursor to label position
      const distance = Math.sqrt(
        Math.pow(cursorPosition.x - midX, 2) + 
        Math.pow(cursorPosition.y - labelY, 2)
      );

      return {
        ...edge,
        highlightOnHover: distance <= this.HIGHLIGHT_DISTANCE
      };
    });
  }

  /**
   * Calculates the position of a label along a curved edge
   */
  calculateCurvedLabelPosition(
    edge: BidirectionalEdge,
    nodes: GraphNode[],
    t: number = 0.5 // Position along curve (0 = start, 1 = end)
  ): EdgeLabelPosition {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) {
      return { x: 0, y: 0 };
    }

    const startX = sourceNode.position.x;
    const startY = sourceNode.position.y;
    const endX = targetNode.position.x;
    const endY = targetNode.position.y;

    // Calculate control points for curved edge
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offset for curve
    const controlOffset = distance * 0.3;
    
    // Determine curve direction based on edge index
    const curveDirection = edge.labelPosition === 'top' ? -1 : 1;
    const controlX = (startX + endX) / 2;
    const controlY = (startY + endY) / 2 + (curveDirection * controlOffset);

    // Calculate position along the curve using quadratic Bezier
    const x = Math.pow(1 - t, 2) * startX + 2 * (1 - t) * t * controlX + Math.pow(t, 2) * endX;
    const y = Math.pow(1 - t, 2) * startY + 2 * (1 - t) * t * controlY + Math.pow(t, 2) * endY;

    // Calculate rotation angle for label alignment
    const angle = Math.atan2(
      (2 * (1 - t) * (controlY - startY) + 2 * t * (endY - controlY)),
      (2 * (1 - t) * (controlX - startX) + 2 * t * (endX - controlX))
    );

    return {
      x: x + (edge.labelOffset || 0),
      y: y,
      rotation: angle
    };
  }

  /**
   * Creates a unique key for edge pairs
   */
  private createEdgeKey(source: string, target: string): string {
    return `${source}-${target}`;
  }

  /**
   * Creates a bidirectional key (order-independent)
   */
  private createBidirectionalKey(source: string, target: string): string {
    const [first, second] = [source, target].sort();
    return `${first}-${second}`;
  }

  /**
   * Gets all bidirectional edge pairs for a given node pair
   */
  getBidirectionalEdgePair(source: string, target: string, edges: GraphEdge[]): GraphEdge[] {
    return edges.filter(edge => 
      (edge.source === source && edge.target === target) ||
      (edge.source === target && edge.target === source)
    );
  }

  /**
   * Validates that bidirectional edges have proper label positioning
   */
  validateBidirectionalEdges(edges: BidirectionalEdge[]): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const bidirectionalMap = this.detectBidirectionalEdges(edges);

    bidirectionalMap.forEach((bidirectionalEdges, key) => {
      if (bidirectionalEdges.length !== 2) {
        issues.push(`Bidirectional edge pair ${key} should have exactly 2 edges, found ${bidirectionalEdges.length}`);
      }

      // Check for proper label positioning
      const hasTopLabel = bidirectionalEdges.some(e => e.labelPosition === 'top');
      const hasBottomLabel = bidirectionalEdges.some(e => e.labelPosition === 'bottom');
      
      if (!hasTopLabel || !hasBottomLabel) {
        issues.push(`Bidirectional edge pair ${key} missing proper label positioning`);
      }

      // Check for overlapping labels
      const offsets = bidirectionalEdges.map(e => e.labelOffset || 0);
      if (Math.abs(offsets[0] - offsets[1]) < this.LABEL_SPACING) {
        issues.push(`Bidirectional edge pair ${key} has overlapping labels`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
