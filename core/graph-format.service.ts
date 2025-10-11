import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import ELK from "elkjs/lib/elk.bundled.js";
import type {
  C1Output,
  C2Relationship,
  C2Subcategory,
  CrossC1C2Relationship,
  GraphEdge,
  GraphNode,
} from "./types";

const processStubNodes = (graphNodes: GraphNode[], graphEdges: GraphEdge[]) => {
  const graphNodesObj: { [key: string]: GraphNode } = {};
  graphNodes.forEach((node) => {
    graphNodesObj[node.id] = node;
  });

  const dependentCounter = new Map<string, number>();
  graphEdges.forEach((edge) => {
    dependentCounter.set(
      edge.target,
      (dependentCounter.get(edge.target) || 0) + 1
    );
  });

  dependentCounter.forEach((count, nodeId) => {
    //Create stub nodes only if a node has more than 1 dependent
    if (count > 1) {
      const node = graphNodesObj[nodeId];
      for (let i = 0; i < count; i++) {
        const stubNode = {
          ...node,
          type: "stubNode",
          id: `${nodeId}-stub-${i}`,
          label: `${node?.label} stub-${i}`,
        };
        const firstTarget = graphEdges.findIndex(
          (e) => e.target === node?.id && e.source !== node?.id
        );
        if (firstTarget === -1) continue;
        graphEdges[firstTarget].target = stubNode.id;
        graphEdges[firstTarget].id = graphEdges[firstTarget].id + "-to-stub";
        graphNodes.push(stubNode);
      }
    }
  });
};

export class GraphFormatService {
  async layoutCategoriesWithElk(
    elk: typeof ELK,
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ) {
    //This creates stub nodes for any node with multiple dependents
    processStubNodes(graphNodes, graphEdges);

    const c2NameToIdMap = new Map<string, string>();
    c2Subcategories.forEach((c2) => {
      c2NameToIdMap.set(c2.c2Name, c2.id);
    });

    const elkNodes: ElkNode[] = [
      ...graphNodes.map((node) => ({
        id: node.id,
        width: 150,
        height: 50,
      })),
      ...c1Outputs.map((node) => ({
        id: node.id,
        width: 200,
        height: 60,
      })),
      ...c2Subcategories.map((node) => ({
        id: node.id,
        width: 170,
        height: 55,
      })),
    ];

    const allEdges: GraphEdge[] = [
      ...graphEdges,
      ...c2Subcategories.map((c2) => ({
        id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
        source: c2.c1CategoryId,
        target: c2.id,
        label: "contains",
      })),
      ...c2Subcategories.flatMap((c2) =>
        c2.nodeIds.map((nodeId) => ({
          id: `c2-${c2.id}-to-node-${nodeId}`,
          source: c2.id,
          target: nodeId,
          label: "contains",
        }))
      ),
      ...c2Relationships
        .map((rel) => {
          const sourceId = c2NameToIdMap.get(rel.fromC2);
          const targetId = c2NameToIdMap.get(rel.toC2);
          if (!sourceId || !targetId) {
            return null;
          }

          return {
            id: rel.id,
            source: sourceId,
            target: targetId,
            label: rel.label,
          };
        })
        .filter((edge): edge is GraphEdge => edge !== null),
      ...crossC1C2Relationships
        .map((rel) => {
          const sourceId = c2NameToIdMap.get(rel.fromC2);
          const targetId = c2NameToIdMap.get(rel.toC2);
          if (!sourceId || !targetId) {
            return null;
          }
          return {
            id: rel.id,
            source: sourceId,
            target: targetId,
            label: rel.label,
          };
        })
        .filter((edge): edge is GraphEdge => edge !== null),
    ];

    const elkEdges: ElkExtendedEdge[] = allEdges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    }));

    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions: {
        algorithm: "layered",
        "elk.direction": "DOWN",
        "elk.layered.spacing.nodeNodeBetweenLayers": "80",
        "elk.spacing.nodeNode": "40",
      },
      children: elkNodes,
      edges: elkEdges,
    };

    const layoutedGraph = await elk.layout(elkGraph);
    const positionedLookup = new Map<string, { x: number; y: number }>();

    layoutedGraph.children?.forEach((child: ElkNode) => {
      if (child.x !== undefined && child.y !== undefined) {
        positionedLookup.set(child.id, { x: child.x, y: child.y });
      }
    });

    const mapPosition = <T extends { id: string }>(items: T[]) =>
      items.map((item) => {
        const position = positionedLookup.get(item.id) ?? { x: 0, y: 0 };
        return {
          ...item,

          position: {
            x: position.x,
            y: position.y,
          },
        };
      });

    return {
      graphNodes: mapPosition(graphNodes),
      c1Nodes: mapPosition(c1Outputs),
      c2Nodes: mapPosition(c2Subcategories),
      edges: allEdges,
    };
  }
}
