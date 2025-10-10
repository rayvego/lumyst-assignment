import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
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

		const bidirectionalEdges = this.detectBidirectionalEdges(edges);
		const reactFlowEdges = this.createReactFlowEdges(edges, bidirectionalEdges);

		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}

	private detectBidirectionalEdges(edges: GraphEdge[]): Map<string, { edge1: GraphEdge; edge2: GraphEdge }> {
		const bidirectionalMap = new Map<string, { edge1: GraphEdge; edge2: GraphEdge }>();
		
		for(let i = 0; i < edges.length; i++){
			for(let j = i + 1; j < edges.length; j++){
				const edge1 = edges[i];
				const edge2 = edges[j];
				
				// (A->B and B-> A)
				if(edge1.source === edge2.target && edge1.target === edge2.source){
					const key = `${edge1.source}-${edge1.target}`;
					bidirectionalMap.set(key, { edge1, edge2 });
				}
			}
		}
		
		return bidirectionalMap;
	}

	private createReactFlowEdges(edges: GraphEdge[], bidirectionalEdges: Map<string, { edge1: GraphEdge; edge2: GraphEdge }>): any[] {
		const processedEdges = new Set<string>();
		const reactFlowEdges: any[] = [];

		edges.forEach((edge) => {
			const edgeKey = `${edge.source}-${edge.target}`;
			const reverseKey = `${edge.target}-${edge.source}`;
			
			if(processedEdges.has(edgeKey) || processedEdges.has(reverseKey)){
				return;
			}

			const bidirectionalPair = bidirectionalEdges.get(edgeKey) || bidirectionalEdges.get(reverseKey);
			
			if (bidirectionalPair){
				const { edge1, edge2 } = bidirectionalPair;
				
				// First edge
				reactFlowEdges.push({
					id: edge1.id,
					source: edge1.source,
					target: edge1.target,
					label: edge1.label,
					type: 'default',
					style: this.getEdgeStyle(edge1),
					labelStyle: { 
						fill: '#000', 
						fontWeight: '500',
						transform: 'translate(0, -15px)'
					},
					labelBgStyle: {
						fill: 'white',
						fillOpacity: 0.8,
						stroke: 'none'
					},
					labelShowBg: true,
					pathOptions: {
						curvature: 0.4,
					},
				});

				// Second edge
				reactFlowEdges.push({
					id: edge2.id,
					source: edge2.source,
					target: edge2.target,
					label: edge2.label,
					type: 'default',
					style: this.getEdgeStyle(edge2),
					labelStyle: { 
						fill: '#000', 
						fontWeight: '500',
						transform: 'translate(0, 15px)'
					},
					labelBgStyle: {
						fill: 'white',
						fillOpacity: 0.8,
						stroke: 'none'
					},
					labelShowBg: true,
					pathOptions: {
						curvature: -0.4,
					},
				});

				processedEdges.add(`${edge1.source}-${edge1.target}`);
				processedEdges.add(`${edge2.source}-${edge2.target}`);
			}else{
				// Regular edge
				reactFlowEdges.push({
					id: edge.id,
					source: edge.source,
					target: edge.target,
					label: edge.label,
					type: 'default',
					style: this.getEdgeStyle(edge),
					labelStyle: { 
						fill: '#000', 
						fontWeight: '500' 
					},
					labelBgStyle: {
						fill: 'white',
						fillOpacity: 0.8,
						stroke: 'none'
					},
					labelShowBg: true,
					pathOptions: {
						curvature: 0.25,
					},
				});

				processedEdges.add(edgeKey);
			}
		});

		return reactFlowEdges;
	}

	private getEdgeStyle(edge: GraphEdge): any {
		if(edge.label === 'contains'){
			return { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 };
		}else if(edge.id.startsWith('c2_relationship')){
			return { stroke: '#059669', strokeWidth: 2 };
		}else if(edge.id.startsWith('cross_c1_c2_rel')){
			return { stroke: '#d97706', strokeWidth: 2 };
		}else{
			return { stroke: '#374151', strokeWidth: 1 };
		}
	}
}
