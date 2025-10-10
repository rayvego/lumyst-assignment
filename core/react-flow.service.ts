import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import type { Edge, Node } from 'reactflow';

export class ReactFlowService {
    /**
     * Converts processed graph data into React Flow compatible nodes and edges.
     * This method is updated to handle bidirectional edges by assigning them a custom type.
     */
    convertDataToReactFlowDataTypes(
        graphNodes: GraphNode[],
        c1Nodes: C1Output[],
        c2Nodes: C2Subcategory[],
        edges: GraphEdge[]
    ): { nodes: Node[]; edges: Edge[] } {
        const reactFlowNodes = [
            // Regular graph nodes
            ...graphNodes.map((node) => ({
                id: node.id,
                position: node.position || { x: 0, y: 0 },
                data: { label: node.label },
                type: 'default',
                style: {
                    background: '#dbeafe',
                    border: '2px solid #3b82f6',
                    color: '#1e40af',
                    borderRadius: '6px'
                },
            })),
            // C1 category nodes
            ...c1Nodes.map((node) => ({
                id: node.id,
                position: node.position || { x: 0, y: 0 },
                data: { label: node.label },
                type: 'default',
                style: {
                    background: '#fef2f2',
                    border: '3px solid #dc2626',
                    color: '#991b1b',
                    fontWeight: 'bold',
                    borderRadius: '6px'
                },
            })),
            // C2 subcategory nodes
            ...c2Nodes.map((node) => ({
                id: node.id,
                position: node.position || { x: 0, y: 0 },
                data: { label: node.label },
                type: 'default',
                style: {
                    background: '#f0fdf4',
                    border: '2px solid #16a34a',
                    color: '#166534',
                    borderRadius: '6px'
                },
            }))
        ];

        const reactFlowEdges = edges.map((edge) => {
            // Check for the isBidirectional flag added by GraphFormatService
            const isBidirectional = (edge as any).isBidirectional;

            // Determine the base styling for different edge types
            const style = edge.label === 'contains'
                ? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 } // Dashed light gray for containment
                : edge.id.startsWith('c2_relationship')
                    ? { stroke: '#059669', strokeWidth: 2 } // Dark green for C2-C2 relationships
                    : edge.id.startsWith('cross_c1_c2_rel')
                        ? { stroke: '#d97706', strokeWidth: 2 } // Dark orange for cross C1-C2 relationships
                        : { stroke: '#374151', strokeWidth: 1 }; // Dark gray for other edges
            
            return {
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label,
                style,
                labelStyle: { fill: '#000', fontWeight: '500' },
                // Use a custom type for bidirectional edges to trigger the custom component
                type: isBidirectional ? 'bidirectional' : 'default',
                // Pass the entire processed edge object as data so the custom component can access it
                data: edge, 
            };
        });

        return {
            nodes: reactFlowNodes,
            edges: reactFlowEdges,
        };
    }
}