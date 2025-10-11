import { convertDataToGraphNodesAndEdges } from "@/core/data/data-converter";
import { GraphFormatService } from "@/core/graph-format.service";
import { createAdjacencyMap } from "@/core/node-collapse";
import { ReactFlowNode, ReactFlowService } from "@/core/react-flow.service";
import { useGraphStore } from "@/lib/graphStore";
import { ElkExtendedEdge, ElkNode } from "elkjs";
import ELK from "elkjs/lib/elk.bundled.js";

import { useEffect, useMemo } from "react";

export const useGraph = () => {
  const { nodes, edges, setEdges, setNodes, setAdjacencyMap } = useGraphStore();

  const graphFormatService = useMemo(() => new GraphFormatService(), []);
  const reactFlowService = useMemo(() => new ReactFlowService(), []);
  const elk = useMemo(() => new ELK(), []);
  const {
    graphNodes,
    graphEdges,
    c1Output,
    c2Subcategories,
    c2Relationships,
    crossC1C2Relationships,
  } = useMemo(() => convertDataToGraphNodesAndEdges(), []);

  useEffect(() => {
    graphFormatService
      .layoutCategoriesWithElk(
        elk,
        graphNodes,
        graphEdges,
        c1Output,
        c2Subcategories,
        c2Relationships,
        crossC1C2Relationships
      )
      .then((layoutedData) => {
        const { nodes: initialNodes, edges: initialEdges } =
          reactFlowService.convertDataToReactFlowDataTypes(
            layoutedData.graphNodes,
            layoutedData.c1Nodes,
            layoutedData.c2Nodes,
            layoutedData.edges
          );
        setAdjacencyMap(createAdjacencyMap(initialEdges));
        setEdges(initialEdges);
        setNodes(initialNodes);
      });
  }, []);

//   const relayoutElk = async () => {
//     console.log("Relayouting with ELK");
//     const visibleNodes = useGraphStore
//       .getState()
//       .nodes.filter((n) => !n.hidden);
//     const visibleEdges = useGraphStore
//       .getState()
//       .edges.filter((e) => !e.hidden);

//     const elkEdges: ElkExtendedEdge[] = visibleEdges.map((edge) => ({
//       id: edge.id,
//       sources: [edge.source],
//       targets: [edge.target],
//     }));

//     const elkGraph: ElkNode = {
//       id: "root",
//       layoutOptions: {
//         algorithm: "layered",
//         "elk.direction": "DOWN",
//         "elk.layered.spacing.nodeNodeBetweenLayers": "80",
//         "elk.spacing.nodeNode": "40",
        
//       },
//       children: visibleNodes,
//       edges: elkEdges,
//     };

//     const layoutedGraph = await elk.layout(elkGraph);
//     const positionedLookup = new Map<string, { x: number; y: number }>();

//     layoutedGraph.children?.forEach((child: ElkNode) => {
//       if (child.x !== undefined && child.y !== undefined) {
//         positionedLookup.set(child.id, { x: child.x, y: child.y });
//       }
//     });

//     const mapPosition = <T extends { id: string }>(items: T[]) =>
//       items.map((item) => {
//         const position = positionedLookup.get(item.id) ?? { x: 0, y: 0 };
//         return {
//           ...item,

//           position: {
//             x: position.x,
//             y: position.y,
//           },
//         };
//       });
//       console.log("Setting nodes after relayout", visibleNodes);
//     setNodes(mapPosition(visibleNodes));
//   };

//   useEffect(() => {
//     if (edges.length > 0) relayoutElk();
//   }, [edges]);

  return { nodes, edges, setEdges, setNodes };
};
