import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		// Calculate how many incoming edges each node has
		const incomingEdgeCounts = new Map<string, number>();
		edges.forEach(edge => {
			incomingEdgeCounts.set(edge.target, (incomingEdgeCounts.get(edge.target) || 0) + 1);
		});

		const reactFlowNodes = [
			// Regular graph nodes - using enhanced custom graphNode
			...graphNodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { 
					label: node.label, 
					kind: 'graph' as const,
					type: 'file', // Default type for graph nodes
					incomingEdgeCount: incomingEdgeCounts.get(node.id) || 0
				},
				type: 'graphNode',
			})),
			// C1 category nodes - using enhanced custom c1CategoryNode
			...c1Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { 
					label: node.label, 
					kind: 'c1' as const,
					categoryData: {
						c1Category: node.c1Category,
						nodesInCategory: node.nodesInCategory,
					},
					incomingEdgeCount: incomingEdgeCounts.get(node.id) || 0
				},
				type: 'c1CategoryNode',
			})),
			// C2 subcategory nodes - using enhanced custom c2SubcategoryNode
			...c2Nodes.map((node) => ({
				id: node.id,
				position: node.position || { x: 0, y: 0 },
				data: { 
					label: node.label, 
					kind: 'c2' as const,
					categoryData: {
						c2Name: node.c2Name,
						nodeCount: node.nodeCount,
						description: node.description,
					},
					incomingEdgeCount: incomingEdgeCounts.get(node.id) || 0
				},
				type: 'c2SubcategoryNode',
			}))
		];

	
	// Create a map to track which handle index each edge should use for its target
	const targetHandleAssignments = new Map<string, number>();
	
	const reactFlowEdges = edges.map((edge, index) => {
		// Determine edge color and style based on type
		const isContains = edge.label === 'contains';
		const isC2Relationship = edge.id.startsWith('c2_relationship');
		const isCrossC1C2Rel = edge.id.startsWith('cross_c1_c2_rel');
		
		let color: string;
		let strokeColor: string;
		let strokeStyle: any;
		let edgeType: string;
		
		if (isContains) {
			color = '#9ca3af'; // Light gray for containment
			strokeColor = '#9ca3af';
			strokeStyle = { stroke: strokeColor, strokeDasharray: '5,5', strokeWidth: 1.5 };
			edgeType = 'smoothstep'; // Use smoothstep for containment
		} else if (isC2Relationship) {
			color = '#059669'; // Dark green for C2-C2 relationships
			strokeColor = '#059669';
			strokeStyle = { stroke: strokeColor, strokeWidth: 2 };
			edgeType = 'smoothstep'; // Use smoothstep for C2 relationships
		} else if (isCrossC1C2Rel) {
			color = '#d97706'; // Dark orange for cross C1-C2 relationships
			strokeColor = '#d97706';
			strokeStyle = { stroke: strokeColor, strokeWidth: 2 };
			edgeType = 'smoothstep'; // Use smoothstep for cross relationships
		} else {
			color = '#374151'; // Dark gray for other edges
			strokeColor = '#374151';
			strokeStyle = { stroke: strokeColor, strokeWidth: 1.5 };
			edgeType = 'smoothstep'; // Use smoothstep for other edges
		}

		// Assign a handle index for the target node if it has multiple incoming edges
		const incomingCount = incomingEdgeCounts.get(edge.target) || 0;
		let targetHandle: string | undefined;
		
		if (incomingCount > 1) {
			const currentAssignment = targetHandleAssignments.get(edge.target) || 0;
			targetHandle = `target-${currentAssignment}`;
			targetHandleAssignments.set(edge.target, (currentAssignment + 1) % 4); // Cycle through 4 handles
		}

		return {
			id: edge.id,
			source: edge.source,
			target: edge.target,
			label: edge.label,
			type: edgeType,
			targetHandle,
			markerEnd: {
				type: 'arrowclosed' as const,
				color: color,
				width: isContains ? 20 : 24,
				height: isContains ? 20 : 24,
			},
			style: {
				...strokeStyle,
				strokeLinecap: 'round' as const,
			},
			labelStyle: { 
				fill: strokeColor, 
				fontWeight: '600',
				fontSize: '11px',
				backgroundColor: 'rgba(255, 255, 255, 0.9)',
				padding: '2px 4px',
				borderRadius: '3px',
			},
			// Simple path options for clean routing
			pathOptions: {
				borderRadius: 8,
			},
		};
	});


		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}
