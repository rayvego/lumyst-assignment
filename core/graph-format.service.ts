// src/core/data/graph-format.service.ts
import dagre from 'dagre';
import _ from 'lodash';
import type {
    GraphNode, GraphEdge, C1Output, C2Subcategory,
    C2Relationship, CrossC1C2Relationship, LayoutResult
} from '../types';

export const LAYOUT_MODES = {
    balanced: { ranksep: 450, nodesep: 250, edgesep: 150 },
    minimalCrossings: { ranksep: 500, nodesep: 300, edgesep: 200 },
    compact: { ranksep: 300, nodesep: 150, edgesep: 100 },
    wide: { ranksep: 450, nodesep: 400, edgesep: 250 },
};

const PARALLEL_EDGE_SPACING = 30;

export class GraphFormatService {
    public layoutCategoriesWithNodes(
        graphNodes: GraphNode[],
        graphEdges: GraphEdge[],
        c1Outputs: C1Output[],
        c2Subcategories: C2Subcategory[],
        c2Relationships: C2Relationship[],
        crossC1C2Relationships: CrossC1C2Relationship[],
        mode: keyof typeof LAYOUT_MODES = 'balanced'
    ): LayoutResult {

        const allNodes = [
            ...graphNodes.map(n => ({ ...n, type: 'node' as const })),
            ...c1Outputs.map(c1 => ({ ...c1, type: 'c1' as const })),
            ...c2Subcategories.map(c2 => ({ ...c2, type: 'c2' as const })),
        ];
        const allNodeIds = new Set(allNodes.map(n => n.id));

        const adjacencyList = new Map<string, string[]>();
        graphEdges.forEach(e => {
            if (!adjacencyList.has(e.source)) adjacencyList.set(e.source, []);
            adjacencyList.get(e.source)!.push(e.target);
        });

        const visited = new Set<string>();
        const stack = new Set<string>();
        const reversedEdges: GraphEdge[] = [];
        const acyclicEdges = [...graphEdges];

        const findCycles = (nodeId: string): boolean => {
            if (stack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;
            visited.add(nodeId);
            stack.add(nodeId);
            const neighbors = adjacencyList.get(nodeId) || [];
            for (const neighborId of neighbors) {
                if (findCycles(neighborId)) {
                    const edgeToReverseIndex = acyclicEdges.findIndex(e => e.source === nodeId && e.target === neighborId);
                    if (edgeToReverseIndex !== -1) {
                        const edge = acyclicEdges[edgeToReverseIndex];
                        reversedEdges.push({ ...edge, source: neighborId, target: nodeId, reversed: true });
                        acyclicEdges.splice(edgeToReverseIndex, 1);
                    }
                    return true;
                }
            }
            stack.delete(nodeId);
            return false;
        };

        allNodes.forEach(n => findCycles(n.id));

        const inDegrees: Record<string, number> = {};
        const layers: Record<string, number> = {};
        const isRoot: Record<string, boolean> = {};
        allNodeIds.forEach(id => {
            inDegrees[id] = 0;
            layers[id] = 0;
            isRoot[id] = false;
        });

        const acyclicAdj = new Map<string, string[]>();
        const processedEdges = [...acyclicEdges, ...reversedEdges];
        processedEdges.forEach(e => {
            if (!acyclicAdj.has(e.source)) acyclicAdj.set(e.source, []);
            acyclicAdj.get(e.source)!.push(e.target);
            inDegrees[e.target] = (inDegrees[e.target] || 0) + 1;
        });

        const queue = [...allNodeIds].filter(id => inDegrees[id] === 0);
        queue.forEach(id => isRoot[id] = true);
        while (queue.length) {
            const v = queue.shift()!;
            (acyclicAdj.get(v) || []).forEach(u => {
                layers[u] = Math.max(layers[u], (layers[v] || 0) + 1);
                if (--inDegrees[u] === 0) queue.push(u);
            });
        }
        const maxLayer = Object.values(layers).reduce((max, layer) => Math.max(max, layer), 0);

        const dagreGraph = new dagre.graphlib.Graph({ multigraph: true });
        const { ranksep, nodesep, edgesep } = LAYOUT_MODES[mode] || LAYOUT_MODES.balanced;

        dagreGraph.setGraph({
            rankdir: 'TB',
            nodesep,
            ranksep,
            edgesep,
            ranker: 'longest-path'
        });
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        allNodes.forEach(node => {
            dagreGraph.setNode(node.id, {
                width: Math.max(180, (node.nodeIds?.length || 0) * 20),
                height: 60,
                rank: layers[node.id] || 0,
            });
        });

        const c2NameToId = new Map(c2Subcategories.map(c2 => [c2.c2Name, c2.id]));

        const allRelationshipEdges = [...c2Relationships, ...crossC1C2Relationships]
            .map(rel => {
                const sourceId = c2NameToId.get(rel.fromC2);
                const targetId = c2NameToId.get(rel.toC2);
                return sourceId && targetId
                    ? { id: rel.id, source: sourceId, target: targetId, type: 'relationship', label: 'Relates To' }
                    : null;
            }).filter(Boolean) as GraphEdge[];

        const containmentEdges = c2Subcategories.flatMap(c2 =>
            c2.nodeIds.map(nid => ({
                id: `c2-${c2.id}-to-node-${nid}`,
                source: c2.id,
                target: nid,
                type: 'containment',
                label: 'Contains'
            }))
        ) as GraphEdge[];

        const c1c2Edges = c2Subcategories.map(c2 => ({
            id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
            source: c2.c1CategoryId,
            target: c2.id,
            type: 'container',
            label: 'Belongs To'
        })) as GraphEdge[];

        const finalEdges = [...acyclicEdges, ...reversedEdges, ...containmentEdges, ...c1c2Edges, ...allRelationshipEdges];

        finalEdges.forEach(e => dagreGraph.setEdge(e.source, e.target));

        dagre.layout(dagreGraph);

        const layoutNodes = allNodes.map(n => {
            const pos = dagreGraph.node(n.id);
            return {
                ...n,
                position: { x: pos.x, y: pos.y },
                isRoot: isRoot[n.id] || false,
                isCritical: (layers[n.id] === maxLayer && layers[n.id] > 0) || false,
            };
        });

        const edgeKey = (e: GraphEdge) => [e.source, e.target].sort().join('-');
        const parallelEdgeGroups = _.groupBy(finalEdges, edgeKey);

        const edgesWithOffsets = finalEdges.map(e => {
            const group = parallelEdgeGroups[edgeKey(e)];
            if (group.length > 1) {
                const index = group.findIndex(edge => edge.id === e.id);
                const totalOffsetWidth = (group.length - 1) * PARALLEL_EDGE_SPACING;
                const startOffset = -totalOffsetWidth / 2;
                const offsetX = startOffset + index * PARALLEL_EDGE_SPACING;
                return { ...e, offsetX };
            }
            return { ...e, offsetX: 0 };
        });

        const nodes = {
            graphNodes: [] as any[],
            c1Nodes: [] as any[],
            c2Nodes: [] as any[],
        };

        layoutNodes.forEach(n => {
            if (n.type === 'node') nodes.graphNodes.push(n);
            else if (n.type === 'c1') nodes.c1Nodes.push(n);
            else if (n.type === 'c2') nodes.c2Nodes.push(n);
        });

        return {
            graphNodes: nodes.graphNodes,
            c1Nodes: nodes.c1Nodes,
            c2Nodes: nodes.c2Nodes,
            edges: edgesWithOffsets,
        };
    }
}