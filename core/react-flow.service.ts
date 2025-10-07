
import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
  convertDataToReactFlowDataTypes(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[]
  ) {
    const reactFlowNodes = [
      // C1 category nodes - IMPROVED styling
      ...c1Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: {
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
          border: '4px solid #dc2626',
          color: '#7f1d1d',
          fontWeight: 'bold',
          borderRadius: '12px',
          padding: '24px 28px',  // Increased padding
          fontSize: '16px',  // Increased from 15px
          minWidth: '280px',  // Increased from 240px
          minHeight: '120px',  // Increased from 100px
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 16px rgba(220, 38, 38, 0.3)',
          textAlign: 'center',
          wordWrap: 'break-word',
          overflow: 'visible',  // Changed from hidden
          lineHeight: '1.4',  // Added for better text spacing
        },
      })),
      // C2 subcategory nodes - IMPROVED styling
      ...c2Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: {
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          border: '3px solid #16a34a',
          color: '#14532d',
          fontWeight: '600',
          borderRadius: '10px',
          padding: '20px 24px',  // Increased padding
          fontSize: '14px',  // Increased from 13.5px
          minWidth: '240px',  // Increased from 200px
          minHeight: '100px',  // Increased from 80px
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 12px rgba(22, 163, 74, 0.25)',
          textAlign: 'center',
          wordWrap: 'break-word',
          overflow: 'visible',  // Changed from hidden
          lineHeight: '1.3',  // Added for better text spacing
        },
      })),
      // Regular graph nodes - IMPROVED styling
      ...graphNodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: {
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '2px solid #3b82f6',
          color: '#1e3a8a',
          fontWeight: '500',
          borderRadius: '8px',
          padding: '14px 18px',  // Increased padding
          fontSize: '13px',  // Increased from 12px
          minWidth: '180px',  // Increased from 160px
          minHeight: '70px',  // Increased from 60px
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 8px rgba(59, 130, 246, 0.2)',
          textAlign: 'center',
          wordWrap: 'break-word',
          overflow: 'visible',  // Changed from hidden
          lineHeight: '1.3',  // Added for better text spacing
        },
      }))
    ];

    const reactFlowEdges = edges.map((edge) => {
      let edgeStyle = {};
      let animated = false;
      let type = 'default';
      let markerEnd = undefined;

      if (edge.label === 'contains') {
        edgeStyle = {
          stroke: '#cbd5e1',
          strokeWidth: 2,
          strokeDasharray: '8,5',
        };
        type = 'straight';
      } else if (edge.id.startsWith('c2_relationship')) {
        edgeStyle = {
          stroke: '#10b981',
          strokeWidth: 3,
        };
        animated = true;
        type = 'smoothstep';
        markerEnd = {
          type: 'arrowclosed' as const,
          color: '#10b981',
        };
      } else if (edge.id.startsWith('cross_c1_c2_rel')) {
        edgeStyle = {
          stroke: '#f59e0b',
          strokeWidth: 3,
        };
        animated = true;
        type = 'smoothstep';
        markerEnd = {
          type: 'arrowclosed' as const,
          color: '#f59e0b',
        };
      } else {
        edgeStyle = {
          stroke: '#64748b',
          strokeWidth: 2,
        };
        type = 'smoothstep';
        markerEnd = {
          type: 'arrowclosed' as const,
          color: '#64748b',
        };
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label !== 'contains' ? edge.label : undefined,
        type,
        animated,
        style: edgeStyle,
        markerEnd,
        labelStyle: {
          fill: '#1f2937',
          fontWeight: '600',
          fontSize: '14px',  
          background: 'white',
          padding: '8px 14px',
          borderRadius: '4px',
          border: '1px solid #e5e7eb',
		  
        },
        labelBgStyle: {
          fill: 'white',
          fillOpacity: 1,
        },
      };
    });

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    };
  }
}

 