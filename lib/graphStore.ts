import { ReactFlowEdge, ReactFlowNode } from "@/core/react-flow.service";
import { create } from "zustand";

export interface GraphStore {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  adjacencyMap: Map<string, Set<string>>;
  setAdjacencyMap: (map: Map<string, Set<string>>) => void;
  setNodes: (
    nodes: ReactFlowNode[] | ((prevNodes: ReactFlowNode[]) => ReactFlowNode[])
  ) => void;
  setEdges: (
    edges: ReactFlowEdge[] | ((prevEdges: ReactFlowEdge[]) => ReactFlowEdge[])
  ) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  setNodes: (nodes) =>
    set((state) => ({
      nodes: typeof nodes === "function" ? nodes(state.nodes) : nodes,
    })),
  setEdges: (edges) =>
    set((state) => ({
      edges: typeof edges === "function" ? edges(state.edges) : edges,
    })),
  adjacencyMap: new Map(),
  setAdjacencyMap: (map: Map<string, Set<string>>) =>
    set({ adjacencyMap: map }),
}));
