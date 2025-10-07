"use client";

import React, { useCallback, useLayoutEffect } from "react";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";

import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";

import "@xyflow/react/dist/style.css";

interface LargeGraphLayoutProps {
    graphNodes: Node[],
    graphEdges: Edge[]
}

const elk = new ELK();

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "80",
};
const getLayoutedElements = async (
  nodes: Node[],
  edges: Edge[],
  options: Record<string, any> = {}
): Promise<{ nodes: Node[]; edges: Edge[] }> => {
  const isHorizontal = options?.["elk.direction"] === "RIGHT";

  const estimateNodeWidth = (label: string): number => {
    const charWidth = 8;
    const basePadding = 40;
    return Math.max(80, label.length * charWidth + basePadding);
  };

   const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
    }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node) => {
      const labelText = String(node.data?.label ?? node.id);
      const dynamicWidth = estimateNodeWidth(labelText);

      return {
        ...node,
        labels: [{ text: labelText }],
        layoutOptions: { "elk.nodeLabels.placement": "INSIDE" },
        targetPosition: isHorizontal ? "left" : "top",
        sourcePosition: isHorizontal ? "right" : "bottom",
        width: dynamicWidth,
        height: 50,
      };
    }),
    edges: elkEdges,
  };

  try {
    const layoutedGraph = await elk.layout(graph);
    
    const layoutedNodes = layoutedGraph.children?.map((node) => ({
          ...node,
          position: {
            x: node.x ?? 0,
            y: node.y ?? 0,
          },
          id: node.id,
          data: { label: node.labels?.[0]?.text ?? node.id },
          type: "default",
    })) ?? [];


    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        type: 'smoothstep', 
    }));

    return {
      nodes: layoutedNodes,
      edges: layoutedEdges,
    };
  } catch (err) {
    console.error("ELK layout error:", err);
    return { nodes, edges };
  }
};

const LayoutFlow: React.FC<LargeGraphLayoutProps> = ({ graphNodes, graphEdges }) => {
  
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graphEdges);

  const { fitView } = useReactFlow();

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const initialElements = React.useMemo(
    () => ({ graphNodes, graphEdges }),
    []
  );

  const onLayout = useCallback(
    ({
      direction,
      useInitialNodes = false,
    }: {
      direction: "DOWN" | "RIGHT";
      useInitialNodes?: boolean;
    }) => {
      const opts = { "elk.direction": direction, ...elkOptions };
      const ns = useInitialNodes ? initialElements.graphNodes : nodes;
      const es = useInitialNodes ? initialElements.graphEdges : edges;

      getLayoutedElements(ns, es, opts).then(
        ({ nodes: layoutedNodes, edges: layoutedEdges }) => {
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);
          requestAnimationFrame(() => fitView());
        }
      );
    },
    [setNodes, setEdges, fitView, nodes, edges, initialElements]
  );

  useLayoutEffect(() => {
    const opts = { "elk.direction": "DOWN", ...elkOptions };

    getLayoutedElements(
      initialElements.graphNodes,
      initialElements.graphEdges,
      opts
    ).then(({ nodes: layoutedNodes, edges: layoutedEdges }) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      requestAnimationFrame(() => fitView());
    });
  }, [setNodes, setEdges, fitView, initialElements]); // Run only on mount


  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    >
      <Panel position="top-right" style={{ display: "flex", gap: "8px" }}>
        <button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: "DOWN" })}
        >
          Vertical Layout
        </button>
        <button
          className="xy-theme__button"
          onClick={() => onLayout({ direction: "RIGHT" })}
        >
          Horizontal Layout
        </button>
      </Panel>
      <Background />
    </ReactFlow>
  );
};


const LargeGraphLayout: React.FC<LargeGraphLayoutProps> = ({ graphNodes, graphEdges }) => (
  <div style={{ width: "100%", height: "100vh" }}>
    <ReactFlowProvider>
      <LayoutFlow 
        graphNodes={graphNodes}
        graphEdges={graphEdges} 
      />
    </ReactFlowProvider>
  </div>
);

export default LargeGraphLayout;
