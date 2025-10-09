/**
 * Edge Optimization Utilities
 * Provides helper functions for reducing visual clutter in large graphs
 */

export interface EdgeBundleGroup {
  sourceId: string;
  targetId: string;
  edges: Array<{ id: string; label: string }>;
}

/**
 * Groups parallel edges (same source and target) for potential bundling
 */
export function groupParallelEdges(
  edges: Array<{ id: string; source: string; target: string; label: string }>
): EdgeBundleGroup[] {
  const edgeGroups = new Map<string, EdgeBundleGroup>();

  edges.forEach(edge => {
    const key = `${edge.source}->${edge.target}`;
    
    if (!edgeGroups.has(key)) {
      edgeGroups.set(key, {
        sourceId: edge.source,
        targetId: edge.target,
        edges: [],
      });
    }

    edgeGroups.get(key)!.edges.push({
      id: edge.id,
      label: edge.label,
    });
  });

  return Array.from(edgeGroups.values()).filter(group => group.edges.length > 1);
}

/**
 * Calculates edge importance score for filtering
 * Higher score = more important edge
 */
export function calculateEdgeImportance(
  edge: { id: string; source: string; target: string; label: string },
  nodeInDegree: Map<string, number>,
  nodeOutDegree: Map<string, number>
): number {
  let score = 0;

  // Containment edges are always important
  if (edge.label === 'contains') {
    return 100;
  }

  // Cross-category edges are important
  if (edge.id.startsWith('cross_c1_c2_rel')) {
    score += 50;
  }

  // Edges to/from high-degree nodes are less important (likely well-connected)
  const sourceOutDegree = nodeOutDegree.get(edge.source) || 0;
  const targetInDegree = nodeInDegree.get(edge.target) || 0;

  // Prefer edges between low-degree nodes (more specific relationships)
  score += Math.max(0, 20 - sourceOutDegree);
  score += Math.max(0, 20 - targetInDegree);

  // C2 relationship edges are moderately important
  if (edge.id.startsWith('c2_relationship')) {
    score += 30;
  }

  return score;
}

/**
 * Filters edges to reduce visual complexity
 * Keeps top N most important edges
 */
export function filterEdgesByImportance(
  edges: Array<{ id: string; source: string; target: string; label: string }>,
  maxEdges: number
): Array<{ id: string; source: string; target: string; label: string }> {
  // Calculate node degrees
  const inDegree = new Map<string, number>();
  const outDegree = new Map<string, number>();

  edges.forEach(edge => {
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    outDegree.set(edge.source, (outDegree.get(edge.source) || 0) + 1);
  });

  // Score and sort edges
  const scoredEdges = edges.map(edge => ({
    edge,
    score: calculateEdgeImportance(edge, inDegree, outDegree),
  }));

  scoredEdges.sort((a, b) => b.score - a.score);

  return scoredEdges.slice(0, maxEdges).map(item => item.edge);
}

/**
 * Detects and marks long-distance edges (crossing multiple layers)
 * These can be styled differently (e.g., more transparent)
 */
export function detectLongEdges(
  edges: Array<{ id: string; source: string; target: string }>,
  nodePositions: Map<string, { x: number; y: number }>
): Set<string> {
  const longEdges = new Set<string>();
  const threshold = 400; // Distance threshold for "long" edge

  edges.forEach(edge => {
    const sourcePos = nodePositions.get(edge.source);
    const targetPos = nodePositions.get(edge.target);

    if (sourcePos && targetPos) {
      const distance = Math.sqrt(
        Math.pow(targetPos.x - sourcePos.x, 2) +
        Math.pow(targetPos.y - sourcePos.y, 2)
      );

      if (distance > threshold) {
        longEdges.add(edge.id);
      }
    }
  });

  return longEdges;
}

/**
 * Suggests edge bundling routes for parallel edges
 * Returns control points for bezier curves
 */
export function calculateEdgeBundleRoute(
  sourcePos: { x: number; y: number },
  targetPos: { x: number; y: number },
  bundleIndex: number,
  totalInBundle: number
): { controlPoint1: { x: number; y: number }; controlPoint2: { x: number; y: number } } {
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;

  // Calculate perpendicular offset
  const dx = targetPos.x - sourcePos.x;
  const dy = targetPos.y - sourcePos.y;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length === 0) {
    return {
      controlPoint1: sourcePos,
      controlPoint2: targetPos,
    };
  }

  const perpX = -dy / length;
  const perpY = dx / length;

  // Spread bundles around the midpoint
  const spreadFactor = 40;
  const offset = (bundleIndex - totalInBundle / 2) * spreadFactor;

  return {
    controlPoint1: {
      x: midX + perpX * offset * 0.5,
      y: midY + perpY * offset * 0.5,
    },
    controlPoint2: {
      x: midX + perpX * offset,
      y: midY + perpY * offset,
    },
  };
}
