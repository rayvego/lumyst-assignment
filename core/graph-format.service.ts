import { LayoutAlgorithmService } from './layout-algorithm.service';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory, C2Relationship, CrossC1C2Relationship } from './types';

export class GraphFormatService {
	private layoutService: LayoutAlgorithmService;

	constructor() {
		this.layoutService = new LayoutAlgorithmService();
	}

	/**
	 * Main layout function using the advanced hierarchical algorithm
	 * Provides optimal spacing, minimal edge crossings, and clear cluster separation
	 */
	layoutCategoriesWithNodes(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		// Use the advanced layout algorithm with default configuration
		return this.layoutService.layoutGraph(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		);
	}

	/**
	 * Alternative layout with minimal edge crossings
	 * Best for graphs with many interconnections
	 */
	layoutWithMinimalCrossings(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		return this.layoutService.layoutWithMinimalCrossings(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		);
	}

	/**
	 * Compact layout for viewing large graphs
	 * Reduces spacing to fit more content on screen
	 */
	layoutCompact(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		return this.layoutService.layoutCompact(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		);
	}

	/**
	 * Wide layout with extra horizontal space
	 * Best for detailed analysis and reducing horizontal congestion
	 */
	layoutWide(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[]
	) {
		return this.layoutService.layoutWide(
			graphNodes,
			graphEdges,
			c1Outputs,
			c2Subcategories,
			c2Relationships,
			crossC1C2Relationships
		);
	}
}
