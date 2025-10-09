"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { BidirectionalEdge } from "../components/bidirectional-edge";
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

const { nodes: initialNodes, edges: initialEdges } = reactFlowService.convertDataToReactFlowDataTypes(
	layoutedData.graphNodes,
	layoutedData.c1Nodes,
	layoutedData.c2Nodes,
	layoutedData.edges,
);

// Define edge types - use bidirectional edge for all edges
const edgeTypes = {
	default: BidirectionalEdge,
	bidirectional: BidirectionalEdge,
};

export default function App() {
	const [nodes, setNodes] = useState(initialNodes);
	const [edges, setEdges] = useState(initialEdges);

	const onNodesChange = useCallback(
		(changes: any) => {
			const updatedNodes = applyNodeChanges(changes, nodes);
			setNodes(updatedNodes);
			
			// Check if any node position has changed to trigger edge updates
			const hasPositionChanges = changes.some((change: any) => 
				change.type === 'position' && change.position
			);
			
			if (hasPositionChanges) {
				// Force edge re-render by updating edge data
				const updatedEdges = edges.map((edge: any) => ({
					...edge,
					data: {
						...edge.data,
						// Add timestamp to force re-render
						lastUpdate: Date.now(),
					}
				}));
				setEdges(updatedEdges);
			}
		},
		[nodes, edges],
	);

	const onNodeDrag = useCallback(
		(event: any, node: any) => {
			// Update edges in real-time during drag
			const updatedEdges = edges.map((edge: any) => ({
				...edge,
				data: {
					...edge.data,
					// Force re-render during drag
					dragging: true,
					lastUpdate: Date.now(),
				}
			}));
			setEdges(updatedEdges);
		},
		[edges],
	);

	const onNodeDragStop = useCallback(
		(event: any, node: any) => {
			// Clean up drag state
			const updatedEdges = edges.map((edge: any) => ({
				...edge,
				data: {
					...edge.data,
					dragging: false,
				}
			}));
			setEdges(updatedEdges);
		},
		[edges],
	);
	const onEdgesChange = useCallback(
		(changes: any) => setEdges((edgesSnapshot: any) => applyEdgeChanges(changes, edgesSnapshot)),
		[],
	);
	const onConnect = useCallback(
		(params: any) => setEdges((edgesSnapshot: any) => addEdge(params, edgesSnapshot)),
		[],
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
				onNodeDrag={onNodeDrag}
				onNodeDragStop={onNodeDragStop}
				fitView
				minZoom={0.1}
				maxZoom={2}
				style={{ background: "white" }}
			/>
		</div>
	);
}
