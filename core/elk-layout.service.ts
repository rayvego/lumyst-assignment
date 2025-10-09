import ELK, { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk.bundled.js";
import type { Edge, Node } from "@xyflow/react";

export type ElkDirection = "DOWN" | "RIGHT";

export interface ElkLayoutOptions {
  direction?: ElkDirection;
  spacing?: {
    layer?: number; // spacing between layers
    nodeNode?: number; // spacing between nodes in same layer
    edgeNode?: number; // spacing between edges and nodes
    edgeEdge?: number; // spacing between edges
  };
}

const DEFAULT_OPTIONS: Required<ElkLayoutOptions> = {
  direction: "DOWN",
  spacing: {
    layer: 120,
    nodeNode: 80,
    edgeNode: 32,
    edgeEdge: 24,
  },
};

/**
 * ElkLayoutService
 * Performs hierarchical layout using ELK's layered algorithm.
 * Accepts React Flow nodes/edges and returns positioned copies.
 */
export class ElkLayoutService {
  private elk: InstanceType<typeof ELK>;

  constructor() {
    this.elk = new ELK();
  }

  async layout(
    nodes: Node[],
    edges: Edge[],
    options?: ElkLayoutOptions
  ): Promise<{ nodes: Node[]; edges: Edge[] }> {
    const resolved: Required<ElkLayoutOptions> = {
      ...DEFAULT_OPTIONS,
      ...options,
      spacing: { ...DEFAULT_OPTIONS.spacing, ...(options?.spacing ?? {}) },
    };

    const isHorizontal = resolved.direction === "RIGHT";

    const elkOptions: Record<string, string> = {
      "elk.algorithm": "layered",
      "elk.direction": resolved.direction,
      // Spacing and routing to reduce edge crossings and overlaps
      "elk.layered.spacing.nodeNodeBetweenLayers": String(resolved.spacing.layer),
      "elk.spacing.nodeNode": String(resolved.spacing.nodeNode),
      "elk.spacing.edgeNode": String(resolved.spacing.edgeNode),
      "elk.spacing.edgeEdge": String(resolved.spacing.edgeEdge),
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      "elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
      "elk.layered.layering.strategy": "LONGEST_PATH",
      "elk.layered.mergeEdges": "true",
      "elk.layered.mergeHierarchyCrossingEdges": "true",
      "elk.layered.spacing.edgeNodeBetweenLayers": "40",
      "elk.spacing.portPort": "8",
    };

    const estimateNodeWidth = (label: string): number => {
      const charWidth = 7.5; // average px per char
      const basePadding = 36; // left+right padding
      return Math.max(100, Math.min(360, label.length * charWidth + basePadding));
    };

    const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
      labels: edge.label ? [{ text: String(edge.label) }] : undefined,
    }));

    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions: elkOptions,
      children: nodes.map((node) => {
        const labelText = String((node.data as { label?: string } | undefined)?.label ?? node.id);
        const width = estimateNodeWidth(labelText);
        return {
          id: node.id,
          width,
          height: Math.max(40, (node.height as number) || 48),
          labels: [{ text: labelText }],
          layoutOptions: { "elk.nodeLabels.placement": "INSIDE" },
        
          targetPosition: isHorizontal ? "left" : "top",
         
          sourcePosition: isHorizontal ? "right" : "bottom",
        } as unknown as ElkNode;
      }),
      edges: elkEdges,
    };

    try {
      const layouted = await this.elk.layout(elkGraph);

      const layoutedNodes: Node[] = (layouted.children ?? []).map((n) => {
        const original = nodes.find((x) => x.id === n.id);
        return {
          ...(original ?? { id: n.id, data: { label: n.id }, type: "default" }),
          position: { x: n.x ?? 0, y: n.y ?? 0 },
        } as Node;
      });

      // prefer smoothstep for readability, keep any existing type
      const layoutedEdges: Edge[] = edges.map((e) => ({
        ...e,
        type: e.type ?? "smoothstep",
      }));

      return { nodes: layoutedNodes, edges: layoutedEdges };
    } catch (error) {
      console.error("ELK layout error", error);
      return { nodes, edges };
    }
  }
}