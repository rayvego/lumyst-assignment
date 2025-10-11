"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, type NodeChange, type EdgeChange, type Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useMemo } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import { createSampleBidirectionalGraph } from "../core/sample-bidirectional-graph";
import { BidirectionalEdge, EnhancedBidirectionalEdge } from "../components/bidirectional-edge";
import type { BidirectionalReactFlowEdge, CustomReactFlowNode } from "../core/react-flow-types";

const graphFormatService = new GraphFormatService();
const reactFlowService = new ReactFlowService();

// Use sample bidirectional graph for demonstration
const { nodes: sampleNodes, edges: sampleEdges } = createSampleBidirectionalGraph();

// Define edge types for custom bidirectional edges
const edgeTypes = {
	bidirectional: BidirectionalEdge,
	enhancedBidirectional: EnhancedBidirectionalEdge,
};

export default function App() {
	const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
	const [useSampleGraph, setUseSampleGraph] = useState(true);

	// Get initial data based on toggle (without cursor position dependency)
	const initialData = useMemo(() => {
		if (useSampleGraph) {
			return reactFlowService.convertDataToReactFlowDataTypes(
				sampleNodes,
				[],
				[],
				sampleEdges
			);
		} else {
			const {
				graphNodes,
				graphEdges,
				c1Output,
				c2Subcategories,
				c2Relationships,
				crossC1C2Relationships
			} = convertDataToGraphNodesAndEdges();

			const layoutedData = graphFormatService.layoutCategoriesWithNodes(
				graphNodes,
				graphEdges,
				c1Output,
				c2Subcategories,
				c2Relationships,
				crossC1C2Relationships
			);

			return reactFlowService.convertDataToReactFlowDataTypes(
				layoutedData.graphNodes,
				layoutedData.c1Nodes,
				layoutedData.c2Nodes,
				layoutedData.edges
			);
		}
	}, [useSampleGraph]);

	const [nodes, setNodes] = useState<CustomReactFlowNode[]>(initialData.nodes as CustomReactFlowNode[]);
	const [edges, setEdges] = useState<BidirectionalReactFlowEdge[]>(initialData.edges as BidirectionalReactFlowEdge[]);

	// Update edges with cursor highlighting when cursor position changes
	const processedEdges = useMemo(() => {
		if (useSampleGraph) {
			const processedData = reactFlowService.convertDataToReactFlowDataTypes(
				sampleNodes,
				[],
				[],
				sampleEdges,
				cursorPosition
			);
			
			return processedData.edges as BidirectionalReactFlowEdge[];
		} else {
			const {
				graphNodes,
				graphEdges,
				c1Output,
				c2Subcategories,
				c2Relationships,
				crossC1C2Relationships
			} = convertDataToGraphNodesAndEdges();

			const layoutedData = graphFormatService.layoutCategoriesWithNodes(
				graphNodes,
				graphEdges,
				c1Output,
				c2Subcategories,
				c2Relationships,
				crossC1C2Relationships
			);

			const processedData = reactFlowService.convertDataToReactFlowDataTypes(
				layoutedData.graphNodes,
				layoutedData.c1Nodes,
				layoutedData.c2Nodes,
				layoutedData.edges,
				cursorPosition
			);
			return processedData.edges as BidirectionalReactFlowEdge[];
		}
	}, [cursorPosition, useSampleGraph]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot) as CustomReactFlowNode[]),
		[],
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot) as BidirectionalReactFlowEdge[]),
		[],
	);
	const onConnect = useCallback(
		(params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[],
	);

	// Handle mouse move for cursor-based highlighting
	const onMouseMove = useCallback((event: React.MouseEvent) => {
		setCursorPosition({
			x: event.clientX,
			y: event.clientY
		});
	}, []);

	// Toggle between sample graph and original data
	const toggleGraph = useCallback(() => {
		setUseSampleGraph(!useSampleGraph);
	}, [useSampleGraph]);

	return (
		<div style={{ width: "100vw", height: "100vh", background: "white", position: "relative" }}>
			{/* Control panel */}
			<div style={{
				position: "absolute",
				top: "10px",
				left: "10px",
				zIndex: 1000,
				background: "white",
				padding: "10px",
				borderRadius: "8px",
				boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
				border: "1px solid #e5e7eb"
			}}>
				<button
					onClick={toggleGraph}
					style={{
						padding: "8px 16px",
						background: useSampleGraph ? "#3b82f6" : "#6b7280",
						color: "white",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						fontSize: "14px"
					}}
				>
					{useSampleGraph ? "Show Original Graph" : "Show Bidirectional Demo"}
				</button>
				<div style={{ marginTop: "8px", fontSize: "12px", color: "#6b7280" }}>
					{useSampleGraph ? "Demo: Bidirectional edges with label offsetting" : "Original: FastAPI analysis data"}
				</div>
			</div>

			<ReactFlow
				nodes={nodes}
				edges={processedEdges}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onMouseMove={onMouseMove}
				fitView
				minZoom={0.1}
				maxZoom={2}
				style={{ background: "white" }}
			/>
		</div>
	);
}
