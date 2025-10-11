import { GraphNode, GraphEdge } from "./types";
import { ReactFlowEdge } from "./react-flow.service";

export const createAdjacencyMap = (
  graphEdges: GraphEdge[] | ReactFlowEdge[]
): Map<string, Set<string>> => {
  const adjacency: Map<string, Set<string>> = new Map();
  graphEdges.forEach(({ source, target }) => {
    if (!adjacency.has(source)) {
      adjacency.set(source, new Set<string>());
    }
    adjacency.get(source)!.add(target);
  });
  return adjacency;
};

export const getDescendants = (
  nodeId: string,
  adjacencyMap: Map<string, Set<string>>
): Set<string> => {
  const result = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = adjacencyMap.get(current) || new Set<string>();
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        stack.push(child);
      }
    }
  }
  return result;
};
