import { ReactFlowEdge } from "@/core/react-flow.service";
import { clsx, type ClassValue } from "clsx"
import { GraphEdge } from "dagre";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const getNodeColors = (nodeType: string) => {
  switch (nodeType) {
    case "class":
    case "interface":
      return {
        from: "#7c3aed", // purple-600
        to: "#5b21b6", // purple-800
        border: "#a78bfa", // purple-400
        handle: "#ddd6fe", // purple-200
        text: "#e9d5ff", // purple-200
      };
    case "method":
    case "function":
    case "constructor":
      return {
        from: "#f59e0b", // amber-500
        to: "#d97706", // amber-600
        border: "#fbbf24", // amber-400
        handle: "#fde68a", // amber-200
        text: "#fde68a", // amber-200
      };
    case "variable":
    case "property":
      return {
        from: "#ef4444", // red-500
        to: "#dc2626", // red-600
        border: "#f87171", // red-400
        handle: "#fecaca", // red-200
        text: "#fecaca", // red-200
      };
    case "file":
      return {
        from: "#10b981", // emerald-500
        to: "#059669", // emerald-600
        border: "#34d399", // emerald-400
        handle: "#a7f3d0", // emerald-200
        text: "#a7f3d0", // emerald-200
      };
    case "folder":
      return {
        from: "#0ea5e9", // sky-500
        to: "#0284c7", // sky-600
        border: "#38bdf8", // sky-400
        handle: "#bae6fd", // sky-200
        text: "#bae6fd", // sky-200
      };
    default:
      return {
        from: "#6b7280", // gray-500
        to: "#4b5563", // gray-600
        border: "#9ca3af", // gray-400
        handle: "#d1d5db", // gray-300
        text: "#d1d5db", // gray-300
      };
  }
};

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