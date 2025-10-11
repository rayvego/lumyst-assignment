import type { Edge } from "@xyflow/react";

interface GraphEdge {
	id: string;
	source: string;
	target: string;
}

interface BidirectionalEdgeInfo {
	edgeId: string;
	hasBidirectional: boolean;
	isReverse: boolean;
	pairEdgeId?: string;
}

export class BidirectionalEdgeService {
	detectBidirectionalEdges(edges: GraphEdge[]): Map<string, BidirectionalEdgeInfo> {
		const bidirectionalMap = new Map<string, BidirectionalEdgeInfo>();

		edges.forEach(edge => {
			if (bidirectionalMap.has(edge.id)) return;

			const reverseEdge = edges.find(
				e => e.source === edge.target && e.target === edge.source
			);

			if (reverseEdge) {
				bidirectionalMap.set(edge.id, {
					edgeId: edge.id,
					hasBidirectional: true,
					isReverse: false,
					pairEdgeId: reverseEdge.id,
				});
				bidirectionalMap.set(reverseEdge.id, {
					edgeId: reverseEdge.id,
					hasBidirectional: true,
					isReverse: true,
					pairEdgeId: edge.id,
				});
			} else {
				bidirectionalMap.set(edge.id, {
					edgeId: edge.id,
					hasBidirectional: false,
					isReverse: false,
				});
			}
		});

		return bidirectionalMap;
	}

	applyBidirectionalStyling(
		edges: Edge[],
		bidirectionalMap: Map<string, BidirectionalEdgeInfo>
	): Edge[] {
		return edges.map(edge => {
			const info = bidirectionalMap.get(edge.id);

			if (!info || !info.hasBidirectional) {
				return {
					...edge,
					type: "default",
					data: {
						...edge.data,
						pathOptions: { curvature: 0.1 },
					},
				};
			}

			const curvature = 0.6;
			const pathOptions = info.isReverse
				? { curvature: -curvature }
				: { curvature: curvature };

			return {
				...edge,
				type: "bidirectional",
				data: {
					...edge.data,
					pathOptions,
					isBidirectional: true,
					isReverse: info.isReverse,
				},
				labelStyle: {
					transform: info.isReverse
						? "translate(-35px, 35px)"
						: "translate(35px, -35px)",
				},
			};
		});
	}

	processBidirectionalEdges(
		edges: GraphEdge[],
		reactFlowEdges: Edge[]
	): Edge[] {
        console.log("✅ Bidirectional service called with:", edges.length, "items");
		const bidirectionalMap = this.detectBidirectionalEdges(edges);
		return this.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);
	}
}

export function getBidirectionalData(data: any[]) {
  console.log("✅ Bidirectional service called with:", data.length, "items");

  return data.map((item) => ({
    ...item,
    reverseFlow: item.value * -1,
  }));
}
