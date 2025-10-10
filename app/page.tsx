// src/app/page.tsx
"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, Background, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState, useMemo, useEffect } from "react";
import { convertDataToGraphNodesAndEdges } from "../core/data/data-converter";
import { GraphFormatService, LAYOUT_MODES } from "../core/graph-format.service";
import { ReactFlowService } from "../core/react-flow.service";
import { C1CategoryNode, C2SubcategoryNode, GraphNode } from "../components/react-flow-nodes";
import CustomOffsetEdge from "../components/edges/CustomOffsetEdge";
import { Button } from "../components/ui/button";

type LayoutMode = keyof typeof LAYOUT_MODES;

const nodeTypes = {
  codeFile: GraphNode,
  c1Category: C1CategoryNode,
  c2Subcategory: C2SubcategoryNode,
};

const edgeTypes = {
  smoothstep: CustomOffsetEdge,
};

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

export default function Page() {
    const [mode, setMode] = useState<LayoutMode>('balanced');
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const { nodes: newNodes, edges: newEdges } = useMemo(() => {
        const layoutedData = graphFormatService.layoutCategoriesWithNodes(
            graphNodes,
            graphEdges,
            c1Output,
            c2Subcategories,
            c2Relationships,
            crossC1C2Relationships,
            mode
        );
        return reactFlowService.convertDataToReactFlowDataTypes(
            layoutedData.graphNodes,
            layoutedData.c1Nodes,
            layoutedData.c2Nodes,
            layoutedData.edges,
        );
    }, [mode]);

    const [nodes, setNodes] = useState(newNodes);
    const [edges, setEdges] = useState(newEdges);

    useEffect(() => {
        setNodes(newNodes);
        setEdges(newEdges);
    }, [newNodes, newEdges]);

    // This useMemo block computes the highlighting logic
    const highlightedElements = useMemo(() => {
        if (!selectedNodeId) {
            return {
                highlightedNodeIds: new Set(),
                highlightedEdgeIds: new Set()
            };
        }

        const highlightedNodeIds = new Set<string>();
        const highlightedEdgeIds = new Set<string>();

        highlightedNodeIds.add(selectedNodeId);

        newEdges.forEach(edge => {
            if (edge.source === selectedNodeId) {
                highlightedEdgeIds.add(edge.id);
                highlightedNodeIds.add(edge.target);
            }
            if (edge.target === selectedNodeId) {
                highlightedEdgeIds.add(edge.id);
                highlightedNodeIds.add(edge.source);
            }
        });

        return { highlightedNodeIds, highlightedEdgeIds };
    }, [selectedNodeId, newEdges]);

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

    const onNodeClick = useCallback((event: React.MouseEvent, node: { id: string }) => {
        setSelectedNodeId(node.id === selectedNodeId ? null : node.id);
    }, [selectedNodeId]);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
    }, []);

    // Apply opacity to nodes and edges based on highlighting
    const finalNodes = useMemo(() => {
        if (!selectedNodeId) return nodes;
        return nodes.map(node => ({
            ...node,
            style: {
                ...node.style,
                opacity: highlightedElements.highlightedNodeIds.has(node.id) ? 1 : 0.3,
            }
        }));
    }, [nodes, highlightedElements]);

    const finalEdges = useMemo(() => {
        if (!selectedNodeId) return edges;
        return edges.map(edge => ({
            ...edge,
            style: {
                ...edge.style,
                opacity: highlightedElements.highlightedEdgeIds.has(edge.id) ? 1 : 0.2,
            }
        }));
    }, [edges, highlightedElements]);
    
    return (
        <div style={{ width: "100vw", height: "100vh", background: "white" }}>
            {/* Layout Switching UI */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                {
                    
                    (Object.keys(LAYOUT_MODES) as LayoutMode[]).map((m: LayoutMode) => (
                        <Button
                            key={m}
                            onClick={() => setMode(m)}
                            variant={mode === m ? 'default' : 'outline'}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Button>
                    ))
                }
            </div>


            <ReactFlow
                nodes={finalNodes}
                edges={finalEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                style={{ background: "white" }}
            >
              <Background />
              <Controls />
            </ReactFlow>
        </div>
    );
}