"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, type NodeChange, type EdgeChange, type Connection, type Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useEffect } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import { LayoutControls } from "../components/layout-controls";
import { nodeTypes } from "../components/react-flow-nodes";
import type { LayoutAlgorithm, LayoutDirection } from "../core/react-flow.service";

interface ReactFlowEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
	type?: string;
	animated?: boolean;
	style?: React.CSSProperties;
	labelStyle?: React.CSSProperties;
	pathOptions?: {
		borderRadius?: number;
		offset?: number;
	};
}

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

export default function App() {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<ReactFlowEdge[]>([]);
	const [currentAlgorithm, setCurrentAlgorithm] = useState<LayoutAlgorithm>('hierarchical');
	const [currentDirection, setCurrentDirection] = useState<LayoutDirection>('TB');
	const [isApplying, setIsApplying] = useState(false);

	const applyLayout = useCallback(async () => {
		setIsApplying(true);
		
		try {
			// Update layout options
			graphFormatService.setLayoutOptions({
				algorithm: currentAlgorithm,
				direction: currentDirection,
				spacing: 40,
				clusterSimilar: true,
				reduceCrossings: true,
			});

			// Apply layout
			const layoutedData = graphFormatService.layoutCategoriesWithNodes(
				graphNodes,
				graphEdges,
				c1Output,
				c2Subcategories,
				c2Relationships,
				crossC1C2Relationships
			);

			// Convert to React Flow format
			const { nodes: newNodes, edges: newEdges } = reactFlowService.convertDataToReactFlowDataTypes(
				layoutedData.graphNodes,
				layoutedData.c1Nodes,
				layoutedData.c2Nodes,
				layoutedData.edges,
			);

			setNodes(newNodes);
			setEdges(newEdges);
		} catch (error) {
			console.error('Error applying layout:', error);
		} finally {
			setIsApplying(false);
		}
	}, [currentAlgorithm, currentDirection]);

	// Apply initial layout
	useEffect(() => {
		applyLayout();
	}, [applyLayout]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[],
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[],
	);
	const onConnect = useCallback(
		(params: Connection) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[],
	);

	return (
		<div style={{ width: "100vw", height: "100vh", background: "white" }}>
			<LayoutControls
				currentAlgorithm={currentAlgorithm}
				currentDirection={currentDirection}
				onAlgorithmChange={setCurrentAlgorithm}
				onDirectionChange={setCurrentDirection}
				onApplyLayout={applyLayout}
				isApplying={isApplying}
			/>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				nodeTypes={nodeTypes}
				fitView
				minZoom={0.1}
				maxZoom={2}
				style={{ background: "white" }}
			/>
		</div>
	);
}
