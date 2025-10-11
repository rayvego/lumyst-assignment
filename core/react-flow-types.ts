import type { Node, Edge } from '@xyflow/react';

/**
 * Custom ReactFlow edge with bidirectional support
 */
export interface BidirectionalReactFlowEdge extends Edge {
  labelStyle?: {
    fill: string;
    fontWeight: string;
    fontSize: string;
  };
  labelBgStyle?: {
    fill: string;
    fillOpacity: number;
  };
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  type?: string;
  data?: {
    isBidirectional: boolean;
    labelOffset?: number;
    labelPosition?: 'top' | 'bottom';
    highlightOnHover?: boolean;
  };
}

/**
 * Custom ReactFlow node type
 */
export interface CustomReactFlowNode extends Node {
  data: {
    label: string;
    type?: string;
    syntaxType?: string;
    filePath?: string;
    isAbstract?: boolean;
    isOverride?: boolean;
    categoryData?: {
      c1Category?: string;
      c2Name?: string;
      nodesInCategory?: number;
      nodeCount?: number;
      categoryDescription?: string;
      description?: string;
    };
  };
}
