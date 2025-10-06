// Minimal by design; the layout service assigns coordinates later.
export interface GraphNode {
	id: string;
	label: string;
	position?: { x: number; y: number };
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	label: string; // relationship type (e.g., contains, calls, etc.)
}

export interface C1Output {
	id: string;
	label: string;
	c1Category: string;
	nodesInCategory: number;
	nodeIds: string[];
	position?: { x: number; y: number };
}

export interface C2Subcategory {
	id: string;
	c1CategoryId: string;
	label: string;
	c2Name: string;
	description: string;
	purpose: string;
	nodeCount: number;
	nodeIds: string[];
	position?: { x: number; y: number };
}

export interface C2Relationship {
	id: string;
	c1CategoryId: string;
	fromC2: string;
	toC2: string;
	label: string;
}

export interface CrossC1C2Relationship {
	id: string;
	fromC1: string;
	fromC2: string;
	toC1: string;
	toC2: string;
	label: string;
}

// Type used by React Flow node components for their `data` prop
export interface ReactFlowNode {
  id: string;
  position?: { x: number; y: number };
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