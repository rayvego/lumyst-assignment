import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

export class ReactFlowService {
  convertDataToReactFlowDataTypes(
    graphNodes: GraphNode[],
    c1Nodes: C1Output[],
    c2Nodes: C2Subcategory[],
    edges: GraphEdge[]
  ) {

    const allNodes = [
      ...graphNodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: { background: '#dbeafe', border: '2px solid #3b82f6', color: '#1e40af', borderRadius: '6px' },
      })),
      ...c1Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: { background: '#fef2f2', border: '3px solid #dc2626', color: '#991b1b', fontWeight: 'bold', borderRadius: '6px' },
      })),
      ...c2Nodes.map((node) => ({
        id: node.id,
        position: node.position || { x: 0, y: 0 },
        data: { label: node.label },
        type: 'default',
        style: { background: '#f0fdf4', border: '2px solid #16a34a', color: '#166534', borderRadius: '6px' },
      })),
    ];

 
    const seenIds = new Set<string>();
    const uniqueNodes = allNodes.filter(node => {
      if (seenIds.has(node.id)) {
        console.warn('Found and removed duplicate node with ID:', node.id);
        return false;
      } else {
        seenIds.add(node.id);
        return true;
      }
    });
    

    const reactFlowNodes = uniqueNodes;

    
    const processedEdges = new Set<string>();
    const reactFlowEdges = [];

    for (const edge of edges) {
      if (processedEdges.has(edge.id)) {
        continue;
      }

      const reverseEdge = edges.find(
        (e) => e.source === edge.target && e.target === edge.source
      );

      if (reverseEdge) {
        
        const edgeId = [edge.source, edge.target].sort().join('-');
        
        
        if (!processedEdges.has(edgeId)) {
            reactFlowEdges.push({
                id: edgeId,
                source: edge.source,
                target: edge.target,
                type: 'bidirectional',
                data: { label1: edge.label, label2: reverseEdge.label },
            });
            processedEdges.add(edgeId);
        }
        
        
        processedEdges.add(edge.id);
        processedEdges.add(reverseEdge.id);

      } else {
        reactFlowEdges.push({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          style: edge.label === 'contains'
            ? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
            : edge.id.startsWith('c2_relationship')
              ? { stroke: '#059669', strokeWidth: 2 }
              : edge.id.startsWith('cross_c1_c2_rel')
                ? { stroke: '#d97706', strokeWidth: 2 }
                : { stroke: '#374151', strokeWidth: 1 },
          labelStyle: { fill: '#000', fontWeight: '500' },
        });
      }
    }

    return {
      nodes: reactFlowNodes,
      edges: reactFlowEdges,
    };
  }
}