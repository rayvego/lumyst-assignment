"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { HierarchicalLayoutService } from "../core/hierarchical-layout.service";
import { ReactFlowService } from "../core/react-flow.service";
import EnhancedCurvedEdge from "../components/enhanced-curved-edge";
import { GroupBackground } from "../components/group-background";

const hierarchicalLayoutService = new HierarchicalLayoutService();
const reactFlowService = new ReactFlowService();

const {
	graphNodes,
	graphEdges,
	c1Output,
	c2Subcategories,
	c2Relationships,
	crossC1C2Relationships
} = convertDataToGraphNodesAndEdges();

const layoutedData = hierarchicalLayoutService.layoutCategoriesWithNodes(
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

export default function App() {
	const [nodes, setNodes] = useState(initialNodes);
	const [edges, setEdges] = useState(initialEdges);

	// Define custom edge types
	const edgeTypes = useMemo(
		() => ({
			enhanced: EnhancedCurvedEdge,
			default: EnhancedCurvedEdge,
		}),
		[]
	);

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

	return (
		<div style={{ width: "100vw", height: "100vh", background: "#fafafa" }}>
			<ReactFlow
				nodes={nodes}
				edges={edges}
				edgeTypes={edgeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
				minZoom={0.05}
				maxZoom={2}
				style={{ background: "#fafafa" }}
				defaultEdgeOptions={{
					type: 'enhanced',
				}}
			>
				<Background color="#e5e7eb" gap={16} />
				<Controls />
				<MiniMap 
					nodeColor={(node) => {
						if (node.style?.background) return node.style.background as string;
						return '#dbeafe';
					}}
					maskColor="rgba(0, 0, 0, 0.1)"
				/>
				{layoutedData.groupBounds && (
					<GroupBackground bounds={layoutedData.groupBounds} />
				)}
			</ReactFlow>
		</div>
	);
}
