import type { GraphEdge } from './types';
import type { Edge } from '@xyflow/react';

interface BidirectionalEdgeInfo {
	edgeId: string;
	hasBidirectional: boolean;
	isReverse: boolean;
	pairEdgeId?: string;
}

export class BidirectionalEdgeService {
	/**
	 * Detects bidirectional edges in the graph
	 * Returns a map of edge IDs to their bidirectional status
	 */
	detectBidirectionalEdges(edges: GraphEdge[]): Map<string, BidirectionalEdgeInfo> {
		const bidirectionalMap = new Map<string, BidirectionalEdgeInfo>();
		const edgeMap = new Map<string, GraphEdge>();

		// Create a quick lookup map
		edges.forEach(edge => {
			edgeMap.set(edge.id, edge);
		});

		// Check each edge for bidirectional relationships
		edges.forEach(edge => {
			// Skip if already processed
			if (bidirectionalMap.has(edge.id)) {
				return;
			}

			// Look for reverse edge
			const reverseEdge = edges.find(
				e => e.source === edge.target && e.target === edge.source
			);

			if (reverseEdge) {
				// Mark the first edge as primary (not reverse)
				bidirectionalMap.set(edge.id, {
					edgeId: edge.id,
					hasBidirectional: true,
					isReverse: false,
					pairEdgeId: reverseEdge.id,
				});

				// Mark the reverse edge
				bidirectionalMap.set(reverseEdge.id, {
					edgeId: reverseEdge.id,
					hasBidirectional: true,
					isReverse: true,
					pairEdgeId: edge.id,
				});
			} else {
				// No bidirectional relationship
				bidirectionalMap.set(edge.id, {
					edgeId: edge.id,
					hasBidirectional: false,
					isReverse: false,
				});
			}
		});

		return bidirectionalMap;
	}

	/**
	 * Applies bidirectional edge styling to React Flow edges
	 * Uses curved paths with offsets to prevent overlap
	 */
	applyBidirectionalStyling(
		edges: Omit<Edge, 'type' | 'labelBgPadding' | 'labelBgBorderRadius' | 'labelBgStyle'>[],
		bidirectionalMap: Map<string, BidirectionalEdgeInfo>
	): Edge[] {
		return edges.map(edge => {
			const info = bidirectionalMap.get(edge.id);

			if (!info || !info.hasBidirectional) {
				// Regular edge - use default bezier curve with slight curvature
				return {
					...edge,
					type: 'default',
					data: {
						...edge.data,
						pathOptions: {
							curvature: 0.1, // Slight curve for better visibility
						},
					},
					labelBgPadding: [8, 4] as [number, number],
					labelBgBorderRadius: 4,
					labelBgStyle: { 
						fill: '#ffffff', 
						fillOpacity: 0.95,
					},
				};
			}

			// Bidirectional edge configuration with increased curvature
			// Higher curvature (0.6) creates more pronounced arc separation
			const curvature = 0.6;
			
			// For bidirectional edges, add path offset to create curved separation
			// The forward edge curves one way, the reverse curves the other
			const pathOptions = info.isReverse 
				? {
					// Reverse edge - curve in opposite direction
					curvature: -curvature,
				}
				: {
					// Forward edge - curve in one direction
					curvature: curvature,
				};

			return {
				...edge,
				type: 'default', // Using default type which supports bezier curves
				data: {
					...edge.data,
					pathOptions,
					// Store additional metadata for custom edge component
					isBidirectional: true,
					isReverse: info.isReverse,
				},
				// Label positioning to avoid overlap with much larger offsets
				labelStyle: {
					...edge.labelStyle,
					transform: info.isReverse 
						? 'translate(-35px, 35px)' // Larger offset for reverse edge label
						: 'translate(35px, -35px)', // Larger offset for forward edge label
				},
				labelBgPadding: [10, 6] as [number, number],
				labelBgBorderRadius: 6,
				labelBgStyle: { 
					fill: '#ffffff', 
					fillOpacity: 0.98,
					stroke: '#e5e7eb',
					strokeWidth: 1.5,
				},
				// Ensure labels stay visible and non-overlapping
				interactionWidth: 20,
			};
		});
	}

	/**
	 * Complete processing pipeline for bidirectional edges
	 */
	processBidirectionalEdges(
		edges: GraphEdge[],
		reactFlowEdges: Omit<Edge, 'type' | 'labelBgPadding' | 'labelBgBorderRadius' | 'labelBgStyle'>[]
	): Edge[] {
		const bidirectionalMap = this.detectBidirectionalEdges(edges);
		return this.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);
	}
}
