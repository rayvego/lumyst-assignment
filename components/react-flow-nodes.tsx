import { Handle, Position } from "@xyflow/react";
import type { ReactFlowNode } from "../core/types";

interface BaseNodeProps {
	data: ReactFlowNode["data"] & {
		incomingEdgeCount?: number;
	};
	selected?: boolean;
}

interface CategoryNodeProps extends BaseNodeProps {
	data: ReactFlowNode["data"] & {
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

// Enhanced C1 Category Node Component - keeping original red styling
export function C1CategoryNode({ data }: CategoryNodeProps) {
	const label = data.categoryData?.c1Category || data.label;
	const incomingCount = data.incomingEdgeCount || 0;
	
	return (
		<div
			style={{
				background: '#fef2f2',
				border: '3px solid #dc2626',
				color: '#991b1b',
				fontWeight: 'bold',
				borderRadius: '6px',
				padding: '6px 8px',
				whiteSpace: 'normal',
				wordWrap: 'break-word' as const,
				textAlign: 'center' as const,
				lineHeight: '1.2',
				fontSize: '12px',
				minWidth: '140px',
				maxWidth: '300px'
			}}
		>
			{/* Multiple target handles only if node has multiple incoming edges */}
			{incomingCount > 1 ? (
				<>
					<Handle type="target" position={Position.Top} id="target-0" className="w-2 h-2" style={{ backgroundColor: '#dc2626', left: '25%' }} />
					<Handle type="target" position={Position.Top} id="target-1" className="w-2 h-2" style={{ backgroundColor: '#dc2626', left: '50%' }} />
					<Handle type="target" position={Position.Top} id="target-2" className="w-2 h-2" style={{ backgroundColor: '#dc2626', left: '75%' }} />
					<Handle type="target" position={Position.Top} id="target-3" className="w-2 h-2" style={{ backgroundColor: '#dc2626', left: '10%' }} />
				</>
			) : (
				<Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: '#dc2626' }} />
			)}

			<div style={{ textAlign: 'center' }}>
				<div style={{ fontWeight: 'bold', fontSize: '12px', lineHeight: '1.2' }} title={label}>
					{label}
				</div>
			</div>

			{/* Single source handle - only visible when connected */}
			<Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: '#dc2626' }} />
		</div>
	);
}

// Enhanced C2 Subcategory Node Component - keeping original green styling
export function C2SubcategoryNode({ data }: CategoryNodeProps) {
	const label = data.categoryData?.c2Name || data.label;
	const incomingCount = data.incomingEdgeCount || 0;
	
	return (
		<div
			style={{
				background: '#f0fdf4',
				border: '2px solid #16a34a',
				color: '#166534',
				borderRadius: '6px',
				padding: '6px 8px',
				whiteSpace: 'normal',
				wordWrap: 'break-word' as const,
				textAlign: 'center' as const,
				lineHeight: '1.2',
				fontSize: '12px',
				minWidth: '140px',
				maxWidth: '300px'
			}}
		>
			{/* Multiple target handles only if node has multiple incoming edges */}
			{incomingCount > 1 ? (
				<>
					<Handle type="target" position={Position.Top} id="target-0" className="w-2 h-2" style={{ backgroundColor: '#16a34a', left: '25%' }} />
					<Handle type="target" position={Position.Top} id="target-1" className="w-2 h-2" style={{ backgroundColor: '#16a34a', left: '50%' }} />
					<Handle type="target" position={Position.Top} id="target-2" className="w-2 h-2" style={{ backgroundColor: '#16a34a', left: '75%' }} />
					<Handle type="target" position={Position.Top} id="target-3" className="w-2 h-2" style={{ backgroundColor: '#16a34a', left: '10%' }} />
				</>
			) : (
				<Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: '#16a34a' }} />
			)}

			<div style={{ textAlign: 'center' }}>
				<div style={{ fontSize: '12px', lineHeight: '1.2' }} title={label}>
					{label}
				</div>
			</div>

			{/* Single source handle - only visible when connected */}
			<Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: '#16a34a' }} />
		</div>
	);
}

// Enhanced Graph Node Component - keeping original blue styling
export function GraphNode({ data }: BaseNodeProps) {
	const incomingCount = data.incomingEdgeCount || 0;
	
	return (
		<div
			style={{
				background: '#dbeafe',
				border: '2px solid #3b82f6',
				color: '#1e40af',
				borderRadius: '6px',
				padding: '6px 8px',
				whiteSpace: 'normal',
				wordWrap: 'break-word' as const,
				textAlign: 'center' as const,
				lineHeight: '1.2',
				fontSize: '12px',
				minWidth: '120px',
				maxWidth: '280px'
			}}
		>
			{/* Multiple target handles only if node has multiple incoming edges */}
			{incomingCount > 1 ? (
				<>
					<Handle type="target" position={Position.Top} id="target-0" className="w-2 h-2" style={{ backgroundColor: '#3b82f6', left: '25%' }} />
					<Handle type="target" position={Position.Top} id="target-1" className="w-2 h-2" style={{ backgroundColor: '#3b82f6', left: '50%' }} />
					<Handle type="target" position={Position.Top} id="target-2" className="w-2 h-2" style={{ backgroundColor: '#3b82f6', left: '75%' }} />
					<Handle type="target" position={Position.Top} id="target-3" className="w-2 h-2" style={{ backgroundColor: '#3b82f6', left: '10%' }} />
				</>
			) : (
				<Handle type="target" position={Position.Top} className="w-3 h-3" style={{ backgroundColor: '#3b82f6' }} />
			)}

			<div style={{ textAlign: 'center' }}>
				<div style={{ fontSize: '12px', lineHeight: '1.2' }} title={data.label}>
					{data.label}
				</div>
			</div>

			{/* Single source handle - only visible when connected */}
			<Handle type="source" position={Position.Bottom} className="w-3 h-3" style={{ backgroundColor: '#3b82f6' }} />
		</div>
	);
}

// Enhanced node type definitions for React Flow
export const nodeTypes = {
	c1CategoryNode: C1CategoryNode,
	c2SubcategoryNode: C2SubcategoryNode,
	graphNode: GraphNode,
};
