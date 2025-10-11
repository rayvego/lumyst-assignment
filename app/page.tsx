"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";

const graphFormatService = new GraphFormatService();
const reactFlowService = new ReactFlowService();

const {
  graphNodes,
  graphEdges,
  c1Output,
  c2Subcategories,
  c2Relationships,
  crossC1C2Relationships,
} = convertDataToGraphNodesAndEdges();

const layoutedData = graphFormatService.layoutCategoriesWithNodes(
  graphNodes,
  graphEdges,
  c1Output,
  c2Subcategories,
  c2Relationships,
  crossC1C2Relationships
);

const { nodes: initialNodes, edges: initialEdges } =
  reactFlowService.convertDataToReactFlowDataTypes(
    layoutedData.graphNodes,
    layoutedData.c1Nodes,
    layoutedData.c2Nodes,
    layoutedData.edges
  );

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

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
    <div style={{ width: "100vw", height: "100vh", background: "#fafafa" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{
          padding: 0.3,
          minZoom: 0.2,
          maxZoom: 1.5,
        }}
        minZoom={0.05}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: false,
          style: { strokeWidth: 2 },
        }}
        // Prevent node overlap during drag
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        // Better edge routing
        snapToGrid={true}
        snapGrid={[15, 15]}
        // Panning and zooming
        panOnScroll={true}
        selectionOnDrag={true}
        panOnDrag={[1, 2]} // Middle and right mouse button
        selectNodesOnDrag={false}
        // Styles
        style={{ background: "#fafafa" }}
        className="react-flow-custom"
      >
        {/* Background with dots pattern for better visual reference */}
        <Background color="#94a3b8" gap={20} size={1} />

        {/* Interactive controls */}
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          position="top-right"
        />

        {/* Mini map for navigation */}
        <MiniMap
          nodeColor={(node) => {
            // Color nodes in minimap based on type
            const style = node.style as any;
            return style?.border?.includes("dc2626")
              ? "#dc2626"
              : style?.border?.includes("16a34a")
              ? "#16a34a"
              : "#3b82f6";
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
          position="bottom-right"
          pannable
          zoomable
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
          }}
        />

        {/* Info panel */}
        <Panel
          position="top-left"
          style={{
            background: "white",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "4px",
              color: "#1f2937",
            }}
          >
            Graph Visualization
          </div>
          <div style={{ fontSize: "12px", color: "#6b7280" }}>
            Nodes: {nodes.length} | Edges: {edges.length}
          </div>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px" }}>
            Drag to pan • Scroll to zoom • Click nodes for details
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
