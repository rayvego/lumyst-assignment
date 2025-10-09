import { describe, it, expect } from '@jest/globals';
import { BidirectionalEdgeService } from '../core/bidirectional-edge.service';
import type { GraphEdge } from '../core/types';

describe('BidirectionalEdgeService', () => {
	let service: BidirectionalEdgeService;

	beforeEach(() => {
		service = new BidirectionalEdgeService();
	});

	describe('detectBidirectionalEdges', () => {
		it('should detect bidirectional edges correctly', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'provides to' },
				{ id: 'e2', source: 'B', target: 'A', label: 'configures' },
			];

			const result = service.detectBidirectionalEdges(edges);

			expect(result.get('e1')).toEqual({
				edgeId: 'e1',
				hasBidirectional: true,
				isReverse: false,
				pairEdgeId: 'e2',
			});

			expect(result.get('e2')).toEqual({
				edgeId: 'e2',
				hasBidirectional: true,
				isReverse: true,
				pairEdgeId: 'e1',
			});
		});

		it('should handle unidirectional edges', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'provides to' },
				{ id: 'e2', source: 'B', target: 'C', label: 'configures' },
			];

			const result = service.detectBidirectionalEdges(edges);

			expect(result.get('e1')).toEqual({
				edgeId: 'e1',
				hasBidirectional: false,
				isReverse: false,
			});

			expect(result.get('e2')).toEqual({
				edgeId: 'e2',
				hasBidirectional: false,
				isReverse: false,
			});
		});

		it('should handle multiple bidirectional pairs', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2' },
				{ id: 'e3', source: 'C', target: 'D', label: 'label3' },
				{ id: 'e4', source: 'D', target: 'C', label: 'label4' },
			];

			const result = service.detectBidirectionalEdges(edges);

			expect(result.get('e1')?.hasBidirectional).toBe(true);
			expect(result.get('e2')?.hasBidirectional).toBe(true);
			expect(result.get('e3')?.hasBidirectional).toBe(true);
			expect(result.get('e4')?.hasBidirectional).toBe(true);

			expect(result.get('e1')?.isReverse).toBe(false);
			expect(result.get('e2')?.isReverse).toBe(true);
			expect(result.get('e3')?.isReverse).toBe(false);
			expect(result.get('e4')?.isReverse).toBe(true);
		});

		it('should handle empty edge array', () => {
			const edges: GraphEdge[] = [];
			const result = service.detectBidirectionalEdges(edges);
			expect(result.size).toBe(0);
		});
	});

	describe('applyBidirectionalStyling', () => {
		it('should apply correct curvature for bidirectional edges', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2' },
			];

			const reactFlowEdges = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2' },
			];

			const bidirectionalMap = service.detectBidirectionalEdges(edges);
			const result = service.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);

			// Forward edge should have positive curvature
			expect(result[0].data?.pathOptions?.curvature).toBe(0.25);
			// Reverse edge should have negative curvature
			expect(result[1].data?.pathOptions?.curvature).toBe(-0.25);
		});

		it('should apply label offsets for bidirectional edges', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2' },
			];

			const reactFlowEdges = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1', labelStyle: {} },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2', labelStyle: {} },
			];

			const bidirectionalMap = service.detectBidirectionalEdges(edges);
			const result = service.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);

			// Forward edge label offset
			expect(result[0].labelStyle?.transform).toBe('translate(10px, -10px)');
			// Reverse edge label offset
			expect(result[1].labelStyle?.transform).toBe('translate(-10px, 10px)');
		});

		it('should not modify unidirectional edges', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
			];

			const reactFlowEdges = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
			];

			const bidirectionalMap = service.detectBidirectionalEdges(edges);
			const result = service.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);

			expect(result[0].type).toBe('default');
			expect(result[0].data?.pathOptions).toBeUndefined();
		});

		it('should preserve label background styling', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
			];

			const reactFlowEdges = [
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
			];

			const bidirectionalMap = service.detectBidirectionalEdges(edges);
			const result = service.applyBidirectionalStyling(reactFlowEdges, bidirectionalMap);

			expect(result[0].labelBgStyle?.fill).toBe('#ffffff');
			expect(result[0].labelBgStyle?.fillOpacity).toBeDefined();
			expect(result[0].labelBgPadding).toBeDefined();
			expect(result[0].labelBgBorderRadius).toBe(4);
		});
	});

	describe('processBidirectionalEdges', () => {
		it('should complete full processing pipeline', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'B', label: 'provides to' },
				{ id: 'e2', source: 'B', target: 'A', label: 'configures' },
				{ id: 'e3', source: 'C', target: 'D', label: 'unidirectional' },
			];

			const reactFlowEdges = [
				{ id: 'e1', source: 'A', target: 'B', label: 'provides to', labelStyle: {} },
				{ id: 'e2', source: 'B', target: 'A', label: 'configures', labelStyle: {} },
				{ id: 'e3', source: 'C', target: 'D', label: 'unidirectional', labelStyle: {} },
			];

			const result = service.processBidirectionalEdges(edges, reactFlowEdges);

			// Check bidirectional edges have curvature
			expect(result[0].data?.pathOptions?.curvature).toBeDefined();
			expect(result[1].data?.pathOptions?.curvature).toBeDefined();
			
			// Check unidirectional edge doesn't have curvature
			expect(result[2].data?.pathOptions).toBeUndefined();

			// Check all edges have proper styling
			expect(result.length).toBe(3);
			result.forEach(edge => {
				expect(edge.labelBgStyle).toBeDefined();
				expect(edge.labelBgPadding).toBeDefined();
			});
		});
	});

	describe('Edge case handling', () => {
		it('should handle self-loops', () => {
			const edges: GraphEdge[] = [
				{ id: 'e1', source: 'A', target: 'A', label: 'self-loop' },
			];

			const result = service.detectBidirectionalEdges(edges);
			
			// Self-loops are not bidirectional
			expect(result.get('e1')?.hasBidirectional).toBe(false);
		});

		it('should handle complex graphs with mixed relationships', () => {
			const edges: GraphEdge[] = [
				// Bidirectional A-B
				{ id: 'e1', source: 'A', target: 'B', label: 'label1' },
				{ id: 'e2', source: 'B', target: 'A', label: 'label2' },
				// Unidirectional A-C
				{ id: 'e3', source: 'A', target: 'C', label: 'label3' },
				// Bidirectional C-D
				{ id: 'e4', source: 'C', target: 'D', label: 'label4' },
				{ id: 'e5', source: 'D', target: 'C', label: 'label5' },
			];

			const result = service.detectBidirectionalEdges(edges);

			expect(result.get('e1')?.hasBidirectional).toBe(true);
			expect(result.get('e2')?.hasBidirectional).toBe(true);
			expect(result.get('e3')?.hasBidirectional).toBe(false);
			expect(result.get('e4')?.hasBidirectional).toBe(true);
			expect(result.get('e5')?.hasBidirectional).toBe(true);
		});
	});
});
