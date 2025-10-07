export interface GraphNode {
	id: string;
	label: string;
	position?: { x: number; y: number };
	importanceScore?: number; // 0.0 to 1.0 - Task 5: utility detection
	isUtility?: boolean; // Task 5: whether this is a utility function
	confidence?: number; // Task 5: confidence in classification
}

export interface GraphEdge {
	id: string;
	source: string;
	target: string;
	label: string;
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
