import type { Node, Edge } from "@xyflow/react";

export type ReactFlowNode = Node<{
  label: string;
  [key: string]: any;
}>;

export type ReactFlowEdge = Edge<{
  [key: string]: any;
}>;

export interface GraphNode {
	id: string;
	label: string;
	position?: { x: number; y: number };
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
