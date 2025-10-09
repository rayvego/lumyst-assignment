"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, Background, Controls, MiniMap, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";
import { nodeTypes } from "../components/react-flow-nodes";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { computeLayout } from "../core/elk-layout.service";
import { EnhancedReactFlowService } from "../core/enhanced-react-flow.service";

export default function App() {
	const [nodes, setNodes] = useState<any[]>([]);
	const [edges, setEdges] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Initialize graph with ELK layout
	useEffect(() => {
		async function initializeGraph() {
			try {
				setIsLoading(true);

				// Get raw data
				const {
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships,
				} = convertDataToGraphNodesAndEdges();

				// Create a map of available node IDs for validation
				const availableNodeIds = new Set(graphNodes.map(n => n.id));
				const availableC1Ids = new Set(c1Output.map(c => c.id));
				const availableC2Ids = new Set(c2Subcategories.map(c => c.id));

				// Combine all edges with proper validation
				const allEdges = [
					// Keep all original graph edges (they're already valid)
					...graphEdges,
					// C1 → C2 containment edges (only if both exist)
					...c2Subcategories
						.filter(c2 => availableC1Ids.has(c2.c1CategoryId))
						.map((c2) => ({
							id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
							source: c2.c1CategoryId,
							target: c2.id,
							label: "contains",
						})),
					// C2 → Node containment edges (only if both exist)
					...c2Subcategories.flatMap((c2) =>
						c2.nodeIds
							.filter(nodeId => availableNodeIds.has(nodeId))
							.map((nodeId) => ({
								id: `c2-${c2.id}-to-node-${nodeId}`,
								source: c2.id,
								target: nodeId,
								label: "contains",
							}))
					),
					// C2 relationships
					...c2Relationships.map((rel) => {
						const sourceC2 = c2Subcategories.find((c) => c.c2Name === rel.fromC2);
						const targetC2 = c2Subcategories.find((c) => c.c2Name === rel.toC2);
						if (!sourceC2 || !targetC2) return null;
						return {
							id: rel.id,
							source: sourceC2.id,
							target: targetC2.id,
							label: rel.label,
						};
					}).filter((e): e is NonNullable<typeof e> => e !== null),
					// Cross C1-C2 relationships
					...crossC1C2Relationships.map((rel) => {
						const sourceC2 = c2Subcategories.find((c) => c.c2Name === rel.fromC2);
						const targetC2 = c2Subcategories.find((c) => c.c2Name === rel.toC2);
						if (!sourceC2 || !targetC2) return null;
						return {
							id: rel.id,
							source: sourceC2.id,
							target: targetC2.id,
							label: rel.label,
						};
					}).filter((e): e is NonNullable<typeof e> => e !== null),
				];

				// Validate nodes and edges before passing to ELK
				const allNodeIds = new Set([
					...graphNodes.map(n => n.id),
					...c1Output.map(c => c.id),
					...c2Subcategories.map(c => c.id),
				]);
				
				const validEdges = allEdges.filter(e => 
					allNodeIds.has(e.source) && allNodeIds.has(e.target)
				);
				
				if (graphNodes.length === 0) {
					console.error("No nodes found. Check node extraction.");
					return;
				}

				// Compute ELK layout
				const layoutStart = performance.now();
				const layoutedData = await computeLayout({
					graphNodes,
					graphEdges: validEdges,
					c1Categories: c1Output,
					c2Subcategories,
				});
				const layoutTime = performance.now() - layoutStart;
				
				console.log(`Layout computed in ${layoutTime.toFixed(2)}ms`);

				// Convert to React Flow format
				const reactFlowService = new EnhancedReactFlowService();
				const { nodes: reactNodes, edges: reactEdges } =
					reactFlowService.convertDataToReactFlowDataTypes(
						layoutedData.graphNodes,
						layoutedData.c1Nodes,
						layoutedData.c2Nodes,
						layoutedData.edges
					);

				setNodes(reactNodes);
				setEdges(reactEdges);
			} catch (error) {
				console.error("Layout error:", error);
			} finally {
				setIsLoading(false);
			}
		}

		initializeGraph();
	}, []);

	const onNodesChange = useCallback(
		(changes: any) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[]
	);
	const onEdgesChange = useCallback(
		(changes: any) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[]
	);
	const onConnect = useCallback(
		(params: any) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[]
	);

	if (isLoading) {
		return (
			<div className="flex items-center justify-center w-screen h-screen bg-gradient-to-br from-slate-50 to-slate-100">
				<div className="text-center">
					<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
					<p className="text-lg font-semibold text-slate-700">Computing Layout...</p>
					<p className="text-sm text-slate-500 mt-2">Processing graph structure</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-screen h-screen bg-white">
			<ReactFlow
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
				minZoom={0.05}
				maxZoom={1.5}
				defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
				style={{ background: "#fafafa" }}
				proOptions={{ hideAttribution: true }}
			>
				<Background color="#e2e8f0" gap={20} size={1} />
				<Controls className="bg-white border border-slate-200 rounded-lg shadow-lg" />
				<MiniMap
					className="bg-white border border-slate-200 rounded-lg shadow-lg"
					nodeColor={(node) => {
						if (node.type === "c1CategoryNode") return "#dc2626";
						if (node.type === "c2SubcategoryNode") return "#16a34a";
						return "#3b82f6";
					}}
					maskColor="rgba(0, 0, 0, 0.05)"
					pannable
					zoomable
				/>
			</ReactFlow>

			{/* Stats Panel */}
			<div className="absolute top-4 left-4 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-xs">
				<h3 className="font-bold text-slate-800 mb-2">Graph Statistics</h3>
				<div className="space-y-1 text-sm text-slate-600">
					<p>
						<span className="font-semibold text-red-600">C1 Categories:</span>{" "}
						{nodes.filter((n) => n.type === "c1CategoryNode").length}
					</p>
					<p>
						<span className="font-semibold text-green-600">C2 Subcategories:</span>{" "}
						{nodes.filter((n) => n.type === "c2SubcategoryNode").length}
					</p>
					<p>
						<span className="font-semibold text-blue-600">Code Nodes:</span>{" "}
						{nodes.filter((n) => n.type === "graphNode").length}
					</p>
					<p>
						<span className="font-semibold text-slate-700">Total Edges:</span> {edges.length}
					</p>
				</div>
			</div>
		</div>
	);
}
