import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";
import type {
	C1Output,
	C2Relationship,
	C2Subcategory,
	CrossC1C2Relationship,
	GraphEdge,
	GraphNode,
} from "./types";

type LayoutResult = {
	graphNodes: GraphNode[];
	c1Nodes: C1Output[];
	c2Nodes: C2Subcategory[];
	edges: GraphEdge[];
};

export class ElkLayoutService {
	private elk = new ELK();

	async layoutCategoriesWithNodes(
		graphNodes: GraphNode[],
		graphEdges: GraphEdge[],
		c1Outputs: C1Output[],
		c2Subcategories: C2Subcategory[],
		c2Relationships: C2Relationship[],
		crossC1C2Relationships: CrossC1C2Relationship[],
	): Promise<LayoutResult> {
		// Calculate dynamic node sizes based on label length
		const calculateNodeSize = (label: string, type: 'graph' | 'c1' | 'c2') => {
			const baseWidth = type === 'graph' ? 120 : 140;
			const maxWidth = type === 'graph' ? 280 : 300;
			const charWidth = 8; // Approximate character width
			const padding = 16; // Left + right padding
			
			const estimatedWidth = Math.min(maxWidth, Math.max(baseWidth, label.length * charWidth + padding));
			const height = Math.max(40, Math.ceil(label.length / (estimatedWidth / charWidth)) * 16 + 12); // Multi-line height
			
			return { width: estimatedWidth, height };
		};

		// Create mapping from C2 name -> C2 ID
		const c2NameToIdMap = new Map<string, string>();
		c2Subcategories.forEach(c2 => {
			c2NameToIdMap.set(c2.c2Name, c2.id);
		});

		const elkNodes = [
			...c1Outputs.map((n) => {
				const size = calculateNodeSize(n.label, 'c1');
				return { id: n.id, width: size.width, height: size.height };
			}),
			...c2Subcategories.map((n) => {
				const size = calculateNodeSize(n.label, 'c2');
				return { id: n.id, width: size.width, height: size.height };
			}),
			...graphNodes.map((n) => {
				const size = calculateNodeSize(n.label, 'graph');
				return { id: n.id, width: size.width, height: size.height };
			}),
		];

		const c2ContainmentEdges: GraphEdge[] = c2Subcategories.map((c2) => ({
			id: `c1-${c2.c1CategoryId}-to-c2-${c2.id}`,
			source: c2.c1CategoryId,
			target: c2.id,
			label: "contains",
		}));

		const c2ToNodeContains: GraphEdge[] = c2Subcategories.flatMap((c2) =>
			c2.nodeIds.map((nodeId) => ({
				id: `c2-${c2.id}-to-node-${nodeId}`,
				source: c2.id,
				target: nodeId,
				label: "contains",
			}))
		);

		// Map C2 relationships using name->ID lookup
		const c2RelEdges: GraphEdge[] = c2Relationships
			.map((rel) => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) return null;
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label,
				};
			})
			.filter((e): e is GraphEdge => e !== null);

		const crossC1C2RelEdges: GraphEdge[] = crossC1C2Relationships
			.map((rel) => {
				const sourceId = c2NameToIdMap.get(rel.fromC2);
				const targetId = c2NameToIdMap.get(rel.toC2);
				if (!sourceId || !targetId) return null;
				return {
					id: rel.id,
					source: sourceId,
					target: targetId,
					label: rel.label,
				};
			})
			.filter((e): e is GraphEdge => e !== null);

		const allEdges = [
			...graphEdges,
			...c2ContainmentEdges,
			...c2ToNodeContains,
			...c2RelEdges,
			...crossC1C2RelEdges,
		];

		// Validate edges - check if source and target nodes exist
		const allNodeIds = new Set(elkNodes.map(n => n.id));
		const validEdges = allEdges.filter(e => {
			const sourceExists = allNodeIds.has(e.source);
			const targetExists = allNodeIds.has(e.target);
			return sourceExists && targetExists;
		});

		const elkEdges = validEdges.map((e) => ({ id: e.id, sources: [e.source], targets: [e.target] }));

		const elkGraph = {
			id: "root",
			children: elkNodes,
			edges: elkEdges,
			layoutOptions: {
				"elk.algorithm": "layered",
				// General spacing
				"elk.spacing.nodeNode": "80",
				"elk.spacing.edgeNode": "50",
				"elk.spacing.edgeEdge": "30",
				// Between-layer spacing
				"elk.layered.spacing.nodeNodeBetweenLayers": "150",
				"elk.layered.spacing.edgeNodeBetweenLayers": "100",
				"elk.layered.spacing.edgeEdgeBetweenLayers": "60",
				// Edge routing and straightness
				"elk.layered.edgeRouting": "POLYLINE",
				"elk.layered.nodePlacement.favorStraightEdges": "true",
				"elk.layered.mergeEdges": "true",
				"elk.layered.cycleBreaking.strategy": "INTERACTIVE",
				"elk.layered.crossingMinimization.semiInteractive": "true",
				"elk.layered.nodePlacement.strategy": "BRANDES_KOEPF",
				"elk.layered.compaction.postCompaction.enabled": "true",
				"elk.direction": "DOWN",
				"elk.aspectRatio": "1.2",
				"elk.layered.thoroughness": "5",
				// Center the layout
				"elk.layered.nodePlacement.bk.fixedAlignment": "BALANCED",
				"elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
			},
		} as const;

		const laidOut = await this.elk.layout(elkGraph as ElkNode);

		const posMap = new Map<string, { x: number; y: number }>();
		for (const child of (laidOut.children ?? [])) {
			posMap.set(child.id as string, { x: (child.x as number) ?? 0, y: (child.y as number) ?? 0 });
		}

		// Find the root node (fastapi) and center it
		const rootNodeId = "code:fastapi/applications.py:FastAPI:50"; // The fastapi root node ID
		const rootPosition = posMap.get(rootNodeId);
		
		if (rootPosition) {
			// Calculate offset to move root node to center (0, 0)
			const offsetX = -rootPosition.x;
			const offsetY = -rootPosition.y;
			
			// Apply offset to all positions to center the root node
			for (const [id, pos] of posMap.entries()) {
				posMap.set(id, { 
					x: pos.x + offsetX, 
					y: pos.y + offsetY 
				});
			}
		} else {
			// Fallback: center the entire graph if root node not found
			const positions = Array.from(posMap.values());
			if (positions.length > 0) {
				const minX = Math.min(...positions.map(p => p.x));
				const maxX = Math.max(...positions.map(p => p.x));
				const minY = Math.min(...positions.map(p => p.y));
				const maxY = Math.max(...positions.map(p => p.y));
				
				// Calculate center offset to center the graph
				const centerX = (minX + maxX) / 2;
				const centerY = (minY + maxY) / 2;
				
				// Apply centering offset to all positions
				for (const [id, pos] of posMap.entries()) {
					posMap.set(id, { 
						x: pos.x - centerX, 
						y: pos.y - centerY 
					});
				}
			}
		}

		const snap = (v: number) => Math.round(v / 10) * 10;

		const positionedGraphNodes: GraphNode[] = graphNodes.map((n) => {
			const p = posMap.get(n.id) ?? { x: 0, y: 0 };
			return { ...n, position: { x: snap(p.x), y: snap(p.y) } };
		});
		const positionedC1Nodes: C1Output[] = c1Outputs.map((n) => {
			const p = posMap.get(n.id) ?? { x: 0, y: 0 };
			return { ...n, position: { x: snap(p.x), y: snap(p.y) } };
		});
		const positionedC2Nodes: C2Subcategory[] = c2Subcategories.map((n) => {
			const p = posMap.get(n.id) ?? { x: 0, y: 0 };
			return { ...n, position: { x: snap(p.x), y: snap(p.y) } };
		});

		return {
			graphNodes: positionedGraphNodes,
			c1Nodes: positionedC1Nodes,
			c2Nodes: positionedC2Nodes,
			edges: validEdges,
		};
	}
}


