// core/graph-arrangement-service.ts
import dagre from "dagre";
import type { Node, Edge } from "@xyflow/react";

export class GraphArrangementService {
  layoutGraph(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 120 }); 
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      g.setNode(node.id, { width: 200, height: 60 });
    });
    edges.forEach((edge) => g.setEdge(edge.source, edge.target));

    dagre.layout(g);

    const arrangedNodes = nodes.map((node, index) => {
      const position = g.node(node.id);
      return {
        ...node,
        position: {
          x: position.x - 100, 
          y: position.y - 30,
        },
        data: { label: (node.data as any)?.label ?? `Node ${index}` },
      };
    });

    return { nodes: arrangedNodes, edges };
  }
}

