"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, type NodeChange, type EdgeChange, type OnConnect, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { ReactFlowService } from "../core/react-flow.service";
import { ElkLayoutService } from "../core/elk-layout.service";
import { nodeTypes } from "../components/react-flow-nodes";

const reactFlowService = new ReactFlowService();
const elkLayoutService = new ElkLayoutService();

export default function App() {
	const [nodes, setNodes] = useState<Node[]>([]);
	const [edges, setEdges] = useState<Edge[]>([]);
	const [filters, setFilters] = useState<{ graph: boolean; c1: boolean; c2: boolean }>({ graph: true, c1: true, c2: true });

	const { graphNodes, graphEdges, c1Output, c2Subcategories, c2Relationships, crossC1C2Relationships } =
		useMemo(() => convertDataToGraphNodesAndEdges(), []);

	useEffect(() => {
		let mounted = true;
		(async () => {
			try {
				const layouted = await elkLayoutService.layoutCategoriesWithNodes(
					graphNodes,
					graphEdges,
					c1Output,
					c2Subcategories,
					c2Relationships,
					crossC1C2Relationships,
				);
				
				const rf = reactFlowService.convertDataToReactFlowDataTypes(
					layouted.graphNodes,
					layouted.c1Nodes,
					layouted.c2Nodes,
					layouted.edges,
				);
				
				if (mounted) {
					setNodes(rf.nodes);
					setEdges(rf.edges);
				}
			} catch {
				const rf = reactFlowService.convertDataToReactFlowDataTypes(
					graphNodes,
					c1Output,
					c2Subcategories,
					[...graphEdges],
				);
				if (mounted) {
					setNodes(rf.nodes);
					setEdges(rf.edges);
				}
			}
		})();
		return () => {
			mounted = false;
		};
	}, [graphNodes, graphEdges, c1Output, c2Subcategories, c2Relationships, crossC1C2Relationships]);

	const onNodesChange = useCallback(
		(changes: NodeChange[]) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
		[],
	);
	const onEdgesChange = useCallback(
		(changes: EdgeChange[]) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
		[],
	);
	const onConnect = useCallback<OnConnect>(
		(params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
		[],
	);

	const defaultEdgeOptions = useMemo(
		() => ({
			type: "smoothstep" as const, // Better for multiple edges converging
			style: { 
				strokeWidth: 1.5,
				strokeLinecap: 'round' as const,
			},
			markerEnd: {
				type: 'arrowclosed' as const,
				color: '#374151',
				width: 20,
				height: 20,
			},
			// Better handling of multiple edges to same target
			pathOptions: {
				borderRadius: 8,
			},
		}),
		[],
	);

	// derive filtered nodes/edges
	const filteredNodes = useMemo(() => nodes.filter((n) => {
		const kind = n.data?.kind as 'graph' | 'c1' | 'c2' | undefined;
		if (!kind) return true;
		return filters[kind];
	}), [nodes, filters]);

	const visibleNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);
	const filteredEdges = useMemo(() => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)), [edges, visibleNodeIds]);

	return (
		<div style={{ width: "100vw", height: "100vh", background: "white" }}>
			{/* Top-right filter controls */}
			<div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="Code entities: files, functions, classes">
						<input type="checkbox" checked={filters.graph} onChange={(e) => setFilters((f) => ({ ...f, graph: e.target.checked }))} />
						<span style={{ color: '#1e40af' }}>Code entities</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="C1: top-level categories">
						<input type="checkbox" checked={filters.c1} onChange={(e) => setFilters((f) => ({ ...f, c1: e.target.checked }))} />
						<span style={{ color: '#991b1b' }}>Modules</span>
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: 6 }} title="C2: subcategories within a C1">
						<input type="checkbox" checked={filters.c2} onChange={(e) => setFilters((f) => ({ ...f, c2: e.target.checked }))} />
						<span style={{ color: '#166534' }}>Components</span>
					</label>
				</div>
			</div>

			<ReactFlow
				nodes={filteredNodes}
				edges={filteredEdges}
				nodeTypes={nodeTypes}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				defaultEdgeOptions={defaultEdgeOptions}
				fitView
				fitViewOptions={{ padding: 0.15, includeHiddenNodes: false, maxZoom: 0.9 }}
				minZoom={0.1}
				maxZoom={1.5}
				snapToGrid
				snapGrid={[10, 10]}
				proOptions={{ hideAttribution: true }}
				onlyRenderVisibleElements
				selectionOnDrag
				style={{ background: "white" }}
			/>
		</div>
	);
}
