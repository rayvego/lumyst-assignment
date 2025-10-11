import dagre from "dagre";
import type {
  GraphNode,
  GraphEdge,
  C1Output,
  C2Subcategory,
  C2Relationship,
  CrossC1C2Relationship,
} from "./types";

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
    c2Subcategories.forEach((c2) => {
      c2NameToIdMap.set(c2.c2Name, c2.id);
    });
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Enhanced graph configuration for better spacing and clarity
    dagreGraph.setGraph({
      rankdir: "TB", // Top to Bottom layout
      align: "UL", // Align nodes to upper left
      nodesep: 150, // Horizontal spacing between nodes in the same rank
      edgesep: 80, // Spacing between edges
      ranksep: 200, // Vertical spacing between ranks/levels
      marginx: 50, // Horizontal margin
      marginy: 50, // Vertical margin
      ranker: "longest-path", // Use longest-path ranking for better hierarchical layout
      acyclicer: "greedy", // Handle cycles in the graph
    });

    // Add all nodes to dagre with different sizes based on type
    const allNodes = [
      ...graphNodes.map((node) => ({ ...node, nodeType: "graph" })),
      ...c1Outputs.map((c1) => ({ ...c1, nodeType: "c1" })),
      ...c2Subcategories.map((c2) => ({ ...c2, nodeType: "c2" })),
    ];

    // Assign node dimensions based on type for better visual hierarchy
    allNodes.forEach((node) => {
      let width = 220;
      let height = 80;

      if (node.nodeType === "c1") {
        width = 240;
        height = 100;
      } else if (node.nodeType === "c2") {
        width = 220;
        height = 90;
      }

      dagreGraph.setNode(node.id, { width, height });
    });

    // Add all edges to dagre with enhanced metadata for better routing
    const allEdges: GraphEdge[] = [
      ...graphEdges,
      // Edges from C1 to their C2 subcategories
      ...c2Subcategories.map((c2) => ({
        id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
        source: c2.c1CategoryId,
        target: c2.id,
        label: "contains",
      })),
      // Edges from C2 to their nodes
      ...c2Subcategories.flatMap((c2) =>
        c2.nodeIds.map((nodeId) => ({
          id: `c2-${c2.id}-to-node-${nodeId}`,
          source: c2.id,
          target: nodeId,
          label: "contains",
        }))
      ),
      // C2 relationships
      ...c2Relationships
        .map((rel) => {
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
            label: rel.label,
          };
        })
        .filter((edge): edge is GraphEdge => edge !== null),
      // Cross C1-C2 relationships (connect C2 nodes across different C1 categories)
      ...crossC1C2Relationships
        .map((rel) => {
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
            label: rel.label,
          };
        })
        .filter((edge): edge is GraphEdge => edge !== null),
    ];

    // Add edges with custom weight and configuration to optimize routing
    allEdges.forEach((edge) => {
      if (edge) {
        // Set edge weight based on type for better routing
        // Higher weight = prefer shorter path for hierarchical edges
        // Lower weight = allow longer path for cross-references
        const weight = edge.label === "contains" ? 10 : 1;
        const minlen = edge.label === "contains" ? 1 : 2; // Minimum edge length in ranks

        dagreGraph.setEdge(edge.source, edge.target, {
          weight,
          minlen,
          labeloffset: 10, // Offset for edge labels
          labelpos: "c", // Center position for labels
        });
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
