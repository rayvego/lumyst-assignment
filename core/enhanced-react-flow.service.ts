import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

interface EnhancedNode {
	id: string;
	position: { x: number; y: number };
	data: any;
	type: string;
	style?: Record<string, any>;
	zIndex?: number;
	draggable?: boolean;
}

interface EnhancedEdge {
	id: string;
	source: string;
	target: string;
	label?: string;
	type?: string;
	animated?: boolean;
	style?: Record<string, any>;
	labelStyle?: Record<string, any>;
	zIndex?: number;
}

/**
 * Enhanced React Flow Service with Visual Hierarchy
 * 
 * Features:
 * - Group background nodes for C1 and C2
 * - Color-coded node types
 * - Smart edge styling based on relationship type
 * - Proper z-index layering
 */
export class EnhancedReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		const nodes: EnhancedNode[] = [];

		// Layer 1: C1 Group Background Nodes (lowest z-index)
		c1Nodes.forEach((c1) => {
			nodes.push({
				id: `group-${c1.id}`,
				position: { x: c1.position?.x ?? 0, y: c1.position?.y ?? 0 },
				data: { label: '' },
				type: 'default',
				draggable: false,
				zIndex: -2,
				style: {
					width: `${c1.bounds?.width ?? 300}px`,
					height: `${c1.bounds?.height ?? 200}px`,
					background: 'linear-gradient(135deg, rgba(254, 226, 226, 0.3) 0%, rgba(252, 231, 243, 0.3) 100%)',
					border: '2px dashed rgba(220, 38, 38, 0.3)',
					borderRadius: '16px',
					padding: '0',
					zIndex: -2,
				},
			});
		});

		// Layer 2: C2 Group Background Nodes
		c2Nodes.forEach((c2) => {
			nodes.push({
				id: `group-${c2.id}`,
				position: { x: c2.position?.x ?? 0, y: c2.position?.y ?? 0 },
				data: { label: '' },
				type: 'default',
				draggable: false,
				zIndex: -1,
				style: {
					width: `${c2.bounds?.width ?? 220}px`,
					height: `${c2.bounds?.height ?? 150}px`,
					background: 'linear-gradient(135deg, rgba(220, 252, 231, 0.4) 0%, rgba(209, 250, 229, 0.4) 100%)',
					border: '2px dashed rgba(22, 163, 74, 0.4)',
					borderRadius: '12px',
					padding: '0',
					zIndex: -1,
				},
			});
		});

		// Layer 3: C1 Category Nodes (header nodes)
		c1Nodes.forEach((c1) => {
			nodes.push({
				id: c1.id,
				position: { x: c1.position?.x ?? 0, y: c1.position?.y ?? 0 },
				data: {
					label: c1.label,
					categoryData: {
						c1Category: c1.c1Category,
						nodesInCategory: c1.nodesInCategory,
					},
				},
				type: 'c1CategoryNode',
				zIndex: 100,
				style: {
					width: '280px',
					height: '70px',
				},
			});
		});

		// Layer 4: C2 Subcategory Nodes
		c2Nodes.forEach((c2) => {
			nodes.push({
				id: c2.id,
				position: { x: c2.position?.x ?? 0, y: c2.position?.y ?? 0 },
				data: {
					label: c2.label,
					categoryData: {
						c2Name: c2.c2Name,
						nodeCount: c2.nodeCount,
						description: c2.description,
					},
				},
				type: 'c2SubcategoryNode',
				zIndex: 50,
				style: {
					width: '200px',
					height: '50px',
				},
			});
		});

		// Layer 5: Graph Nodes (code elements)
		graphNodes.forEach((node) => {
			nodes.push({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: {
					label: node.label,
					type: this.inferNodeType(node.id),
					filePath: String(this.extractFilePath(node.id)),
					syntaxType: this.extractSyntaxType(node.id),
				},
				type: 'graphNode',
				zIndex: 10,
				style: {
					width: '200px',
					height: '45px',
				},
			});
		});

		// Enhanced Edge Styling
		const reactFlowEdges: EnhancedEdge[] = edges.map((edge) => {
			const edgeType = this.getEdgeType(edge);
			const isContainment = edge.label === 'contains';
			const isC2Relationship = edge.id.startsWith('c2_relationship');
			const isCrossRelationship = edge.id.startsWith('cross_c1_c2_rel');

			return {
				id: edge.id,
				source: edge.source,
				target: edge.target,
				label: edge.label,
				type: edgeType,
				animated: isCrossRelationship,
				zIndex: isContainment ? 1 : 5,
				style: {
					stroke: isContainment
						? 'rgba(156, 163, 175, 0.3)' // Light gray for containment
						: isC2Relationship
						? 'rgba(22, 163, 74, 0.8)' // Green for C2-C2
						: isCrossRelationship
						? 'rgba(249, 115, 22, 0.9)' // Orange for cross-C1
						: 'rgba(55, 65, 81, 0.6)', // Dark gray for code edges
					strokeWidth: isContainment ? 1 : isCrossRelationship ? 3 : 2,
					strokeDasharray: isContainment ? '5,5' : undefined,
				},
				labelStyle: {
					fill: '#374151',
					fontWeight: 500,
					fontSize: '11px',
					background: 'white',
					padding: '2px 4px',
					borderRadius: '4px',
				},
			};
		});

		return {
			nodes,
			edges: reactFlowEdges,
		};
	}

	private getEdgeType(edge: GraphEdge): string {
		if (edge.label === 'contains') return 'straight';
		if (edge.id.startsWith('cross_c1_c2_rel')) return 'smoothstep';
		if (edge.id.startsWith('c2_relationship')) return 'default';
		return 'default';
	}

	private inferNodeType(nodeId: string): string {
		if (nodeId.includes(':class:') || nodeId.includes('Class:')) return 'class';
		if (nodeId.includes(':function:') || nodeId.includes('def ')) return 'function';
		if (nodeId.includes(':method:') || nodeId.includes('__init__')) return 'method';
		if (nodeId.startsWith('file:')) return 'file';
		return 'code';
	}

	private extractFilePath(nodeId: string): string {
		const match = nodeId.match(/code:([^:]+):/);
		return match ? match[1] : '';
	}

	private extractSyntaxType(nodeId: string): string {
		if (nodeId.includes('__init__')) return 'constructor';
		if (nodeId.includes('__')) return 'magic method';
		if (nodeId.startsWith('file:')) return 'file';
		return 'function';
	}
}

