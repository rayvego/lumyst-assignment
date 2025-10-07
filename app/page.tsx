"use client";

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import LargeGraphLayout from "@/components/large-graph-layout";
import { Repeat, Network, Loader2 } from "lucide-react";

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
  const [largeGraphView, setLargeGraphView] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const toggleView = async () => {
	setLoading(true);

	// simulate small delay (for smoother UX)
	await new Promise((resolve) => setTimeout(resolve, 600));

	setLargeGraphView((prev) => !prev);
	setLoading(false);
  };


  return (
	<div className="w-screen h-screen flex flex-col bg-gray-50">
	  {/* Header */}
	  <header className="flex items-center justify-between px-6 py-3 bg-white shadow-sm border-b">
		<div className="flex items-center gap-2">
		  <Network className="w-5 h-5 text-blue-600" />
		  <h1 className="text-lg font-semibold text-gray-800">
			Graph Visualization Dashboard
		  </h1>
		</div>

		<button
		  onClick={toggleView}
		  disabled={loading}
		  className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition 
		  ${
			loading
			  ? "bg-gray-400 cursor-not-allowed"
			  : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
		  }`}
		>
		  {loading ? (
			<>
			  <Loader2 className="w-4 h-4 animate-spin" />
			  <span>Loading...</span>
			</>
		  ) : (
			<>
			  <Repeat className="w-4 h-4" />
			  {largeGraphView ? "Switch to Layout View" : "Switch to Graph View"}
			</>
		  )}
		</button>
	  </header>

	  {/* Main Content */}
	  <main className="flex-1 overflow-hidden relative">
		{loading ? (
		  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm z-10">
			<Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
		  </div>
		) : largeGraphView ? (
		  <ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onConnect={onConnect}
			fitView
			minZoom={0.1}
			maxZoom={2}
			className="bg-white"
		  />
		) : (
		  <LargeGraphLayout graphNodes={nodes} graphEdges={edges} />
		)}
	  </main>
	</div>
  );
}
