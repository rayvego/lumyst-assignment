"use client";

import { nodeTypes } from "@/components/react-flow-nodes";
import {
	addEdge,
	applyEdgeChanges,
	applyNodeChanges,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import {
	ReactFlowEdge,
	ReactFlowNode,
	ReactFlowService,
} from "../core/react-flow.service";

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

export default function App() {
  const [nodes,setNodes] = useState<ReactFlowNode[]>([]);
  const [edges,setEdges] = useState<ReactFlowEdge[]>([]);

  useEffect(() => {
    graphFormatService
      .layoutCategoriesWithElk(
        graphNodes,
        graphEdges,
        c1Output,
        c2Subcategories,
        c2Relationships,
        crossC1C2Relationships
      )
      .then((layoutedData) => {
        const { nodes: initialNodes, edges: initialEdges } =
          reactFlowService.convertDataToReactFlowDataTypes(
            layoutedData.graphNodes,
            layoutedData.c1Nodes,
            layoutedData.c2Nodes,
            layoutedData.edges
          );
        setEdges(initialEdges);
        setNodes(initialNodes);
      });
  }, []);

  const onNodesChange = useCallback(
    (changes: any) =>
      setNodes((nodesSnapshot) =>
        applyNodeChanges(changes, nodesSnapshot)
      ),
    []
  );
  const onEdgesChange = useCallback(
    (changes: any) =>
      setEdges((edgesSnapshot) =>
        applyEdgeChanges(changes, edgesSnapshot)
      ),
    []
  );
  const onConnect = useCallback(
    (params: any) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh", background: "white" }}>
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
      />
    </div>
  );
}
