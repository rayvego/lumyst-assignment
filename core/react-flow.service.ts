import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from "./types";

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
        data: { label: node.label },
        type: "default",
        style: {
          background: "#dbeafe",
          border: "2px solid #3b82f6",
          color: "#1e40af",
          borderRadius: "8px",
          padding: "12px",
          minWidth: "220px",
          fontSize: "14px",
        },
      })),
      // C1 category nodes
      ...c1Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: "default",
        style: {
          background: "#fef2f2",
          border: "3px solid #dc2626",
          color: "#991b1b",
          fontWeight: "bold",
          borderRadius: "8px",
          padding: "14px",
          minWidth: "240px",
          fontSize: "15px",
        },
      })),
      // C2 subcategory nodes
      ...c2Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: "default",
        style: {
          background: "#f0fdf4",
          border: "2px solid #16a34a",
          color: "#166534",
          borderRadius: "8px",
          padding: "12px",
          minWidth: "220px",
          fontSize: "14px",
        },
      })),
    ];

    // Enhanced edge configuration with better routing and styling
    const reactFlowEdges = edges.map((edge) => {
      // Determine edge type and styling based on relationship type
      let edgeType = "smoothstep"; // Default to smooth step for cleaner routing
      let animated = false;
      let style: any = {};
      let labelStyle: any = {
        fill: "#374151",
        fontWeight: "500",
        fontSize: "12px",
      };
      let markerEnd: any = undefined;

      if (edge.label === "contains") {
        // Hierarchical containment edges
        edgeType = "smoothstep";
        style = {
          stroke: "#9ca3af",
          strokeDasharray: "5,5",
          strokeWidth: 2,
          opacity: 0.6,
        };
        labelStyle = { fill: "#6b7280", fontWeight: "400", fontSize: "11px" };
      } else if (edge.id.startsWith("c2_relationship")) {
        // C2-C2 relationships 
        edgeType = "default"; // Default uses bezier curves
        style = {
          stroke: "#059669",
          strokeWidth: 2.5,
          opacity: 0.8,
        };
        markerEnd = {
          type: "arrowclosed",
          color: "#059669",
          width: 20,
          height: 20,
        };
      } else if (edge.id.startsWith("cross_c1_c2_rel")) {
        // Cross C1-C2 relationships - smooth bezier animation
        edgeType = "default";
        animated = true;
        style = {
          stroke: "#d97706",
          strokeWidth: 2.5,
          opacity: 0.8,
        };
        markerEnd = {
          type: "arrowclosed",
          color: "#d97706",
          width: 20,
          height: 20,
        };
        labelStyle = { fill: "#d97706", fontWeight: "600", fontSize: "12px" };
      } else {
        // Default edges
        edgeType = "smoothstep";
        style = {
          stroke: "#374151",
          strokeWidth: 2,
          opacity: 0.7,
        };
        markerEnd = {
          type: "arrowclosed",
          color: "#374151",
          width: 18,
          height: 18,
        };
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edgeType,
        animated,
        style,
        labelStyle,
        markerEnd,
        // Add pathfinding options to avoid node overlaps
        pathOptions: { offset: 20 },
      };
    });

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    };
  }
}
