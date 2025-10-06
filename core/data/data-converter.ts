import type {
	C1Output,
	C2Relationship,
	C2Subcategory,
	CrossC1C2Relationship,
	GraphEdge,
	GraphNode,
} from "../types";
// Switch to the variant that includes raw code and types
import analysisWithCode from "./analysis-with-code.json";
import analysisBase from "./analysis.json";

// Describe the JSON structure to satisfy TypeScript and avoid implicit anys
type RawAnalysis = {
    analysisData: {
        graphNodes: Array<{ id: string; label: string; code?: string | null; type?: string; filePath?: string }>;
        graphEdges: Array<{ id: string; source: string; target: string; label?: string }>;
        c1Output: Array<{ id: string; c1Category: string; nodesInCategory: number; nodeIds: string[] }>;
        c2Subcategories: Array<{ id: string; c1CategoryId: string; c2Name: string; description: string; purpose: string; nodeCount: number; nodeIds: string[] }>;
        c2Relationships: Array<{ id: string; c1CategoryId: string; fromC2: string; toC2: string; relationshipType: string }>;
        crossC1C2Relationships: Array<{ id: string; fromC1: string; fromC2: string; toC1: string; toC2: string; relationshipType: string }>;
    };
};

const rawWC = analysisWithCode as unknown as Partial<RawAnalysis>;
const rawBase = analysisBase as unknown as Partial<RawAnalysis>;

// Prefer the richer with-code dataset when present, otherwise fall back to base
const ad = {
    graphNodes: (rawWC.analysisData?.graphNodes ?? rawBase.analysisData?.graphNodes ?? []) as RawAnalysis["analysisData"]["graphNodes"],
    graphEdges: (rawWC.analysisData?.graphEdges ?? rawBase.analysisData?.graphEdges ?? []) as RawAnalysis["analysisData"]["graphEdges"],
    c1Output: (rawWC.analysisData?.c1Output ?? rawBase.analysisData?.c1Output ?? []) as RawAnalysis["analysisData"]["c1Output"],
    c2Subcategories: (rawWC.analysisData?.c2Subcategories ?? rawBase.analysisData?.c2Subcategories ?? []) as RawAnalysis["analysisData"]["c2Subcategories"],
    c2Relationships: (rawWC.analysisData?.c2Relationships ?? rawBase.analysisData?.c2Relationships ?? []) as RawAnalysis["analysisData"]["c2Relationships"],
    crossC1C2Relationships: (rawWC.analysisData?.crossC1C2Relationships ?? rawBase.analysisData?.crossC1C2Relationships ?? []) as RawAnalysis["analysisData"]["crossC1C2Relationships"],
};

export function convertDataToGraphNodesAndEdges(): {
	graphNodes: GraphNode[];
	graphEdges: GraphEdge[];
	c1Output: C1Output[];
	c2Subcategories: C2Subcategory[];
	c2Relationships: C2Relationship[];
	crossC1C2Relationships: CrossC1C2Relationship[];
} {
    const graphNodes: GraphNode[] = ad.graphNodes.map((node) => ({
        id: node.id,
        label: node.label,
        // carry over optional extras for ranking heuristics and display
        filePath: (node.id && typeof node.id === 'string' && node.id.startsWith('code:')) ? node.id.split(":")[1] : (node.filePath ?? undefined),
        syntaxType: (node.type as string) ?? undefined,
        code: (node.code as string) ?? undefined,
    }));

    const graphEdges: GraphEdge[] = ad.graphEdges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label ?? "",
	}));

    const c1Output: C1Output[] = ad.c1Output.map((output) => ({
		id: output.id,
		label: output.c1Category,
		c1Category: output.c1Category,
		nodesInCategory: output.nodesInCategory,
		nodeIds: output.nodeIds,
	}));

    const c2Subcategories: C2Subcategory[] = ad.c2Subcategories.map(
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

    const c2Relationships: C2Relationship[] = ad.c2Relationships.map(
        (relationship) => ({
			id: relationship.id,
			label: relationship.relationshipType,
			fromC2: relationship.fromC2,
			toC2: relationship.toC2,
			c1CategoryId: relationship.c1CategoryId,
		}),
	);

    const crossC1C2Relationships: CrossC1C2Relationship[] =
        ad.crossC1C2Relationships.map((relationship) => ({
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
