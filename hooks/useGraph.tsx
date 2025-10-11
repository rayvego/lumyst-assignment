import { convertDataToGraphNodesAndEdges } from "@/core/data/data-converter";
import { GraphFormatService } from "@/core/graph-format.service";
import { ReactFlowService } from "@/core/react-flow.service";
import { useGraphStore } from "@/lib/graphStore";
import { createAdjacencyMap } from "@/lib/utils";
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
  return { nodes, edges, setEdges, setNodes };
};
