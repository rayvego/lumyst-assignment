import type { GraphNode, GraphEdge } from './types';

/**
 * Sample graph data with bidirectional edges for testing
 * Demonstrates the bidirectional edge functionality with various scenarios
 */
export function createSampleBidirectionalGraph(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [
    {
      id: 'api_error_handling',
      label: 'API Error and Exception Handling',
      position: { x: 200, y: 100 }
    },
    {
      id: 'app_routing_lifecycle',
      label: 'Application Routing and Lifecycle',
      position: { x: 500, y: 100 }
    },
    {
      id: 'user_authentication',
      label: 'User Authentication Service',
      position: { x: 200, y: 300 }
    },
    {
      id: 'database_connection',
      label: 'Database Connection Pool',
      position: { x: 500, y: 300 }
    },
    {
      id: 'logging_service',
      label: 'Centralized Logging Service',
      position: { x: 350, y: 500 }
    }
  ];

  const edges: GraphEdge[] = [
    // Bidirectional relationship between API Error and App Routing
    {
      id: 'api_to_routing',
      source: 'api_error_handling',
      target: 'app_routing_lifecycle',
      label: 'provides error utilities to'
    },
    {
      id: 'routing_to_api',
      source: 'app_routing_lifecycle',
      target: 'api_error_handling',
      label: 'sends exceptions to'
    },
    
    // Bidirectional relationship between User Auth and Database
    {
      id: 'auth_to_db',
      source: 'user_authentication',
      target: 'database_connection',
      label: 'validates credentials via'
    },
    {
      id: 'db_to_auth',
      source: 'database_connection',
      target: 'user_authentication',
      label: 'returns user data to'
    },
    
    // Unidirectional edges to logging service
    {
      id: 'api_to_logging',
      source: 'api_error_handling',
      target: 'logging_service',
      label: 'logs errors to'
    },
    {
      id: 'auth_to_logging',
      source: 'user_authentication',
      target: 'logging_service',
      label: 'logs auth events to'
    },
    
    // Complex bidirectional relationship with multiple labels
    {
      id: 'routing_to_auth',
      source: 'app_routing_lifecycle',
      target: 'user_authentication',
      label: 'requires authentication from'
    },
    {
      id: 'auth_to_routing',
      source: 'user_authentication',
      target: 'app_routing_lifecycle',
      label: 'validates tokens for'
    },
    
    // Another bidirectional pair
    {
      id: 'db_to_logging',
      source: 'database_connection',
      target: 'logging_service',
      label: 'logs queries to'
    },
    {
      id: 'logging_to_db',
      source: 'logging_service',
      target: 'database_connection',
      label: 'stores audit logs in'
    }
  ];

  return { nodes, edges };
}

/**
 * Creates a minimal test case for bidirectional edges
 * Useful for debugging and validation
 */
export function createMinimalBidirectionalTest(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [
    {
      id: 'node_a',
      label: 'Node A',
      position: { x: 100, y: 100 }
    },
    {
      id: 'node_b',
      label: 'Node B',
      position: { x: 300, y: 100 }
    }
  ];

  const edges: GraphEdge[] = [
    {
      id: 'a_to_b',
      source: 'node_a',
      target: 'node_b',
      label: 'connects to'
    },
    {
      id: 'b_to_a',
      source: 'node_b',
      target: 'node_a',
      label: 'responds to'
    }
  ];

  return { nodes, edges };
}

/**
 * Creates a complex test case with multiple bidirectional relationships
 * Tests edge cases and overlapping scenarios
 */
export function createComplexBidirectionalTest(): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = [
    {
      id: 'service_1',
      label: 'Microservice 1',
      position: { x: 100, y: 100 }
    },
    {
      id: 'service_2',
      label: 'Microservice 2',
      position: { x: 400, y: 100 }
    },
    {
      id: 'service_3',
      label: 'Microservice 3',
      position: { x: 250, y: 250 }
    },
    {
      id: 'gateway',
      label: 'API Gateway',
      position: { x: 250, y: 400 }
    }
  ];

  const edges: GraphEdge[] = [
    // Service 1 <-> Service 2
    {
      id: 's1_to_s2_request',
      source: 'service_1',
      target: 'service_2',
      label: 'sends requests to'
    },
    {
      id: 's2_to_s1_response',
      source: 'service_2',
      target: 'service_1',
      label: 'sends responses to'
    },
    
    // Service 1 <-> Service 3
    {
      id: 's1_to_s3_notify',
      source: 'service_1',
      target: 'service_3',
      label: 'notifies'
    },
    {
      id: 's3_to_s1_ack',
      source: 'service_3',
      target: 'service_1',
      label: 'acknowledges'
    },
    
    // Service 2 <-> Service 3
    {
      id: 's2_to_s3_sync',
      source: 'service_2',
      target: 'service_3',
      label: 'synchronizes with'
    },
    {
      id: 's3_to_s2_update',
      source: 'service_3',
      target: 'service_2',
      label: 'updates'
    },
    
    // All services to Gateway (unidirectional)
    {
      id: 's1_to_gateway',
      source: 'service_1',
      target: 'gateway',
      label: 'registers with'
    },
    {
      id: 's2_to_gateway',
      source: 'service_2',
      target: 'gateway',
      label: 'registers with'
    },
    {
      id: 's3_to_gateway',
      source: 'service_3',
      target: 'gateway',
      label: 'registers with'
    }
  ];

  return { nodes, edges };
}
