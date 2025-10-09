import { describe, it, expect, beforeEach } from '@jest/globals';
import { HierarchicalLayoutService } from '../core/hierarchical-layout.service';
import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from '../core/types';

describe('HierarchicalLayoutService', () => {
  let layoutService: HierarchicalLayoutService;

  beforeEach(() => {
    layoutService = new HierarchicalLayoutService();
  });

  describe('layoutCategoriesWithNodes', () => {
    it('should position nodes in a hierarchical structure', () => {
      // Arrange
      const graphNodes: GraphNode[] = [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
      ];

      const c1Outputs: C1Output[] = [
        {
          id: 'c1_1',
          label: 'Category 1',
          c1Category: 'Category 1',
          nodesInCategory: 2,
          nodeIds: ['node1', 'node2'],
        },
      ];

      const c2Subcategories: C2Subcategory[] = [
        {
          id: 'c2_1',
          c1CategoryId: 'c1_1',
          label: 'Subcategory 1',
          c2Name: 'Subcategory 1',
          description: 'Test subcategory',
          purpose: 'Testing',
          nodeCount: 2,
          nodeIds: ['node1', 'node2'],
        },
      ];

      const graphEdges: GraphEdge[] = [
        { id: 'edge1', source: 'node1', target: 'node2', label: 'calls' },
      ];

      // Act
      const result = layoutService.layoutCategoriesWithNodes(
        graphNodes,
        graphEdges,
        c1Outputs,
        c2Subcategories,
        [],
        []
      );

      // Assert
      expect(result.graphNodes.length).toBe(2);
      expect(result.c1Nodes.length).toBe(1);
      expect(result.c2Nodes.length).toBe(1);
      
      // Check that all nodes have positions
      result.graphNodes.forEach(node => {
        expect(node.position).toBeDefined();
        expect(typeof node.position?.x).toBe('number');
        expect(typeof node.position?.y).toBe('number');
      });

      result.c1Nodes.forEach(node => {
        expect(node.position).toBeDefined();
      });

      result.c2Nodes.forEach(node => {
        expect(node.position).toBeDefined();
      });
    });

    it('should create hierarchical layers (C1 above C2 above leaves)', () => {
      const graphNodes: GraphNode[] = [{ id: 'node1', label: 'Node 1' }];
      const c1Outputs: C1Output[] = [
        {
          id: 'c1_1',
          label: 'Category 1',
          c1Category: 'Category 1',
          nodesInCategory: 1,
          nodeIds: ['node1'],
        },
      ];
      const c2Subcategories: C2Subcategory[] = [
        {
          id: 'c2_1',
          c1CategoryId: 'c1_1',
          label: 'Subcategory 1',
          c2Name: 'Subcategory 1',
          description: 'Test',
          purpose: 'Test',
          nodeCount: 1,
          nodeIds: ['node1'],
        },
      ];

      const result = layoutService.layoutCategoriesWithNodes(
        graphNodes,
        [],
        c1Outputs,
        c2Subcategories,
        [],
        []
      );

      // C1 should be above C2, C2 should be above leaf
      const c1Y = result.c1Nodes[0].position?.y ?? 0;
      const c2Y = result.c2Nodes[0].position?.y ?? 0;
      const leafY = result.graphNodes[0].position?.y ?? 0;

      expect(c1Y).toBeLessThan(c2Y);
      expect(c2Y).toBeLessThan(leafY);
    });

    it('should separate multiple C1 groups horizontally', () => {
      const graphNodes: GraphNode[] = [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
      ];
      
      const c1Outputs: C1Output[] = [
        {
          id: 'c1_1',
          label: 'Category 1',
          c1Category: 'Category 1',
          nodesInCategory: 1,
          nodeIds: ['node1'],
        },
        {
          id: 'c1_2',
          label: 'Category 2',
          c1Category: 'Category 2',
          nodesInCategory: 1,
          nodeIds: ['node2'],
        },
      ];

      const c2Subcategories: C2Subcategory[] = [
        {
          id: 'c2_1',
          c1CategoryId: 'c1_1',
          label: 'Sub 1',
          c2Name: 'Sub 1',
          description: 'Test',
          purpose: 'Test',
          nodeCount: 1,
          nodeIds: ['node1'],
        },
        {
          id: 'c2_2',
          c1CategoryId: 'c1_2',
          label: 'Sub 2',
          c2Name: 'Sub 2',
          description: 'Test',
          purpose: 'Test',
          nodeCount: 1,
          nodeIds: ['node2'],
        },
      ];

      const result = layoutService.layoutCategoriesWithNodes(
        graphNodes,
        [],
        c1Outputs,
        c2Subcategories,
        [],
        []
      );

      // C1 groups should be separated horizontally
      const c1_1 = result.c1Nodes.find(n => n.id === 'c1_1');
      const c1_2 = result.c1Nodes.find(n => n.id === 'c1_2');

      expect(c1_1?.position?.x).toBeDefined();
      expect(c1_2?.position?.x).toBeDefined();
      
      // Assuming left-to-right packing
      const distance = Math.abs((c1_2?.position?.x ?? 0) - (c1_1?.position?.x ?? 0));
      expect(distance).toBeGreaterThan(100); // Should have meaningful separation
    });

    it('should generate group bounds for background rendering', () => {
      const graphNodes: GraphNode[] = [{ id: 'node1', label: 'Node 1' }];
      const c1Outputs: C1Output[] = [
        {
          id: 'c1_1',
          label: 'Category 1',
          c1Category: 'Category 1',
          nodesInCategory: 1,
          nodeIds: ['node1'],
        },
      ];
      const c2Subcategories: C2Subcategory[] = [
        {
          id: 'c2_1',
          c1CategoryId: 'c1_1',
          label: 'Sub 1',
          c2Name: 'Sub 1',
          description: 'Test',
          purpose: 'Test',
          nodeCount: 1,
          nodeIds: ['node1'],
        },
      ];

      const result = layoutService.layoutCategoriesWithNodes(
        graphNodes,
        [],
        c1Outputs,
        c2Subcategories,
        [],
        []
      );

      expect(result.groupBounds).toBeDefined();
      expect(result.groupBounds.length).toBe(1);
      expect(result.groupBounds[0]).toHaveProperty('x');
      expect(result.groupBounds[0]).toHaveProperty('y');
      expect(result.groupBounds[0]).toHaveProperty('width');
      expect(result.groupBounds[0]).toHaveProperty('height');
    });

    it('should handle empty inputs gracefully', () => {
      const result = layoutService.layoutCategoriesWithNodes(
        [],
        [],
        [],
        [],
        [],
        []
      );

      expect(result.graphNodes).toEqual([]);
      expect(result.c1Nodes).toEqual([]);
      expect(result.c2Nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });
});
