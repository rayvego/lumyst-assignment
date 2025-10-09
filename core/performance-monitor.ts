/**
 * Performance Monitoring Utilities
 * 
 * Tracks layout computation time, rendering performance, and provides
 * recommendations for optimization.
 */

export interface PerformanceMetrics {
	layoutTime: number;
	nodeCount: number;
	edgeCount: number;
	renderTime: number;
	fps: number;
	memoryUsage?: number;
}

export class PerformanceMonitor {
	private metrics: PerformanceMetrics[] = [];

	recordLayoutMetrics(
		layoutTime: number,
		nodeCount: number,
		edgeCount: number
	) {
		const metric: PerformanceMetrics = {
			layoutTime,
			nodeCount,
			edgeCount,
			renderTime: 0,
			fps: 0,
		};

		this.metrics.push(metric);
		this.analyzeAndReport(metric);
	}

	private analyzeAndReport(metric: PerformanceMetrics) {
		console.group('📊 Performance Metrics');
		console.log(`Layout Time: ${metric.layoutTime}ms`);
		console.log(`Nodes: ${metric.nodeCount}`);
		console.log(`Edges: ${metric.edgeCount}`);
		console.log(`Nodes/ms: ${(metric.nodeCount / metric.layoutTime).toFixed(2)}`);
		
		// Recommendations
		if (metric.layoutTime > 2000) {
			console.warn('Layout taking >2s. Consider:');
			console.warn('  1. Moving to backend API');
			console.warn('  2. Implementing progressive loading');
			console.warn('  3. Using Web Workers');
		} else if (metric.layoutTime > 1000) {
			console.warn('Layout taking >1s. Monitor for larger graphs.');
		} else {
			console.log('Layout performance is good!');
		}

		// Memory check (if available)
		if ('memory' in performance) {
			const memory = (performance as any).memory;
			const usedMB = memory.usedJSHeapSize / 1024 / 1024;
			console.log(`Memory: ${usedMB.toFixed(2)}MB`);
			
			if (usedMB > 100) {
				console.warn('High memory usage. Consider optimization.');
			}
		}

		console.groupEnd();
	}

	getAverageMetrics(): PerformanceMetrics | null {
		if (this.metrics.length === 0) return null;

		const sum = this.metrics.reduce(
			(acc, m) => ({
				layoutTime: acc.layoutTime + m.layoutTime,
				nodeCount: acc.nodeCount + m.nodeCount,
				edgeCount: acc.edgeCount + m.edgeCount,
				renderTime: acc.renderTime + m.renderTime,
				fps: acc.fps + m.fps,
			}),
			{ layoutTime: 0, nodeCount: 0, edgeCount: 0, renderTime: 0, fps: 0 }
		);

		const count = this.metrics.length;
		return {
			layoutTime: sum.layoutTime / count,
			nodeCount: sum.nodeCount / count,
			edgeCount: sum.edgeCount / count,
			renderTime: sum.renderTime / count,
			fps: sum.fps / count,
		};
	}

	shouldMigrateToBackend(): boolean {
		const avg = this.getAverageMetrics();
		if (!avg) return false;

		// Recommend backend if:
		// - Layout time > 3s
		// - More than 2000 nodes
		// - Consistently slow
		return avg.layoutTime > 3000 || avg.nodeCount > 2000;
	}
}

export const perfMonitor = new PerformanceMonitor();

