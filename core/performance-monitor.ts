/**
 * Performance monitoring utilities for graph layout
 */

export interface PerformanceMetrics {
  layoutTime: number;
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  groupCount: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private startTime: number = 0;

  /**
   * Start timing a layout operation
   */
  startLayout(): void {
    this.startTime = performance.now();
  }

  /**
   * End timing and record metrics
   */
  endLayout(nodeCount: number, edgeCount: number, groupCount: number): PerformanceMetrics {
    const endTime = performance.now();
    const layoutTime = endTime - this.startTime;

    const metric: PerformanceMetrics = {
      layoutTime,
      renderTime: 0, // Will be set separately
      nodeCount,
      edgeCount,
      groupCount,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    return metric;
  }

  /**
   * Record render time
   */
  recordRenderTime(renderTime: number): void {
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].renderTime = renderTime;
    }
  }

  /**
   * Get average layout time
   */
  getAverageLayoutTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.layoutTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Get latest metrics
   */
  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      summary: {
        totalRuns: this.metrics.length,
        avgLayoutTime: this.getAverageLayoutTime(),
        avgRenderTime: this.metrics.reduce((acc, m) => acc + m.renderTime, 0) / this.metrics.length,
      },
    }, null, 2);
  }

  /**
   * Log performance summary to console
   */
  logSummary(): void {
    const latest = this.getLatestMetrics();
    if (!latest) {
      console.log('No performance metrics available');
      return;
    }

    console.group('🎯 Graph Layout Performance');
    console.log(`📊 Nodes: ${latest.nodeCount}`);
    console.log(`🔗 Edges: ${latest.edgeCount}`);
    console.log(`📦 Groups: ${latest.groupCount}`);
    console.log(`⚡ Layout Time: ${latest.layoutTime.toFixed(2)}ms`);
    console.log(`🎨 Render Time: ${latest.renderTime.toFixed(2)}ms`);
    console.log(`⏱️  Total Time: ${(latest.layoutTime + latest.renderTime).toFixed(2)}ms`);
    
    if (this.metrics.length > 1) {
      console.log(`📈 Average Layout Time: ${this.getAverageLayoutTime().toFixed(2)}ms`);
    }
    console.groupEnd();
  }
}

/**
 * Singleton instance
 */
export const performanceMonitor = new PerformanceMonitor();
