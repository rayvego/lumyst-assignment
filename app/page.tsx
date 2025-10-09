"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Panel,
  MiniMap,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ElkDirection, ElkLayoutService } from "@/core/elk-layout.service";
import { convertDataToGraphNodesAndEdges } from "@/core/data/data-converter";
import { ReactFlowService } from "@/core/react-flow.service";



interface LargeGraphLayoutProps {
  graphNodes: Node[];
  graphEdges: Edge[];
}

const elkService = new ElkLayoutService();

function LayoutFlow({ graphNodes, graphEdges }: LargeGraphLayoutProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graphNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graphEdges);
  const { fitView } = useReactFlow();

  const initial = useMemo(() => ({ graphNodes, graphEdges }), [graphNodes, graphEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const runLayout = useCallback(
    async (direction: ElkDirection, useInitial = false) => {
      const ns = useInitial ? (initial.graphNodes ?? []) : (nodes ?? []);
      const es = useInitial ? (initial.graphEdges ?? []) : (edges ?? []);
      const { nodes: layoutedNodes, edges: layoutedEdges } = await elkService.layout(ns, es, {
        direction,
        spacing: { layer: 140, nodeNode: 90, edgeNode: 40, edgeEdge: 24 },
      });
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      requestAnimationFrame(() => fitView());
    },
    [nodes, edges, setNodes, setEdges, fitView, initial]
  );

  useLayoutEffect(() => {
    runLayout("DOWN", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run layout whenever incoming props change (e.g., after upload)
  useEffect(() => {
    setNodes(graphNodes);
    setEdges(graphEdges);
    runLayout("DOWN");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graphNodes, graphEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onConnect={onConnect}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
      proOptions={{ hideAttribution: true }}
      className="bg-white rounded-xl border border-gray-200 shadow-lg"
      connectionLineStyle={{ stroke: '#a855f7', strokeWidth: 2 }}
      defaultEdgeOptions={{ style: { stroke: '#6366f1', strokeWidth: 2 }, type: 'smoothstep', animated: true }}
    >
      <Panel position="top-right">
        <div className="flex gap-3 bg-white/80 rounded-lg shadow px-4 py-2 border border-gray-200">
          <button
            className="rounded-lg border border-blue-500 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 shadow transition-all duration-150"
            onClick={() => runLayout("DOWN")}
          >
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Vertical
            </span>
          </button>
          <button
            className="rounded-lg border border-purple-500 px-4 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 shadow transition-all duration-150"
            onClick={() => runLayout("RIGHT")}
          >
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Horizontal
            </span>
          </button>
        </div>
      </Panel>
      <MiniMap
        nodeColor={n => n.type === 'input' ? '#a7f3d0' : n.type === 'output' ? '#fca5a5' : '#818cf8'}
        nodeStrokeWidth={3}
        maskColor="rgba(168,85,247,0.08)"
        pannable
        zoomable
        className="rounded-lg border border-purple-200 shadow"
      />
      <Controls showInteractive={true} className="rounded-lg border border-gray-300 shadow bg-white/80" />
      <Background color="#f3f4f6" gap={24} />
    </ReactFlow>
  );
}


// Get graph data from data-converter and convert to React Flow format
const { graphNodes, graphEdges, c1Output, c2Subcategories } = convertDataToGraphNodesAndEdges();
const reactFlowService = new ReactFlowService();
const { nodes, edges } = reactFlowService.convertDataToReactFlowDataTypes(
  graphNodes,
  c1Output,
  c2Subcategories,
  graphEdges
);

export default function Page() {
  // Fullscreen state for the graph container
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const graphRef = React.useRef<HTMLDivElement>(null);

  // Fullscreen API handlers
  const handleFullscreen = () => {
    if (!isFullscreen && graphRef.current) {
      if (graphRef.current.requestFullscreen) {
        graphRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen change to update state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Reset zoom utility
  const resetZoom = () => {
    const viewport = document.querySelector('.react-flow__viewport');
    if (viewport && viewport.parentElement) {
      viewport.parentElement.style.transform = 'scale(1)';
    }
  };

  return (
    <div
      ref={graphRef}
      className={`fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-blue-50 to-purple-100 ${isFullscreen ? '' : 'min-h-screen'}`}
      style={{ width: '100vw', height: '100vh' }}
    >
      <header className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-tight">Graph Visualization Dashboard</h1>
        <div className="flex gap-3 items-center">
         
          <button
            className="ml-4 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold flex items-center gap-2 transition"
            onClick={handleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M20 8V4h-4M4 16v4h4m12-4v4h-4"/></svg>
            )}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 border border-white/30 text-white font-semibold flex items-center gap-2 transition"
            onClick={resetZoom}
            title="Reset Zoom"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3"/></svg>
            Reset Zoom
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        <ReactFlowProvider>
          <LayoutFlow graphNodes={nodes} graphEdges={edges} />
        </ReactFlowProvider>
      </main>
    </div>
  );
}