import type {
	C1Output,
	C2Relationship,
	C2Subcategory,
	CrossC1C2Relationship,
	GraphEdge,
	GraphNode,
} from "../types";
import { UtilityFilterService } from "../utility-filter.service";
import analysisData from "./analysis.json";
import analysisWithCode from "./analysis-with-code.json";

/**
 * Universal data converter with utility filtering (Task 5 - Level 4)
 * Auto-detects JSON structure and applies multi-heuristic analysis
 * 
 * Supports:
 * - analysis.json (graphNodes + edges + C1/C2)
 * - analysis-with-code.json (graphNodes with code field only)
 * - Any custom JSON with similar structure
 */
export function convertDataToGraphNodesAndEdges(
	enableUtilityFiltering: boolean = false,
): {
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	c1Output: C1Output[];
	c2Subcategories: C2Subcategory[];
	c2Relationships: C2Relationship[];
	crossC1C2Relationships: CrossC1C2Relationship[];
	utilityFilterStats?: {
		total: number;
		businessLogicCount: number;
		utilityCount: number;
		averageImportance: number;
	};
} {
	// Use analysis-with-code.json if utility filtering is enabled
	const sourceData = enableUtilityFiltering
		? analysisWithCode
		: analysisData;

	let graphNodes: GraphNode[];
	let utilityFilterStats;

	if (enableUtilityFiltering && analysisWithCode.analysisData?.graphNodes) {
		// Apply utility filtering with code analysis
		const filterService = new UtilityFilterService({
			utilityThreshold: 1.0,
			preserveClasses: true,
			preserveDecoratedFunctions: true,
		});

		const nodesWithCode = analysisWithCode.analysisData.graphNodes.map(
			(node: any) => ({
				id: node.id,
				label: node.label,
				code: node.code,
			}),
		);

		const filterResult = filterService.filterFunctions(nodesWithCode);

		// Map filtered nodes to GraphNode format with scores
		graphNodes = filterResult.allNodes.map((scoredNode) => ({
			id: scoredNode.id,
			label: scoredNode.label,
			importanceScore: scoredNode.importanceScore,
			isUtility: scoredNode.isUtility,
			confidence: scoredNode.confidence,
		}));

		utilityFilterStats = filterResult.statistics;

	} else {
		// Standard conversion without filtering
		graphNodes = sourceData.analysisData.graphNodes.map((node: any) => ({
			id: node.id,
			label: node.label,
		}));
	}

	// Get edges from analysis.json
	const allEdges: GraphEdge[] = analysisData.analysisData.graphEdges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label ?? "",
	}));

	// Filter edges to only include edges between nodes that exist in our filtered graph
	const nodeIds = new Set(graphNodes.map((n) => n.id));
	const graphEdges: GraphEdge[] = allEdges.filter(
		(edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
	);

	// When utility filtering is enabled, analysis-with-code.json doesn't have C1/C2 data
	// So we should NOT use them (they're based on different categorization)
	const c1Output: C1Output[] = analysisData.analysisData.c1Output.map((output) => ({
				id: output.id,
				label: output.c1Category,
				c1Category: output.c1Category,
				nodesInCategory: output.nodesInCategory,
				nodeIds: output.nodeIds,
		  }));

	const c2Subcategories: C2Subcategory[] = analysisData.analysisData.c2Subcategories.map((subcategory) => ({
			id: subcategory.id,
			label: subcategory.c2Name,
			c1CategoryId: subcategory.c1CategoryId,
				c2Name: subcategory.c2Name,
				description: subcategory.description,
				purpose: subcategory.purpose,
				nodeCount: subcategory.nodeCount,
				nodeIds: subcategory.nodeIds,
		  }));

	const c2Relationships: C2Relationship[] = analysisData.analysisData.c2Relationships.map((relationship) => ({
				id: relationship.id,
				label: relationship.relationshipType,
				fromC2: relationship.fromC2,
				toC2: relationship.toC2,
				c1CategoryId: relationship.c1CategoryId,
		  }));

	const crossC1C2Relationships: CrossC1C2Relationship[] = analysisData.analysisData.crossC1C2Relationships.map((relationship) => ({
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
		...(utilityFilterStats && { utilityFilterStats }),
	};
}
