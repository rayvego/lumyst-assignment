"use client";

import { addEdge, applyEdgeChanges, applyNodeChanges, ReactFlow, Background, Controls, MiniMap, Panel, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
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
    crossC1C2Relationships,
} = convertDataToGraphNodesAndEdges(true); // Pass true to enable utility filtering

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

export default function App() {
    const [nodes, setNodes] = useState(initialNodes);
    const [edges, setEdges] = useState(initialEdges);

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
        <div style={{ width: "100vw", height: "100vh", background: "#f8fafc" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
                fitViewOptions={{
                    padding: 0.3,
                    includeHiddenNodes: false,
                }}
                minZoom={0.05}
                maxZoom={1.2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.35 }}
                attributionPosition="bottom-right"
                proOptions={{ hideAttribution: true }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
            >
                <Background 
                    gap={24} 
                    size={1.5} 
                    color="#e2e8f0"
                    style={{ background: "#f8fafc" }}
                />
                
               
                <Panel position="top-left" style={{
                    background: 'white',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                }}>
                    <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#0f172a',
                        marginBottom: '12px'
                    }}>
                        Codebase Structure
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                                border: '3px solid #dc2626',
                                borderRadius: '6px',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontWeight: '600', color: '#334155' }}>
                                C1 Categories ({c1Output.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                                border: '2.5px solid #16a34a',
                                borderRadius: '6px',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontWeight: '600', color: '#334155' }}>
                                C2 Subcategories ({c2Subcategories.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                                border: '2px solid #3b82f6',
                                borderRadius: '6px',
                                flexShrink: 0,
                            }} />
                            <span style={{ fontWeight: '600', color: '#334155' }}>
                                Graph Nodes ({graphNodes.length})
                            </span>
                        </div>
                    </div>
                    <div style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0',
                        color: '#64748b',
                        fontWeight: '500',
                        fontSize: '12px',
                    }}>
                        Total: {nodes.length} nodes • {edges.length} edges
                    </div>
                    
                </Panel>
                
            
            </ReactFlow>
        </div>
    );
}