/**
 * Comprehensive example demonstrating the Hierarchical Graph Layout System
 * 
 * This example shows how to use all the features of the layout system
 * for large codebase visualization.
 */

import { ReactFlowService } from '../core/react-flow.service';
import { GraphLayoutManagerService } from '../core/graph-layout-manager.service';
import { LayoutConfigService, type LayoutPreset } from '../core/layout-config.service';
import { convertDataToGraphNodesAndEdges } from '../core/data/data-converter';

// Example 1: Basic Usage
export function basicHierarchicalLayout() {
  const layoutService = new ReactFlowService();
  const data = convertDataToGraphNodesAndEdges();

  // Apply hierarchical layout with default settings
  const result = layoutService.convertDataToReactFlowDataTypes(
    data.graphNodes,
    data.c1Output,
    data.c2Subcategories,
    data.graphEdges,
    true, // Enable hierarchical layout
    'hierarchical' // Use hierarchical preset
  );

  console.log('Layout applied successfully!');
  console.log('Nodes:', result.nodes.length);
  console.log('Edges:', result.edges.length);
  
  if (result.layoutInfo) {
    console.log('Layout Analysis:', result.layoutInfo.analysis);
    console.log('Layout Metrics:', result.layoutInfo.metrics);
    console.log('Suggestions:', result.layoutInfo.suggestions);
  }

  return result;
}

// Example 2: Advanced Usage with Analysis
export function advancedLayoutWithAnalysis() {
  const layoutManager = new GraphLayoutManagerService();
  const data = convertDataToGraphNodesAndEdges();

  // Step 1: Analyze the graph structure
  const analysis = layoutManager.analyzeGraphStructure(
    data.graphNodes,
    data.c1Output,
    data.c2Subcategories,
    data.graphEdges
  );

  console.log('Graph Analysis:');
  console.log(`- Nodes: ${analysis.nodeCount}`);
  console.log(`- Edges: ${analysis.edgeCount}`);
  console.log(`- Max Degree: ${analysis.maxDegree}`);
  console.log(`- Complexity: ${analysis.complexity}`);
  console.log(`- Recommended Preset: ${analysis.recommendedPreset}`);

  // Step 2: Apply optimal layout based on analysis
  const layoutResult = layoutManager.applyOptimalLayout(
    data.graphNodes,
    data.c1Output,
    data.c2Subcategories,
    data.graphEdges,
    analysis.recommendedPreset // Use recommended preset
  );

  // Step 3: Get improvement suggestions
  const suggestions = layoutManager.suggestLayoutImprovements(
    layoutResult.analysis,
    layoutResult.metrics
  );

  console.log('Layout Quality Metrics:');
  console.log(`- Edge Crossings: ${layoutResult.metrics.edgeCrossings}`);
  console.log(`- Node Overlaps: ${layoutResult.metrics.nodeOverlaps}`);
  console.log(`- Avg Edge Length: ${Math.round(layoutResult.metrics.avgEdgeLength)}px`);
  console.log(`- Cluster Separation: ${Math.round(layoutResult.metrics.clusterSeparation)}px`);

  console.log('Improvement Suggestions:');
  suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`);
  });

  return layoutResult;
}

// Example 3: Custom Configuration
export function customConfigurationExample() {
  const layoutService = new ReactFlowService();
  const data = convertDataToGraphNodesAndEdges();

  // Create custom configuration for your specific needs
  const customConfig = {
    levelHeight: 250,           // More vertical space between levels
    nodeSpacing: 180,           // More horizontal space between nodes
    clusterSpacing: 400,        // Large gaps between clusters for clarity
    minimumNodeDistance: 100,   // Prevent any overlapping
    edgeLengthMultiplier: 1.5,  // Longer edges for better readability
    centralityWeight: 0.4,      // Give important nodes better positions
    forceDirectedIterations: 120 // More iterations for better quality
  };

  // Apply layout with custom configuration
  const result = layoutService.convertDataToReactFlowDataTypes(
    data.graphNodes,
    data.c1Output,
    data.c2Subcategories,
    data.graphEdges,
    true,
    'spacious', // Use spacious preset as base
    customConfig // Override with custom settings
  );

  console.log('Custom layout applied with enhanced spacing');
  return result;
}

// Example 4: Performance-Optimized Layout for Large Graphs
export function performanceOptimizedLayout() {
  const data = convertDataToGraphNodesAndEdges();
  const nodeCount = data.graphNodes.length + data.c1Output.length + data.c2Subcategories.length;

  // Get performance-optimized configuration
  const performanceConfig = LayoutConfigService.getPerformanceOptimizedConfig(nodeCount);

  console.log('Performance Config:');
  console.log(`- Iterations: ${performanceConfig.forceDirectedIterations}`);
  console.log(`- Level Height: ${performanceConfig.levelHeight}`);
  console.log(`- Node Spacing: ${performanceConfig.nodeSpacing}`);

  const layoutManager = new GraphLayoutManagerService();
  
  // Apply optimized layout
  const result = layoutManager.applyOptimalLayout(
    data.graphNodes,
    data.c1Output,
    data.c2Subcategories,
    data.graphEdges,
    'clustered' // Good for large graphs
  );

  console.log(`Performance-optimized layout for ${nodeCount} nodes completed`);
  return result;
}

// Example 5: Preset Comparison
export function compareLayoutPresets() {
  const layoutService = new ReactFlowService();
  const data = convertDataToGraphNodesAndEdges();

  const presets: LayoutPreset[] = ['compact', 'spacious', 'hierarchical', 'clustered', 'radial'];
  const results: Record<LayoutPreset, any> = {} as any;

  console.log('Comparing layout presets...');

  presets.forEach(preset => {
    console.log(`\n--- Testing ${preset.toUpperCase()} preset ---`);
    
    const result = layoutService.convertDataToReactFlowDataTypes(
      data.graphNodes,
      data.c1Output,
      data.c2Subcategories,
      data.graphEdges,
      true,
      preset
    );

    if (result.layoutInfo) {
      const metrics = result.layoutInfo.metrics;
      console.log(`Edge Crossings: ${metrics.edgeCrossings}`);
      console.log(`Node Overlaps: ${metrics.nodeOverlaps}`);
      console.log(`Avg Edge Length: ${Math.round(metrics.avgEdgeLength)}px`);
      console.log(`Canvas Size: ${Math.round(result.layoutInfo.boundingBox.width)}x${Math.round(result.layoutInfo.boundingBox.height)}`);
    }

    results[preset] = result;
  });

  return results;
}

// Example 6: Interactive Layout Updates
export function interactiveLayoutExample() {
  const layoutManager = new GraphLayoutManagerService();
  const data = convertDataToGraphNodesAndEdges();

  // Function to update layout based on user preference
  function updateLayout(preset: LayoutPreset, customOptions?: any) {
    console.log(`Updating layout to ${preset}...`);
    
    const result = layoutManager.applyOptimalLayout(
      data.graphNodes,
      data.c1Output,
      data.c2Subcategories,
      data.graphEdges,
      preset
    );

    // Export layout data for saving/sharing
    const exportData = layoutManager.exportLayoutData(
      result.nodes,
      result.analysis,
      result.metrics
    );

    console.log('Layout Summary:');
    console.log(exportData.summary);

    return result;
  }

  // Simulate interactive updates
  console.log('=== Interactive Layout Demo ===');
  
  // Start with automatic recommendation
  const analysis = layoutManager.analyzeGraphStructure(
    data.graphNodes, data.c1Output, data.c2Subcategories, data.graphEdges
  );
  console.log(`\nRecommended layout: ${analysis.recommendedPreset}`);
  
  // Apply recommended layout
  let currentLayout = updateLayout(analysis.recommendedPreset);
  
  // Simulate user trying different presets
  console.log('\n--- User switches to clustered view ---');
  currentLayout = updateLayout('clustered');
  
  console.log('\n--- User switches to spacious view ---');
  currentLayout = updateLayout('spacious');

  return currentLayout;
}

// Example 7: React Component Integration
export function getReactComponentExample() {
  // This returns a string showing how to use the layout system in React
  return `
// React Component Example (use in .tsx file)
import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlow } from '@xyflow/react';
import { ReactFlowService } from '../core/react-flow.service';
import { convertDataToGraphNodesAndEdges } from '../core/data/data-converter';
import type { LayoutPreset } from '../core/layout-config.service';

const ExampleComponent = () => {
  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>('hierarchical');
  const [layoutResult, setLayoutResult] = useState<any>(null);

  const applyNewLayout = useCallback((preset: LayoutPreset) => {
    const layoutService = new ReactFlowService();
    const data = convertDataToGraphNodesAndEdges();

    const result = layoutService.convertDataToReactFlowDataTypes(
      data.graphNodes,
      data.c1Output,
      data.c2Subcategories,
      data.graphEdges,
      true,
      preset
    );

    setLayoutResult(result);
    setLayoutPreset(preset);
  }, []);

  useEffect(() => {
    applyNewLayout(layoutPreset);
  }, [layoutPreset, applyNewLayout]);

  return (
    <div>
      <div className="layout-controls">
        <button onClick={() => applyNewLayout('compact')}>Compact</button>
        <button onClick={() => applyNewLayout('hierarchical')}>Hierarchical</button>
        <button onClick={() => applyNewLayout('clustered')}>Clustered</button>
      </div>

      {layoutResult && (
        <ReactFlow
          nodes={layoutResult.nodes}
          edges={layoutResult.edges}
          fitView
        />
      )}

      {layoutResult?.layoutInfo && (
        <div className="layout-info">
          <h3>Layout Quality</h3>
          <p>Edge Crossings: {layoutResult.layoutInfo.metrics.edgeCrossings}</p>
          <p>Node Overlaps: {layoutResult.layoutInfo.metrics.nodeOverlaps}</p>
          
          <h3>Suggestions</h3>
          <ul>
            {layoutResult.layoutInfo.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExampleComponent;
`;
}

// Run all examples
export function runAllExamples() {
  console.log('=== Hierarchical Graph Layout System Examples ===\n');

  try {
    console.log('1. Basic Usage:');
    basicHierarchicalLayout();

    console.log('\n2. Advanced Analysis:');
    advancedLayoutWithAnalysis();

    console.log('\n3. Custom Configuration:');
    customConfigurationExample();

    console.log('\n4. Performance Optimization:');
    performanceOptimizedLayout();

    console.log('\n5. Preset Comparison:');
    compareLayoutPresets();

    console.log('\n6. Interactive Updates:');
    interactiveLayoutExample();

    console.log('\n7. React Component Example:');
    console.log(getReactComponentExample());

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Export everything for easy import
export {
  ReactFlowService,
  GraphLayoutManagerService,
  LayoutConfigService
};