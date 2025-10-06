"use client";

/* Project note (customizations vs original repo):
   This page wires the data pipeline: raw analysis -> layout -> React Flow.
   We keep the original event handlers but ensure large graphs open framed
   (fitView + zoom bounds) for easier reading. */

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow } from "@xyflow/react";
import type { Node, Edge, NodeChange, EdgeChange, Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { layoutGraph } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import { ImportanceRankingService, annotateNodesWithImportance } from "../core/importance-ranking.service";

const reactFlowService = new ReactFlowService();
const importanceService = new ImportanceRankingService();

const {
	graphNodes,
	graphEdges,
	c1Output,
	c2Subcategories,
	c2Relationships,
	crossC1C2Relationships
} = convertDataToGraphNodesAndEdges();

// 1) Rank importance on RAW graph (before any layout)
const ranked = importanceService.rank(
    graphNodes.map((n) => {
        // best-effort file path from id pattern: code:path:label:line
        const parts = n.id.split(":");
        const filePath = parts.length >= 3 ? parts[1] : undefined;
        return { ...n, filePath } as any;
    }),
    graphEdges,
);

// 2) Annotate and optionally filter utilities
const annotatedGraphNodes = annotateNodesWithImportance(graphNodes, ranked);
const FILTER_UTILS = true;
const utilityIds = new Set(ranked.filter(r => r.isUtility).map(r => r.id));
const filteredGraphNodes = FILTER_UTILS ? annotatedGraphNodes.filter(n => !utilityIds.has(n.id)) : annotatedGraphNodes;
const filteredEdges = FILTER_UTILS ? graphEdges.filter(e => !utilityIds.has(e.source) && !utilityIds.has(e.target)) : graphEdges;

// 3) Layout AFTER ranking/filtering (enforced hierarchy + importance-aware distances)
const layoutedData = layoutGraph(
    filteredGraphNodes,
    filteredEdges,
    c1Output,
    c2Subcategories,
    c2Relationships,
    crossC1C2Relationships
);

// 4) Convert to React Flow types
const { nodes: initialNodes, edges: initialEdges } = reactFlowService.convertDataToReactFlowDataTypes(
    layoutedData.graphNodes,
    layoutedData.c1Nodes,
    layoutedData.c2Nodes,
    layoutedData.edges,
);

export default function App() {
    const [nodes, setNodes] = useState<Node[]>(initialNodes as Node[]);
    const [edges, setEdges] = useState<Edge[]>(initialEdges as Edge[]);

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
			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				fitView
				// Keep initial view framed for large graphs
				minZoom={0.1}
				// Limit zoom-in to avoid label pixelation and heavy reflows
				maxZoom={2}
				style={{ background: "white" }}
			/>
		</div>
	);
}
