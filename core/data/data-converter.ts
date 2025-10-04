import type {
	C1Output,
	C2Relationship,
	C2Subcategory,
	CrossC1C2Relationship,
	GraphEdge,
	GraphNode,
} from "../types";
import analysisData from "./analysis.json";

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

	const graphEdges: GraphEdge[] = analysisData.analysisData.graphEdges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label ?? "",
	}));

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
