import { LayoutConfig } from './hierarchical-layout.service';

/**
 * Predefined layout configurations for different use cases
 */
export class LayoutPresets {
  /**
   * Compact layout for smaller screens or dense visualizations
   */
  static compact: LayoutConfig = {
    nodeSpacing: 120,
    rankSpacing: 100,
    edgeSpacing: 30,
    clusterPadding: 60,
    minimumNodeSize: { width: 140, height: 45 },
    maximumNodesPerRank: 10
  };

  /**
   * Default balanced layout (same as HierarchicalLayoutService default)
   */
  static balanced: LayoutConfig = {
    nodeSpacing: 200,
    rankSpacing: 150,
    edgeSpacing: 50,
    clusterPadding: 100,
    minimumNodeSize: { width: 180, height: 60 },
    maximumNodesPerRank: 8
  };

  /**
   * Spacious layout for large screens and detailed exploration
   */
  static spacious: LayoutConfig = {
    nodeSpacing: 280,
    rankSpacing: 200,
    edgeSpacing: 70,
    clusterPadding: 140,
    minimumNodeSize: { width: 220, height: 75 },
    maximumNodesPerRank: 6
  };

  /**
   * Ultra-wide layout for very large displays
   */
  static ultraWide: LayoutConfig = {
    nodeSpacing: 350,
    rankSpacing: 250,
    edgeSpacing: 90,
    clusterPadding: 180,
    minimumNodeSize: { width: 260, height: 90 },
    maximumNodesPerRank: 5
  };

  /**
   * Vertical-optimized layout for tall displays
   */
  static vertical: LayoutConfig = {
    nodeSpacing: 160,
    rankSpacing: 180,
    edgeSpacing: 60,
    clusterPadding: 120,
    minimumNodeSize: { width: 160, height: 70 },
    maximumNodesPerRank: 12
  };
}

/**
 * Dynamic configuration generator based on graph size and viewport
 */
export class LayoutConfigGenerator {
  /**
   * Generate optimal configuration based on graph statistics
   */
  static generateForGraph(stats: {
    totalNodes: number;
    totalEdges: number;
    categories: number;
    viewportWidth: number;
    viewportHeight: number;
  }): LayoutConfig {
    const { totalNodes, categories, viewportWidth, viewportHeight } = stats;
    
    // Base configuration
    let config = { ...LayoutPresets.balanced };
    
    // Adjust for node count
    if (totalNodes > 1000) {
      config = { ...LayoutPresets.compact };
    } else if (totalNodes < 200) {
      config = { ...LayoutPresets.spacious };
    }
    
    // Adjust for viewport size
    const viewportRatio = viewportWidth / viewportHeight;
    
    if (viewportRatio > 2) {
      // Ultra-wide screen
      config.nodeSpacing *= 1.2;
      config.maximumNodesPerRank = Math.min(config.maximumNodesPerRank + 2, 12);
    } else if (viewportRatio < 0.8) {
      // Tall/vertical screen
      config.rankSpacing *= 1.3;
      config.maximumNodesPerRank = Math.max(config.maximumNodesPerRank - 2, 4);
    }
    
    // Adjust for category count
    if (categories > 10) {
      config.clusterPadding *= 0.8; // Reduce padding for many clusters
    } else if (categories < 5) {
      config.clusterPadding *= 1.3; // Increase padding for few clusters
    }
    
    return config;
  }

  /**
   * Generate configuration optimized for mobile devices
   */
  static generateForMobile(): LayoutConfig {
    return {
      nodeSpacing: 100,
      rankSpacing: 80,
      edgeSpacing: 25,
      clusterPadding: 50,
      minimumNodeSize: { width: 120, height: 40 },
      maximumNodesPerRank: 6
    };
  }

  /**
   * Generate configuration for print/export (high density)
   */
  static generateForPrint(): LayoutConfig {
    return {
      nodeSpacing: 80,
      rankSpacing: 60,
      edgeSpacing: 20,
      clusterPadding: 40,
      minimumNodeSize: { width: 100, height: 35 },
      maximumNodesPerRank: 15
    };
  }
}

/**
 * Utility functions for layout configuration
 */
export class LayoutUtils {
  /**
   * Merge two layout configurations
   */
  static mergeConfigs(base: LayoutConfig, override: Partial<LayoutConfig>): LayoutConfig {
    return {
      ...base,
      ...override,
      minimumNodeSize: {
        ...base.minimumNodeSize,
        ...(override.minimumNodeSize || {})
      }
    };
  }

  /**
   * Scale an entire configuration by a factor
   */
  static scaleConfig(config: LayoutConfig, scaleFactor: number): LayoutConfig {
    return {
      nodeSpacing: config.nodeSpacing * scaleFactor,
      rankSpacing: config.rankSpacing * scaleFactor,
      edgeSpacing: config.edgeSpacing * scaleFactor,
      clusterPadding: config.clusterPadding * scaleFactor,
      minimumNodeSize: {
        width: config.minimumNodeSize.width * scaleFactor,
        height: config.minimumNodeSize.height * scaleFactor
      },
      maximumNodesPerRank: config.maximumNodesPerRank
    };
  }

  /**
   * Validate configuration values
   */
  static validateConfig(config: LayoutConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.nodeSpacing < 50) {
      errors.push('nodeSpacing must be at least 50px');
    }
    if (config.rankSpacing < 40) {
      errors.push('rankSpacing must be at least 40px');
    }
    if (config.minimumNodeSize.width < 80) {
      errors.push('minimumNodeSize.width must be at least 80px');
    }
    if (config.minimumNodeSize.height < 30) {
      errors.push('minimumNodeSize.height must be at least 30px');
    }
    if (config.maximumNodesPerRank < 2) {
      errors.push('maximumNodesPerRank must be at least 2');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate estimated dimensions for a given configuration and node count
   */
  static estimateDimensions(config: LayoutConfig, nodeCount: number, clusterCount: number) {
    const nodesPerCluster = Math.ceil(nodeCount / clusterCount);
    const ranksPerCluster = Math.ceil(nodesPerCluster / config.maximumNodesPerRank);
    
    const clusterWidth = config.maximumNodesPerRank * (config.minimumNodeSize.width + config.nodeSpacing);
    const clusterHeight = ranksPerCluster * (config.minimumNodeSize.height + config.rankSpacing);
    
    const clustersPerRow = Math.ceil(Math.sqrt(clusterCount));
    const clusterRows = Math.ceil(clusterCount / clustersPerRow);
    
    return {
      totalWidth: clustersPerRow * (clusterWidth + config.clusterPadding * 2),
      totalHeight: clusterRows * (clusterHeight + config.clusterPadding * 2),
      clusterDimensions: { width: clusterWidth, height: clusterHeight }
    };
  }
}
