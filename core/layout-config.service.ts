import type { LayoutConfig } from './hierarchical-layout.service';

export type LayoutPreset = 'compact' | 'spacious' | 'hierarchical' | 'clustered' | 'radial';

export class LayoutConfigService {
  /**
   * Get predefined layout configurations for different use cases
   */
  static getLayoutPreset(preset: LayoutPreset): LayoutConfig {
    switch (preset) {
      case 'compact':
        return {
          levelHeight: 220,
          nodeSpacing: 200,
          clusterSpacing: 300,
          minimumNodeDistance: 130,
          edgeLengthMultiplier: 1.2,
          centralityWeight: 0.4,
          forceDirectedIterations: 50
        };

      case 'spacious':
        return {
          levelHeight: 320,
          nodeSpacing: 280,
          clusterSpacing: 450,
          minimumNodeDistance: 200,
          edgeLengthMultiplier: 1.8,
          centralityWeight: 0.2,
          forceDirectedIterations: 80
        };

      case 'hierarchical':
        return {
          levelHeight: 300,
          nodeSpacing: 240,
          clusterSpacing: 400,
          minimumNodeDistance: 160,
          edgeLengthMultiplier: 1.5,
          centralityWeight: 0.3,
          forceDirectedIterations: 100
        };

      case 'clustered':
        return {
          levelHeight: 280,
          nodeSpacing: 220,
          clusterSpacing: 500,
          minimumNodeDistance: 150,
          edgeLengthMultiplier: 1.4,
          centralityWeight: 0.5,
          forceDirectedIterations: 120
        };

      case 'radial':
        return {
          levelHeight: 260,
          nodeSpacing: 230,
          clusterSpacing: 420,
          minimumNodeDistance: 140,
          edgeLengthMultiplier: 1.6,
          centralityWeight: 0.6,
          forceDirectedIterations: 150
        };

      default:
        return this.getLayoutPreset('hierarchical');
    }
  }

  /**
   * Create custom configuration based on graph size
   */
  static getConfigForGraphSize(nodeCount: number): LayoutConfig {
    if (nodeCount < 50) {
      return this.getLayoutPreset('compact');
    } else if (nodeCount < 200) {
      return this.getLayoutPreset('hierarchical');
    } else if (nodeCount < 500) {
      return this.getLayoutPreset('clustered');
    } else {
      // For large graphs like your 20k LOC codebase - increased spacing
      return {
        levelHeight: 380,
        nodeSpacing: 280,
        clusterSpacing: 600,
        minimumNodeDistance: 180,
        edgeLengthMultiplier: 1.6,
        centralityWeight: 0.4,
        forceDirectedIterations: 80 // Fewer iterations for performance
      };
    }
  }

  /**
   * Optimize configuration for performance vs quality trade-off
   */
  static getPerformanceOptimizedConfig(nodeCount: number): LayoutConfig {
    const baseConfig = this.getConfigForGraphSize(nodeCount);
    
    // Reduce iterations for large graphs to improve performance
    if (nodeCount > 300) {
      baseConfig.forceDirectedIterations = Math.max(30, Math.floor(300 / nodeCount * 100));
    }
    
    return baseConfig;
  }

  /**
   * Get configuration optimized for readability
   */
  static getReadabilityOptimizedConfig(): LayoutConfig {
    return {
      levelHeight: 360,
      nodeSpacing: 300,
      clusterSpacing: 550,
      minimumNodeDistance: 200,
      edgeLengthMultiplier: 2.0,
      centralityWeight: 0.3,
      forceDirectedIterations: 150
    };
  }

  /**
   * Merge multiple configurations with priority
   */
  static mergeConfigs(...configs: Partial<LayoutConfig>[]): LayoutConfig {
    const base = this.getLayoutPreset('hierarchical');
    return Object.assign(base, ...configs);
  }
}