/**
 * Demonstration script for bidirectional edge functionality
 * Shows how to use the BidirectionalEdgeService and validate results
 */

import { BidirectionalEdgeService } from './core/bidirectional-edge.service';
import { createSampleBidirectionalGraph, createMinimalBidirectionalTest, createComplexBidirectionalTest } from './core/sample-bidirectional-graph';
import { printBidirectionalEdgeTestResults } from './core/bidirectional-edge.test';
import type { GraphNode, GraphEdge } from './core/types';

/**
 * Main demonstration function
 */
export function demonstrateBidirectionalEdges(): void {
  console.log('🚀 Bidirectional Edge Demo');
  console.log('==========================\n');

  const service = new BidirectionalEdgeService();

  // Demo 1: Minimal bidirectional test
  console.log('📝 Demo 1: Minimal Bidirectional Graph');
  console.log('--------------------------------------');
  const minimalTest = createMinimalBidirectionalTest();
  console.log(`Nodes: ${minimalTest.nodes.length}, Edges: ${minimalTest.edges.length}`);
  
  const bidirectionalMap = service.detectBidirectionalEdges(minimalTest.edges);
  console.log(`Detected bidirectional pairs: ${bidirectionalMap.size}`);
  
  const processedEdges = service.applyLabelOffsets(minimalTest.edges, minimalTest.nodes);
  const bidirectionalCount = processedEdges.filter(e => e.isBidirectional).length;
  console.log(`Processed bidirectional edges: ${bidirectionalCount}`);
  
  // Show label positioning
  processedEdges.forEach(edge => {
    if (edge.isBidirectional) {
      console.log(`  - ${edge.label}: offset=${edge.labelOffset}, position=${edge.labelPosition}`);
    }
  });
  console.log('');

  // Demo 2: Sample bidirectional graph
  console.log('📝 Demo 2: Sample Bidirectional Graph');
  console.log('-------------------------------------');
  const sampleGraph = createSampleBidirectionalGraph();
  console.log(`Nodes: ${sampleGraph.nodes.length}, Edges: ${sampleGraph.edges.length}`);
  
  const sampleBidirectionalMap = service.detectBidirectionalEdges(sampleGraph.edges);
  console.log(`Detected bidirectional pairs: ${sampleBidirectionalMap.size}`);
  
  const sampleProcessedEdges = service.applyLabelOffsets(sampleGraph.edges, sampleGraph.nodes);
  const sampleBidirectionalCount = sampleProcessedEdges.filter(e => e.isBidirectional).length;
  console.log(`Processed bidirectional edges: ${sampleBidirectionalCount}`);
  console.log('');

  // Demo 3: Complex bidirectional test
  console.log('📝 Demo 3: Complex Bidirectional Graph');
  console.log('--------------------------------------');
  const complexTest = createComplexBidirectionalTest();
  console.log(`Nodes: ${complexTest.nodes.length}, Edges: ${complexTest.edges.length}`);
  
  const complexBidirectionalMap = service.detectBidirectionalEdges(complexTest.edges);
  console.log(`Detected bidirectional pairs: ${complexBidirectionalMap.size}`);
  console.log('');

  // Demo 4: Cursor highlighting
  console.log('📝 Demo 4: Cursor-Based Highlighting');
  console.log('-------------------------------------');
  const cursorPosition = { x: 300, y: 150 };
  const highlightedEdges = service.highlightLabelsOnCursor(
    sampleProcessedEdges,
    cursorPosition,
    sampleGraph.nodes
  );
  
  const highlightedCount = highlightedEdges.filter(e => e.highlightOnHover).length;
  console.log(`Edges highlighted at cursor position (${cursorPosition.x}, ${cursorPosition.y}): ${highlightedCount}`);
  console.log('');

  // Demo 5: Validation
  console.log('📝 Demo 5: Edge Validation');
  console.log('--------------------------');
  const validation = service.validateBidirectionalEdges(sampleProcessedEdges);
  console.log(`Validation result: ${validation.isValid ? '✅ Valid' : '❌ Invalid'}`);
  if (!validation.isValid) {
    console.log('Issues found:');
    validation.issues.forEach(issue => console.log(`  - ${issue}`));
  }
  console.log('');

  // Demo 6: Label position calculation
  console.log('📝 Demo 6: Curved Label Positioning');
  console.log('-----------------------------------');
  const bidirectionalEdge = sampleProcessedEdges.find(e => e.isBidirectional);
  if (bidirectionalEdge) {
    const labelPos = service.calculateCurvedLabelPosition(bidirectionalEdge, sampleGraph.nodes, 0.5);
    console.log(`Label position for "${bidirectionalEdge.label}": (${labelPos.x.toFixed(1)}, ${labelPos.y.toFixed(1)})`);
    if (labelPos.rotation !== undefined) {
      console.log(`Label rotation: ${(labelPos.rotation * 180 / Math.PI).toFixed(1)}°`);
    }
  }
  console.log('');

  // Run test suite
  console.log('🧪 Running Test Suite');
  console.log('====================');
  printBidirectionalEdgeTestResults();
}

/**
 * Function to create a custom bidirectional graph for testing
 */
export function createCustomBidirectionalGraph(
  nodePairs: Array<{ source: string; target: string; label1: string; label2: string }>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeIds = new Set<string>();

  // Collect all unique node IDs
  nodePairs.forEach(pair => {
    nodeIds.add(pair.source);
    nodeIds.add(pair.target);
  });

  // Create nodes with positions
  let x = 100;
  let y = 100;
  Array.from(nodeIds).forEach((nodeId, index) => {
    nodes.push({
      id: nodeId,
      label: nodeId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      position: { x, y }
    });
    
    x += 200;
    if (index % 3 === 2) {
      x = 100;
      y += 150;
    }
  });

  // Create bidirectional edges
  nodePairs.forEach((pair, index) => {
    edges.push(
      {
        id: `${pair.source}_to_${pair.target}_${index}`,
        source: pair.source,
        target: pair.target,
        label: pair.label1
      },
      {
        id: `${pair.target}_to_${pair.source}_${index}`,
        source: pair.target,
        target: pair.source,
        label: pair.label2
      }
    );
  });

  return { nodes, edges };
}

/**
 * Example usage of the custom graph creator
 */
export function demonstrateCustomGraph(): void {
  console.log('🎨 Custom Graph Demo');
  console.log('===================\n');

  const customGraph = createCustomBidirectionalGraph([
    {
      source: 'frontend',
      target: 'backend',
      label1: 'sends requests to',
      label2: 'responds to'
    },
    {
      source: 'backend',
      target: 'database',
      label1: 'queries',
      label2: 'stores data in'
    },
    {
      source: 'frontend',
      target: 'auth_service',
      label1: 'authenticates via',
      label2: 'validates tokens for'
    }
  ]);

  console.log('Created custom graph:');
  console.log(`Nodes: ${customGraph.nodes.length}`);
  console.log(`Edges: ${customGraph.edges.length}`);
  
  customGraph.nodes.forEach(node => {
    console.log(`  Node: ${node.label} at (${node.position?.x}, ${node.position?.y})`);
  });
  
  customGraph.edges.forEach(edge => {
    console.log(`  Edge: ${edge.source} -> ${edge.target} "${edge.label}"`);
  });
}

// Export main demo function for use in the application
export default demonstrateBidirectionalEdges;
