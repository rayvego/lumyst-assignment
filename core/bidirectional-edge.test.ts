import { BidirectionalEdgeService } from './bidirectional-edge.service';
import { createSampleBidirectionalGraph, createMinimalBidirectionalTest } from './sample-bidirectional-graph';
import type { GraphEdge, GraphNode } from './types';

/**
 * Test suite for bidirectional edge functionality
 * Validates detection, offset calculation, and label positioning
 */
export class BidirectionalEdgeTest {
  private service = new BidirectionalEdgeService();

  /**
   * Runs all tests and returns results
   */
  runAllTests(): { passed: number; failed: number; results: string[] } {
    const results: string[] = [];
    let passed = 0;
    let failed = 0;

    const tests = [
      this.testBidirectionalEdgeDetection,
      this.testLabelOffsetCalculation,
      this.testCursorHighlighting,
      this.testEdgeValidation,
      this.testComplexScenarios
    ];

    tests.forEach((test, index) => {
      try {
        const result = test.call(this);
        if (result.passed) {
          passed++;
          results.push(`✅ Test ${index + 1}: ${result.name}`);
        } else {
          failed++;
          results.push(`❌ Test ${index + 1}: ${result.name} - ${result.error}`);
        }
      } catch (error) {
        failed++;
        results.push(`❌ Test ${index + 1}: ${test.name} - Unexpected error: ${error}`);
      }
    });

    return { passed, failed, results };
  }

  /**
   * Test bidirectional edge detection
   */
  private testBidirectionalEdgeDetection(): { passed: boolean; name: string; error?: string } {
    const { edges } = createMinimalBidirectionalTest();
    const bidirectionalMap = this.service.detectBidirectionalEdges(edges);

    if (bidirectionalMap.size !== 1) {
      return {
        passed: false,
        name: 'Bidirectional Edge Detection',
        error: `Expected 1 bidirectional pair, found ${bidirectionalMap.size}`
      };
    }

    const bidirectionalPair = Array.from(bidirectionalMap.values())[0];
    if (bidirectionalPair.length !== 2) {
      return {
        passed: false,
        name: 'Bidirectional Edge Detection',
        error: `Expected 2 edges in pair, found ${bidirectionalPair.length}`
      };
    }

    return {
      passed: true,
      name: 'Bidirectional Edge Detection'
    };
  }

  /**
   * Test label offset calculation
   */
  private testLabelOffsetCalculation(): { passed: boolean; name: string; error?: string } {
    const { nodes, edges } = createMinimalBidirectionalTest();
    const processedEdges = this.service.applyLabelOffsets(edges, nodes);

    const bidirectionalEdges = processedEdges.filter(e => e.isBidirectional);
    if (bidirectionalEdges.length !== 2) {
      return {
        passed: false,
        name: 'Label Offset Calculation',
        error: `Expected 2 bidirectional edges, found ${bidirectionalEdges.length}`
      };
    }

    // Check that offsets are different
    const offsets = bidirectionalEdges.map(e => e.labelOffset || 0);
    if (offsets[0] === offsets[1]) {
      return {
        passed: false,
        name: 'Label Offset Calculation',
        error: 'Bidirectional edges have identical offsets'
      };
    }

    // Check that labels are positioned differently
    const positions = bidirectionalEdges.map(e => e.labelPosition);
    if (positions[0] === positions[1]) {
      return {
        passed: false,
        name: 'Label Offset Calculation',
        error: 'Bidirectional edges have identical label positions'
      };
    }

    return {
      passed: true,
      name: 'Label Offset Calculation'
    };
  }

  /**
   * Test cursor-based highlighting
   */
  private testCursorHighlighting(): { passed: boolean; name: string; error?: string } {
    const { nodes, edges } = createMinimalBidirectionalTest();
    const processedEdges = this.service.applyLabelOffsets(edges, nodes);

    // Test highlighting near edge
    const cursorNearEdge = { x: 200, y: 100 };
    const highlightedEdges = this.service.highlightLabelsOnCursor(
      processedEdges,
      cursorNearEdge,
      nodes
    );

    const highlightedCount = highlightedEdges.filter(e => e.highlightOnHover).length;
    if (highlightedCount === 0) {
      return {
        passed: false,
        name: 'Cursor Highlighting',
        error: 'No edges highlighted when cursor is near'
      };
    }

    // Test highlighting far from edges
    const cursorFarFromEdges = { x: 1000, y: 1000 };
    const nonHighlightedEdges = this.service.highlightLabelsOnCursor(
      processedEdges,
      cursorFarFromEdges,
      nodes
    );

    const nonHighlightedCount = nonHighlightedEdges.filter(e => e.highlightOnHover).length;
    if (nonHighlightedCount !== 0) {
      return {
        passed: false,
        name: 'Cursor Highlighting',
        error: 'Edges highlighted when cursor is far away'
      };
    }

    return {
      passed: true,
      name: 'Cursor Highlighting'
    };
  }

  /**
   * Test edge validation
   */
  private testEdgeValidation(): { passed: boolean; name: string; error?: string } {
    const { nodes, edges } = createMinimalBidirectionalTest();
    const processedEdges = this.service.applyLabelOffsets(edges, nodes);

    const validation = this.service.validateBidirectionalEdges(processedEdges);
    if (!validation.isValid) {
      return {
        passed: false,
        name: 'Edge Validation',
        error: `Validation failed: ${validation.issues.join(', ')}`
      };
    }

    return {
      passed: true,
      name: 'Edge Validation'
    };
  }

  /**
   * Test complex scenarios with multiple bidirectional relationships
   */
  private testComplexScenarios(): { passed: boolean; name: string; error?: string } {
    const { edges } = createSampleBidirectionalGraph();
    const bidirectionalMap = this.service.detectBidirectionalEdges(edges);

    // Should detect multiple bidirectional pairs
    if (bidirectionalMap.size < 2) {
      return {
        passed: false,
        name: 'Complex Scenarios',
        error: `Expected at least 2 bidirectional pairs, found ${bidirectionalMap.size}`
      };
    }

    // Test with sample nodes (create some dummy positions)
    const sampleNodes: GraphNode[] = [
      { id: 'api_error_handling', label: 'API Error Handling', position: { x: 200, y: 100 } },
      { id: 'app_routing_lifecycle', label: 'App Routing', position: { x: 500, y: 100 } },
      { id: 'user_authentication', label: 'User Auth', position: { x: 200, y: 300 } },
      { id: 'database_connection', label: 'Database', position: { x: 500, y: 300 } },
      { id: 'logging_service', label: 'Logging', position: { x: 350, y: 500 } }
    ];

    const processedEdges = this.service.applyLabelOffsets(edges, sampleNodes);
    const bidirectionalEdges = processedEdges.filter(e => e.isBidirectional);

    if (bidirectionalEdges.length < 4) {
      return {
        passed: false,
        name: 'Complex Scenarios',
        error: `Expected at least 4 bidirectional edges, found ${bidirectionalEdges.length}`
      };
    }

    return {
      passed: true,
      name: 'Complex Scenarios'
    };
  }

  /**
   * Test label position calculation for curved edges
   */
  testCurvedLabelPosition(): { passed: boolean; name: string; error?: string } {
    const { nodes, edges } = createMinimalBidirectionalTest();
    const processedEdges = this.service.applyLabelOffsets(edges, nodes);
    const bidirectionalEdge = processedEdges.find(e => e.isBidirectional);

    if (!bidirectionalEdge) {
      return {
        passed: false,
        name: 'Curved Label Position',
        error: 'No bidirectional edge found for testing'
      };
    }

    const labelPos = this.service.calculateCurvedLabelPosition(bidirectionalEdge, nodes, 0.5);
    
    if (typeof labelPos.x !== 'number' || typeof labelPos.y !== 'number') {
      return {
        passed: false,
        name: 'Curved Label Position',
        error: 'Invalid label position coordinates'
      };
    }

    return {
      passed: true,
      name: 'Curved Label Position'
    };
  }

  /**
   * Prints test results to console
   */
  printTestResults(): void {
    const results = this.runAllTests();
    
    console.log('\n🧪 Bidirectional Edge Tests Results:');
    console.log('=====================================');
    results.results.forEach(result => console.log(result));
    console.log('=====================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.passed + results.failed}`);
    
    if (results.failed === 0) {
      console.log('🎉 All tests passed! Bidirectional edge functionality is working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the implementation.');
    }
  }
}

/**
 * Utility function to run tests and return results
 */
export function runBidirectionalEdgeTests(): { passed: number; failed: number; results: string[] } {
  const testSuite = new BidirectionalEdgeTest();
  return testSuite.runAllTests();
}

/**
 * Utility function to print test results
 */
export function printBidirectionalEdgeTestResults(): void {
  const testSuite = new BidirectionalEdgeTest();
  testSuite.printTestResults();
}
