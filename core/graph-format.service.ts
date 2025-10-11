import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import ELK from "elkjs/lib/elk.bundled.js";
import { createAdjacencyMap } from "./node-collapse";
import type {
	C1Output,
	C2Relationship,
	C2Subcategory,
	CrossC1C2Relationship,
	GraphEdge,
	GraphNode,
} from "./types";

const calculateDescendantCounts = (
  graphEdges: GraphEdge[]
): Map<string, number> => {
  const descendantCounts = new Map<string, number>();
  const adjacency = new Map<string, Set<string>>();
  const visiting = new Set<string>();
  const allNodes = new Set<string>();

  graphEdges.forEach(({ source, target }) => {
    allNodes.add(source);
    allNodes.add(target);

    if (!adjacency.has(source)) {
      adjacency.set(source, new Set<string>());
    }
    adjacency.get(source)!.add(target);
  });

  const visit = (nodeId: string): number => {
    if (descendantCounts.has(nodeId)) {
      return descendantCounts.get(nodeId)!;
    }

    if (visiting.has(nodeId)) {
      // Cycle detected, treat node as leaf to prevent infinite recursion.
      descendantCounts.set(nodeId, 0);
      return 0;
    }

    visiting.add(nodeId);
    const children = adjacency.get(nodeId);
    if (!children || children.size === 0) {
      visiting.delete(nodeId);
      descendantCounts.set(nodeId, 0);
      return 0;
    }

    let totalDescendants = 0;
    children.forEach((childId) => {
      totalDescendants += 1 + visit(childId);
    });

    visiting.delete(nodeId);
    descendantCounts.set(nodeId, totalDescendants);
    return totalDescendants;
  };

  allNodes.forEach((nodeId) => {
    visit(nodeId);
  });

  return descendantCounts;
};

const processStubNodes = (
  graphNodesMap: { [key: string]: GraphNode },
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[]
) => {
  const dependentCounter = new Map<string, number>();
  graphEdges.forEach((edge) => {
    dependentCounter.set(
      edge.target,
      (dependentCounter.get(edge.target) || 0) + 1
    );
  });
  dependentCounter.forEach((count, nodeId) => {
    if (count > 1) {
      // console.log("Creating stub for ", nodeId, count);
      const node = graphNodesMap[nodeId];
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

  return {
    graphEdges,
    graphNodes,
  };
};

const processCompactNodes = (
  graphNodesMap: Map<string, GraphNode>,
  graphNodes: GraphNode[],
  graphEdges: GraphEdge[]
) => {
  const compactedGraphNodes: Set<GraphNode> = new Set();
  const compactedGraphEdges: Set<GraphEdge> = new Set();

  return {
    graphEdges,
    graphNodes,
  };
};
export class GraphFormatService {
//   layoutCategoriesWithNodes(
//     graphNodes: GraphNode[],
//     graphEdges: GraphEdge[],
//     c1Outputs: C1Output[],
//     c2Subcategories: C2Subcategory[],
//     c2Relationships: C2Relationship[],
//     crossC1C2Relationships: CrossC1C2Relationship[]
//   ) {
//     // Create a mapping from C2 names to C2 IDs for relationships
//     const c2NameToIdMap = new Map();
//     c2Subcategories.forEach((c2) => {
//       c2NameToIdMap.set(c2.c2Name, c2.id);
//     });
//     const dagreGraph = new dagre.graphlib.Graph();
//     dagreGraph.setDefaultEdgeLabel(() => ({}));

//     // Set up the graph
//     dagreGraph.setGraph({ rankdir: "TB" });

//     // Add all nodes to dagre
//     const allNodes = [
//       ...graphNodes,
//       ...c1Outputs.map((c1) => ({ ...c1, type: "c1" })),
//       ...c2Subcategories.map((c2) => ({ ...c2, type: "c2" })),
//     ];

//     allNodes.forEach((node) => {
//       dagreGraph.setNode(node.id, { width: 150, height: 50 });
//     });

//     // Add all edges to dagre
//     const allEdges: GraphEdge[] = [
//       ...graphEdges,
//       // Edges from C1 to their C2 subcategories
//       ...c2Subcategories.map((c2) => ({
//         id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
//         source: c2.c1CategoryId,
//         target: c2.id,
//         label: "contains",
//       })),
//       // Edges from C2 to their nodes
//       ...c2Subcategories.flatMap((c2) =>
//         c2.nodeIds.map((nodeId) => ({
//           id: `c2-${c2.id}-to-node-${nodeId}`,
//           source: c2.id,
//           target: nodeId,
//           label: "contains",
//         }))
//       ),
//       // C2 relationships
//       ...c2Relationships
//         .map((rel) => {
//           const sourceId = c2NameToIdMap.get(rel.fromC2);
//           const targetId = c2NameToIdMap.get(rel.toC2);
//           if (!sourceId || !targetId) {
//             // Skip relationships where C2 nodes don't exist
//             return null;
//           }
//           return {
//             id: rel.id,
//             source: sourceId,
//             target: targetId,
//             label: rel.label,
//           };
//         })
//         .filter((edge): edge is GraphEdge => edge !== null),
//       // Cross C1-C2 relationships (connect C2 nodes across different C1 categories)
//       ...crossC1C2Relationships
//         .map((rel) => {
//           const sourceId = c2NameToIdMap.get(rel.fromC2);
//           const targetId = c2NameToIdMap.get(rel.toC2);
//           if (!sourceId || !targetId) {
//             // Skip relationships where C2 nodes don't exist
//             return null;
//           }
//           return {
//             id: rel.id,
//             source: sourceId,
//             target: targetId,
//             label: rel.label,
//           };
//         })
//         .filter((edge): edge is GraphEdge => edge !== null),
//     ];

//     allEdges.forEach((edge) => {
//       if (edge) {
//         dagreGraph.setEdge(edge.source, edge.target);
//       }
//     });

//     // Calculate layout
//     dagre.layout(dagreGraph);

//     // Apply positions to all nodes
//     const positionedGraphNodes = graphNodes.map((node) => {
//       const nodeWithPosition = dagreGraph.node(node.id);
//       return {
//         ...node,
//         position: {
//           x: nodeWithPosition.x - nodeWithPosition.width / 2,
//           y: nodeWithPosition.y - nodeWithPosition.height / 2,
//         },
//       };
//     });

//     const positionedC1Nodes = c1Outputs.map((node) => {
//       const nodeWithPosition = dagreGraph.node(node.id);
//       return {
//         ...node,
//         position: {
//           x: nodeWithPosition.x - nodeWithPosition.width / 2,
//           y: nodeWithPosition.y - nodeWithPosition.height / 2,
//         },
//       };
//     });

//     const positionedC2Nodes = c2Subcategories.map((node) => {
//       const nodeWithPosition = dagreGraph.node(node.id);
//       return {
//         ...node,
//         position: {
//           x: nodeWithPosition.x - nodeWithPosition.width / 2,
//           y: nodeWithPosition.y - nodeWithPosition.height / 2,
//         },
//       };
//     });

//     return {
//       graphNodes: positionedGraphNodes,
//       c1Nodes: positionedC1Nodes,
//       c2Nodes: positionedC2Nodes,
//       edges: allEdges,
//     };
//   }

  async layoutCategoriesWithElk(
    graphNodes: GraphNode[],
    graphEdges: GraphEdge[],
    c1Outputs: C1Output[],
    c2Subcategories: C2Subcategory[],
    c2Relationships: C2Relationship[],
    crossC1C2Relationships: CrossC1C2Relationship[]
  ) {
    const elk = new ELK();
    const graphMap = createAdjacencyMap(graphEdges);
    const graphNodesObj: { [key: string]: GraphNode } = {};
    graphNodes.forEach((node) => {
      graphNodesObj[node.id] = node;
    });

    const processedStubNodes = processStubNodes(
      graphNodesObj,
      graphNodes,
      graphEdges
    );
    let updatedGraphEdgesWithStubs: GraphEdge[] = processedStubNodes.graphEdges;
    let updatedGraphNodes: GraphNode[] = processedStubNodes.graphNodes;


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
    //   sources: compactedNodes.has(edge.source)
    //     ? [edge.source + "-compact-stub"]
    //     : [edge.source],
    //   targets: compactedNodes.has(edge.target)
    //     ? [edge.target + "-compact-stub"]
    //     : [edge.target],
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
