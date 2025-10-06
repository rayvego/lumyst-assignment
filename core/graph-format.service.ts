import dagre from 'dagre';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';
import { Position } from '@xyflow/react'; 

// Layout Constants for predictable spacing
const NODE_WIDTH = 250; 
const NODE_HEIGHT = 80;
const RANK_SEP = 150;
const NODE_SEP = 50;

export class GraphFormatService {
    /**
     * Arranges all graph elements using the Dagre hierarchical layout algorithm (Task 4).
     */
    layoutCategoriesWithNodes(
        graphNodes: GraphNode[],
        graphEdges: GraphEdge[],
        c1Outputs: C1Output[],
        c2Subcategories: C2Subcategory[],
        c2Relationships: C2Relationship[],
        crossC1C2Relationships: CrossC1C2Relationship[]
    ) {
        const c2NameToIdMap = new Map<string, string>();
        c2Subcategories.forEach(c2 => {
            c2NameToIdMap.set(c2.c2Name, c2.id);
        });
        
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        // Configure graph for hierarchical layout (Top-to-Bottom flow)
        dagreGraph.setGraph({ 
            rankdir: 'TB',
            ranksep: RANK_SEP, 
            nodesep: NODE_SEP,
            padding: 50 
        });

        const allNodes = [
            ...graphNodes,
            ...c1Outputs.map(c1 => ({ ...c1, type: 'c1' })),
            ...c2Subcategories.map(c2 => ({ ...c2, type: 'c2' }))
        ];

        // Add all nodes to Dagre with dimensions
        allNodes.forEach((node) => {
            dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
        });

        // Aggregate all edges
        const allEdges: GraphEdge[] = [
            ...graphEdges,
            ...c2Subcategories.map(c2 => ({
                id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
                source: c2.c1CategoryId,
                target: c2.id,
                label: 'contains'
            })),
            ...c2Subcategories.flatMap(c2 =>
                c2.nodeIds.map(nodeId => ({
                    id: `c2-${c2.id}-to-node-${nodeId}`,
                    source: c2.id,
                    target: nodeId,
                    label: 'contains'
                }))
            ),
            ...c2Relationships.map(rel => {
                const sourceId = c2NameToIdMap.get(rel.fromC2);
                const targetId = c2NameToIdMap.get(rel.toC2);
                if (!sourceId || !targetId) {
                    return null;
                }
                return {
                    id: rel.id,
                    source: sourceId,
                    target: targetId,
                    label: rel.label
                };
            }).filter((edge): edge is GraphEdge => edge !== null),
            ...crossC1C2Relationships.map(rel => {
                const sourceId = c2NameToIdMap.get(rel.fromC2);
                const targetId = c2NameToIdMap.get(rel.toC2);
                if (!sourceId || !targetId) {
                    return null;
                }
                return {
                    id: rel.id,
                    source: sourceId,
                    target: targetId,
                    label: rel.label
                };
            }).filter((edge): edge is GraphEdge => edge !== null)
        ];

        // Add all edges to Dagre
        allEdges.forEach((edge) => {
            if (edge) {
                dagreGraph.setEdge(edge.source, edge.target);
            }
        });

        // Execute core Dagre layout algorithm
        dagre.layout(dagreGraph);

        const isHorizontal = dagreGraph.graph().rankdir === 'LR';

        // Apply calculated positions back to nodes
        const applyLayout = (nodes: any[]) => {
            return nodes.map((node) => {
                const nodeWithPosition = dagreGraph.node(node.id);
                
                // Convert Dagre center coordinates to React Flow top-left
                const x = nodeWithPosition.x - nodeWithPosition.width / 2;
                const y = nodeWithPosition.y - nodeWithPosition.height / 2;
                
                // Assign position and connection ports
                return {
                    ...node,
                    position: { x, y },
                    targetPosition: isHorizontal ? Position.Left : Position.Top,
                    sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
                };
            });
        };

        return {
            graphNodes: applyLayout(graphNodes),
            c1Nodes: applyLayout(c1Outputs),
            c2Nodes: applyLayout(c2Subcategories),
            edges: allEdges,
        };
    }
}
