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

// Ensure '@xyflow/react' is installed or add type declarations
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
  options: Record<string, string> = {} // Changed 'unknown' to 'string'
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
    [graphEdges, graphNodes]
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
      {/* Only show panel for graphs with more than 4 nodes */}
      {nodes.length > 4 && (
        <Panel position="top-right" style={{ background: 'rgba(255,255,255,0.98)', borderRadius: 14, boxShadow: '0 2px 12px #0002', padding: 14, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', border: '1px solid #e5e7eb', minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#6366f1', marginBottom: 2, letterSpacing: 0.5 }}>Graph Tools</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontWeight: 500, fontSize: 14, color: '#6366f1', marginRight: 4 }}>Layout:</label>
            <select
              style={{ borderRadius: 7, border: '1px solid #a855f7', padding: '5px 12px', fontWeight: 600, color: '#a855f7', background: '#faf5ff', outline: 'none' }}
              onChange={e => onLayout({ direction: e.target.value as 'DOWN' | 'RIGHT' })}
              defaultValue="DOWN"
            >
              <option value="DOWN">⬇ Vertical</option>
              <option value="RIGHT">➡ Horizontal</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <label style={{ fontWeight: 500, fontSize: 14, color: '#6366f1' }}>Zoom:</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.01"
              defaultValue="1"
              style={{ flex: 1 }}
              onChange={e => {
                const zoom = parseFloat(e.target.value);
                const rf = document.querySelector('.react-flow__viewport');
                if (rf && rf.parentElement) {
                  rf.parentElement.style.transform = `scale(${zoom})`;
                }
              }}
            />
          </div>
          <button
            title="Full Page View"
            style={{
              background: 'linear-gradient(90deg, #f472b6 0%, #6366f1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '7px 18px',
              fontWeight: 600,
              fontSize: 15,
              boxShadow: '0 1px 4px #f472b633',
              cursor: 'pointer',
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'background 0.2s',
            }}
            onClick={() => {
              document.body.requestFullscreen?.();
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4"/></svg>
            Full Page
          </button>
        </Panel>
      )}
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