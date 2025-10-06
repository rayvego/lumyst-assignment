import type {
    C1Output,
    C2Relationship,
    C2Subcategory,
    CrossC1C2Relationship,
    GraphEdge,
    GraphNode,
} from "../types";
import analysisData from "./analysis.json";

// Helper function to find and merge bidirectional edges
function processGraphEdges(rawEdges: any[]): GraphEdge[] {
    // 1. Group edges by a normalized key (NodeA-NodeB, alphabetically sorted)
    const edgeMap = new Map<string, any[]>();
    const finalEdges: GraphEdge[] = [];

    for (const edge of rawEdges) {
        // Create a key that is the same regardless of direction (e.g., "A-B" or "B-A" both become "A-B")
        const normalizedKey = [edge.source, edge.target].sort().join('-');
        
        if (!edgeMap.has(normalizedKey)) {
            edgeMap.set(normalizedKey, []);
        }
        edgeMap.get(normalizedKey)!.push(edge);
    }

    // 2. Process the grouped edges
    for (const [key, edges] of edgeMap.entries()) {
        const [nodeA, nodeB] = key.split('-');

        if (edges.length === 2) {
            // This is a bidirectional pair. We find the two directional edges.
            // edge1 is A -> B, edge2 is B -> A (assuming A comes before B alphabetically)
            const edge1 = edges.find((e: any) => e.source === nodeA && e.target === nodeB);
            const edge2 = edges.find((e: any) => e.source === nodeB && e.target === nodeA);

            if (edge1 && edge2) {
                // Merge into a single custom edge object
                finalEdges.push({
                    // Use a new unique ID for the merged edge
                    id: `bidir-${key}`,
                    source: edge1.source,
                    target: edge1.target,
                    type: 'bidirectional-curved', // Tells React Flow to use our custom component
                    data: {
                        // Order the labels: [Source->Target label, Target->Source label]
                        labels: [edge1.label ?? '', edge2.label ?? ''],
                    },
                    // Apply visual markers for both directions
                    markerStart: { type: 'arrow' },
                    markerEnd: { type: 'arrow' },
                } as GraphEdge); // Cast to GraphEdge to ensure TypeScript acceptance
                
                continue; // Skip processing the two raw edges individually
            }
        }
        
        // If not a bidirectional pair (length 1, or pair where one direction is missing)
        // just treat it as a standard default edge.
        edges.forEach((edge: any) => {
             finalEdges.push({
                id: edge.id,
                source: edge.source,
                target: edge.target,
                label: edge.label ?? "",
                type: 'default', 
             } as GraphEdge);
        });
    }

    return finalEdges;
}


export function convertDataToGraphNodesAndEdges(): {
    graphNodes: GraphNode[];
    graphEdges: GraphEdge[];
    c1Output: C1Output[];
    c2Subcategories: C2Subcategory[];
    c2Relationships: C2Relationship[];
    crossC1C2Relationships: CrossC1C2Relationship[];
} {
    const graphNodes: GraphNode[] = analysisData.analysisData.graphNodes.map((node) => ({
        id: node.id,
        label: node.label,
    }));

    // --- UPDATED: Use the helper function to merge bidirectional edges ---
    const graphEdges: GraphEdge[] = processGraphEdges(analysisData.analysisData.graphEdges);
    // -------------------------------------------------------------------

    const c1Output: C1Output[] = analysisData.analysisData.c1Output.map((output) => ({
        id: output.id,
        label: output.c1Category,
        c1Category: output.c1Category,
        nodesInCategory: output.nodesInCategory,
        nodeIds: output.nodeIds,
    }));

    const c2Subcategories: C2Subcategory[] = analysisData.analysisData.c2Subcategories.map(
        (subcategory) => ({
            id: subcategory.id,
            label: subcategory.c2Name,
            c1CategoryId: subcategory.c1CategoryId,
            c2Name: subcategory.c2Name,
            description: subcategory.description,
            purpose: subcategory.purpose,
            nodeCount: subcategory.nodeCount,
            nodeIds: subcategory.nodeIds,
        }),
    );

    const c2Relationships: C2Relationship[] = analysisData.analysisData.c2Relationships.map(
        (relationship) => ({
            id: relationship.id,
            label: relationship.relationshipType,
            fromC2: relationship.fromC2,
            toC2: relationship.toC2,
            c1CategoryId: relationship.c1CategoryId,
        }),
    );

    const crossC1C2Relationships: CrossC1C2Relationship[] =
        analysisData.analysisData.crossC1C2Relationships.map((relationship) => ({
            id: relationship.id,
            label: relationship.relationshipType,
            fromC1: relationship.fromC1,
            fromC2: relationship.fromC2,
            toC1: relationship.toC1,
            toC2: relationship.toC2,
        }));

    return {
        graphNodes,
        graphEdges,
        c1Output,
        c2Subcategories,
        c2Relationships,
        crossC1C2Relationships,
    };
}
