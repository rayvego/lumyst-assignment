import { GraphNode, GraphEdge } from "./types";

export const createGraphMap = (
  graphEdges: GraphEdge[]
) => {
  const adjacency: Map<string, Set<string>> = new Map();
  graphEdges.forEach(({ source, target }) => {
    if (!adjacency.has(source)) {
      adjacency.set(source, new Set<string>());
    }
    adjacency.get(source)!.add(target);
  });
};
