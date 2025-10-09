import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';
import { HierarchicalLayoutService, type LayoutConfig } from './hierarchical-layout.service';
import { GraphLayoutManagerService, type LayoutAnalysis, type LayoutMetrics } from './graph-layout-manager.service';
import { type LayoutPreset } from './layout-config.service';

export class ReactFlowService {
	private hierarchicalLayoutService = new HierarchicalLayoutService();
	private layoutManager = new GraphLayoutManagerService();

	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[],
		useHierarchicalLayout = true,
		layoutPreset?: LayoutPreset,
		customLayoutConfig?: Partial<LayoutConfig>
	): {
		nodes: any[];
		edges: any[];
		layoutInfo?: {
			analysis: LayoutAnalysis;
			metrics: LayoutMetrics;
			suggestions: string[];
			boundingBox: { width: number; height: number };
		};
	} {
		let layoutInfo: any = undefined;

		// Apply hierarchical layout if requested
		if (useHierarchicalLayout) {
			const layoutResult = this.layoutManager.applyOptimalLayout(
				graphNodes,
				c1Nodes,
				c2Nodes,
				edges,
				layoutPreset
			);
			
			const convertedData = this.hierarchicalLayoutService.convertToReactFlowFormat(layoutResult.nodes);
			graphNodes = convertedData.graphNodes;
			c1Nodes = convertedData.c1Nodes;
			c2Nodes = convertedData.c2Nodes;

			// Provide layout analysis and suggestions
			const suggestions = this.layoutManager.suggestLayoutImprovements(
				layoutResult.analysis,
				layoutResult.metrics
			);

			layoutInfo = {
				analysis: layoutResult.analysis,
				metrics: layoutResult.metrics,
				suggestions,
				boundingBox: layoutResult.boundingBox
			};
		}
		const reactFlowNodes = [
			// Regular graph nodes
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#dbeafe',
					border: '2px solid #3b82f6',
					color: '#1e40af',
					borderRadius: '6px'
				},
			})),
			// C1 category nodes
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#fef2f2',
					border: '3px solid #dc2626',
					color: '#991b1b',
					fontWeight: 'bold',
					borderRadius: '6px'
				},
			})),
			// C2 subcategory nodes
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { label: node.label },
				type: 'default',
				style: {
					background: '#f0fdf4',
					border: '2px solid #16a34a',
					color: '#166534',
					borderRadius: '6px'
				},
			}))
		];

		const reactFlowEdges = edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			style: edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 } // Dashed light gray for containment
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 } // Dark green for C2-C2 relationships
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 } // Dark orange for cross C1-C2 relationships
				: { stroke: '#374151', strokeWidth: 1 }, // Dark gray for other edges
			labelStyle: { fill: '#000', fontWeight: '500' },
		}));

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
			layoutInfo
		};
	}

	/**
	 * Quick method to get layout analysis without applying layout
	 */
	analyzeGraphStructure(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	): LayoutAnalysis {
		return this.layoutManager.analyzeGraphStructure(graphNodes, c1Nodes, c2Nodes, edges);
	}

	/**
	 * Get layout suggestions for improving graph visualization
	 */
	getLayoutSuggestions(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	): {
		analysis: LayoutAnalysis;
		recommendations: string[];
	} {
		const analysis = this.layoutManager.analyzeGraphStructure(graphNodes, c1Nodes, c2Nodes, edges);
		
		const recommendations: string[] = [];
		
		if (analysis.complexity === 'very-high') {
			recommendations.push("Consider using 'clustered' or 'compact' layout for better performance with large graphs");
			recommendations.push("Enable performance optimizations for smoother interaction");
		}
		
		if (analysis.clusterCount > 10) {
			recommendations.push("High number of clusters detected - 'clustered' preset recommended");
		}
		
		if (analysis.maxDegree > 15) {
			recommendations.push("High-degree nodes detected - consider highlighting central components");
		}
		
		recommendations.push(`Recommended layout preset: ${analysis.recommendedPreset}`);
		
		return { analysis, recommendations };
	}
}
