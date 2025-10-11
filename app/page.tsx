"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import BidirectionalEdge from "../components/bidirectional";
import { BidirectionalEdgeService } from "../core/bidirectional-service";

const edgeTypes = {
  bidirectional: BidirectionalEdge,
};

export default function App() {
  const graphFormatService = new GraphFormatService();
  const reactFlowService = new ReactFlowService();
  const bidirectionalEdgeService = new BidirectionalEdgeService();

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

  const processedEdges = bidirectionalEdgeService.processBidirectionalEdges(
    layoutedData.edges,
    initialEdges
  );

  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(processedEdges);

  const onNodesChange = useCallback(
    (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );
  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "white" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        minZoom={0.1}
        maxZoom={2}
        style={{ background: "white" }}
      />
    </div>
  );
}
