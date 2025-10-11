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
  ConnectionLineType,
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
          style={{ background: "#fcfcfc" }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: false,
            style: { strokeWidth: 2 },
          }}
          nodesDraggable={true}
          nodesConnectable={true}
          elementsSelectable={true}
          snapToGrid={true}
          snapGrid={[15, 15]}
          panOnScroll={true}
          selectionOnDrag={true}
          panOnDrag={[1]}
          selectNodesOnDrag={false}
        >
          <MiniMap
            zoomable
            pannable
            zoomStep={10}
            offsetScale={0.7}
            style={{
              backgroundColor: "white",
              width: 200,
              height: 120,
              borderRadius: 8,
              boxShadow: "0 2px 8px #0001",
              border: "1px solid #e5e7eb",
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
