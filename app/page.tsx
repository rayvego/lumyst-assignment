"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useMemo } from "react";
import { LayoutControls } from "../components/layout-controls";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";

const graphFormatService = new GraphFormatService();
const reactFlowService = new ReactFlowService();

export default function App() {
	const [currentLayout, setCurrentLayout] = useState<'default' | 'minimal-crossings' | 'compact' | 'wide'>('default');

	// Load and convert data
	const graphData = useMemo(() => {
		return convertDataToGraphNodesAndEdges();
	}, []);

	// Apply layout based on current selection
	const layoutedData = useMemo(() => {
		const {
			graphNodes,
			graphEdges,
			c1Output,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		} = graphData;

		switch (currentLayout) {
			case 'minimal-crossings':
				return graphFormatService.layoutWithMinimalCrossings(
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships
				);
			case 'compact':
				return graphFormatService.layoutCompact(
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships
				);
			case 'wide':
				return graphFormatService.layoutWide(
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships
				);
			default:
				return graphFormatService.layoutCategoriesWithNodes(
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships
				);
		}
	}, [graphData, currentLayout]);

	// Convert to React Flow format
	const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
		return reactFlowService.convertDataToReactFlowDataTypes(
			layoutedData.graphNodes,
			layoutedData.c1Nodes,
			layoutedData.c2Nodes,
			layoutedData.edges,
		);
	}, [layoutedData]);

	const [nodes, setNodes] = useState(initialNodes);
	const [edges, setEdges] = useState(initialEdges);

	// Update nodes and edges when layout changes
	useMemo(() => {
		setNodes(initialNodes);
		setEdges(initialEdges);
	}, [initialNodes, initialEdges]);

	const onNodesChange = useCallback(
		(changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[],
	);

	const onEdgesChange = useCallback(
		(changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[],
	);

	const onConnect = useCallback(
		(params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[],
	);

	const handleLayoutChange = useCallback((layout: 'default' | 'minimal-crossings' | 'compact' | 'wide') => {
		setCurrentLayout(layout);
	}, []);

	return (
		<div style={{ width: "100vw", height: "100vh", background: "white" }}>
			<LayoutControls onLayoutChange={handleLayoutChange} currentLayout={currentLayout} />
			<ReactFlow
				nodes={nodes}
				edges={edges}
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

