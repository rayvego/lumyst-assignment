// src/core/data/react-flow.service.ts
import type {
  GraphNode, GraphEdge, C1Output, C2Subcategory,
  ReactFlowNode, ReactFlowEdge
} from '../types';

export class ReactFlowService {
  private readonly NODE_STYLES = {
    code: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      border: '2px solid #4c51bf',
      color: 'white',
      borderRadius: '8px',
      fontSize: '12px',
      padding: '8px 12px',
      minWidth: '120px',
      textAlign: 'center',
      zIndex: 1,
    },
    c1: {
      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      border: '3px solid #e53e3e',
      color: 'white',
      fontWeight: 'bold',
      borderRadius: '12px',
      fontSize: '14px',
      padding: '12px 16px',
      minWidth: '160px',
      zIndex: 3,
    },
    c2: {
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      border: '2px solid #38a169',
      color: '#2d3748',
      fontWeight: '600',
      borderRadius: '10px',
      fontSize: '13px',
      padding: '10px 14px',
      minWidth: '140px',
      zIndex: 2,
    },
  };

  private readonly EDGE_STYLES = {
    default: { stroke: '#a0aec0', strokeWidth: 2, animated: false },
    container: { stroke: '#38a169', strokeWidth: 3, animated: false },
    containment: { stroke: '#a0aec0', strokeDasharray: '5,5', strokeWidth: 2, animated: false },
    relationship: { stroke: '#ed8936', strokeWidth: 2, animated: true },
    reversed: { stroke: '#ef4444', strokeDasharray: '2,2', strokeWidth: 2, animated: false },
  };

  public convertDataToReactFlowDataTypes(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[]
  ): { nodes: ReactFlowNode[]; edges: ReactFlowEdge[] } {

    const mapNode = (node: any, type: string, style: any): ReactFlowNode => ({
      id: node.id,
      position: node.position || { x: 0, y: 0 },
      data: {
        label: node.label,
        isRoot: node.isRoot,
        isCritical: node.isCritical,
      },
      type,
      style,
    });

    const reactFlowNodes: ReactFlowNode[] = [
      ...graphNodes.map((node) => mapNode(node, 'codeFile', this.NODE_STYLES.code)),
      ...c1Nodes.map((node) => mapNode(node, 'c1Category', this.NODE_STYLES.c1)),
      ...c2Nodes.map((node) => mapNode(node, 'c2Subcategory', this.NODE_STYLES.c2)),
    ];

    const reactFlowEdges: ReactFlowEdge[] = edges.map((edge) => {
      let edgeStyle = { ...this.EDGE_STYLES.default };
      let edgeType = 'smoothstep';

      switch (edge.type) {
        case 'containment':
          edgeStyle = this.EDGE_STYLES.containment;
          break;
        case 'relationship':
        case 'c1-cross':
          edgeStyle = this.EDGE_STYLES.relationship;
          break;
        case 'container':
          edgeStyle = this.EDGE_STYLES.container;
          break;
        default:
          edgeStyle = this.EDGE_STYLES.default;
          edgeType = 'default';
          break;
      }
      
      if (edge.reversed) {
        edgeStyle = { ...edgeStyle, ...this.EDGE_STYLES.reversed };
        edgeType = 'step';
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        type: edgeType,
        style: edgeStyle,
        animated: edgeStyle.animated,
        data: { offsetX: edge.offsetX, reversed: edge.reversed },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.8 },
        labelBgPadding: [4, 8],
        labelBgBorderRadius: 4,
      };
    });

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    };
  }
}
