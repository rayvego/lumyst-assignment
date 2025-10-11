"use client";

import { nodeTypes } from "@/components/react-flow-nodes";
import { useGraph } from "@/hooks/useGraph";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
  Panel,
  ReactFlowProvider,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
import GraphSearch from "@/components/graph-search";

export default function App() {
  const { nodes, edges, setEdges, setNodes } = useGraph();

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "white" }}>
      <ReactFlowProvider>
        {" "}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          style={{ background: "white" }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        >
          <MiniMap
            nodeStrokeWidth={100}
            zoomable
            pannable
            style={{
              backgroundColor: "white",
            }}
          />
        </ReactFlow>
        {/* Overlay search in top-left corner inside ReactFlow context */}
        <Panel
          position="top-left"
          style={{
            width: "50vw",
          }}
        >
          <GraphSearch />
        </Panel>
      </ReactFlowProvider>
    </div>
  );
}
