"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import { nodeTypes } from "@/components/react-flow-nodes";

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
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [tooltip, setTooltip] = useState<{ content: string; x: number; y: number } | null>(null);


  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback((event, node) => {
    const connectedEdges = edges.filter(edge => edge.source === node.id || edge.target === node.id);
    const connectedNodeIds = new Set(connectedEdges.flatMap(edge => [edge.source, edge.target]));
    
    setNodes(nodes.map(n => ({
        ...n,
        style: {
            ...n.style,
            opacity: connectedNodeIds.has(n.id) || n.id === node.id ? 1 : 0.2
        }
    })));

    setEdges(edges.map(e => ({
        ...e,
        style: {
            ...e.style,
            opacity: e.source === node.id || e.target === node.id ? 1 : 0.2
        }
    })));
  }, [nodes, edges, setNodes, setEdges]);

  const onPaneClick = () => {
    setNodes(nodes.map(n => ({
        ...n,
        style: {
            ...n.style,
            opacity: 1
        }
    })));
    setEdges(edges.map(e => ({
        ...e,
        style: {
            ...e.style,
            opacity: 1
        }
    })));
  }

  const onNodeMouseEnter: NodeMouseHandler = (event, node) => {
    if (node.data.code) {
        setTooltip({
            content: node.data.code,
            x: event.clientX,
            y: event.clientY,
        });
    }
  };

  const onNodeMouseLeave: NodeMouseHandler = () => {
    setTooltip(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#f0f0f0" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={onPaneClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        style={{ background: "#f0f0f0" }}
      />
      {tooltip && (
        <div
          style={{
            position: "absolute",
            left: tooltip.x + 15,
            top: tooltip.y + 15,
            background: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            maxWidth: "600px",
            maxHeight: "400px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            zIndex: 1000,
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          <pre><code>{tooltip.content}</code></pre>
        </div>
      )}
    </div>
  );
}