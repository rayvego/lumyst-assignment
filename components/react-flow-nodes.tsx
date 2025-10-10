import { Handle, Position, getBezierPath, BaseEdge, EdgeLabelRenderer, getEdgeCenter } from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import type { ReactFlowNode } from "../core/types";

// The data types for your nodes and categories.
interface BaseNodeProps {
    data: ReactFlowNode["data"];
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

// Custom bidirectional edge component with dynamic line and label positioning.
export function CustomBidirectionalEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
}: EdgeProps) {
    // This logic handles the two-way edges.
    if (data?.isBidirectional) {
        const offset = 15; // Visual separation distance
        const isReverse = data.direction === 'B_TO_A';

        // Calculate a vector perpendicular to the straight line between nodes.
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normalX = dy / dist;
        const normalY = -dx / dist;

        // Apply offset to create two separate curved paths.
        const path = getBezierPath({
            sourceX: sourceX + normalX * (isReverse ? -offset : offset),
            sourceY: sourceY + normalY * (isReverse ? -offset : offset),
            sourcePosition,
            targetX: targetX + normalX * (isReverse ? -offset : offset),
            targetY: targetY + normalY * (isReverse ? -offset : offset),
            targetPosition,
        });

        // Smart label placement logic to slide labels towards their start node.
        const labelPosFactor = isReverse ? 0.6 : 0.4;
        const [labelX, labelY] = getBezierPath({
            sourceX, sourceY, sourcePosition,
            targetX, targetY, targetPosition,
        }, labelPosFactor);

        return (
            <>
                <BaseEdge id={id} path={path[0]} style={{ stroke: isReverse ? '#9d174d' : '#84cc16', strokeWidth: 2 }} />
                <EdgeLabelRenderer>
                    <div
                        style={{
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            pointerEvents: 'all',
                            color: '#1f2937',
                            fontSize: '12px',
                            fontWeight: '500',
                            // Optional: Rotate label to align with the edge
                            // transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) rotate(${path[1]}deg)`,
                        }}
                        className="nodrag nopan"
                    >
                        {data.label}
                    </div>
                </EdgeLabelRenderer>
            </>
        );
    }
    // Fallback for default edges if not part of a bidirectional pair.
    const [path, labelX, labelY] = getBezierPath({
        sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition
    });

    return (
        <>
            <BaseEdge id={id} path={path} style={{ stroke: '#9ca3af', strokeWidth: 1 }} />
            <EdgeLabelRenderer>
                <div
                    style={{
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: 'all',
                        color: '#1f2937',
                        fontSize: '12px',
                        fontWeight: '500',
                    }}
                    className="nodrag nopan"
                >
                    {data.label}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

// C1 Category Node Component
export function C1CategoryNode({ data, selected }: CategoryNodeProps) {
    return (
        <div
            className={`bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 rounded-lg p-3 shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-purple-700 transition-all cursor-pointer min-w-[180px] max-w-[240px] w-[220px] overflow-hidden ${
                selected ? "ring-2 ring-purple-300" : ""
            }`}
        >
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-300" />
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-300 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-semibold text-white text-sm line-clamp-2"
                        title={data.categoryData?.c1Category || data.label}
                    >
                        {data.categoryData?.c1Category || data.label}
                    </h3>
                    <p className="text-purple-200 text-xs">{data.categoryData?.nodesInCategory || 0} nodes</p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-purple-300" />
        </div>
    );
}

// C2 Subcategory Node Component
export function C2SubcategoryNode({ data, selected }: CategoryNodeProps) {
    return (
        <div
            className={`bg-gradient-to-br from-indigo-600 to-indigo-800 border-2 border-indigo-400 rounded-lg p-3 shadow-lg hover:shadow-xl hover:from-indigo-500 hover:to-indigo-700 transition-all cursor-pointer min-w-[160px] max-w-[220px] w-[220px] overflow-hidden ${
                selected ? "ring-2 ring-indigo-300" : ""
            }`}
        >
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-300" />
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-300 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <h4
                        className="font-semibold text-white text-sm line-clamp-2"
                        title={data.categoryData?.c2Name || data.label}
                    >
                        {data.categoryData?.c2Name || data.label}
                    </h4>
                    <p className="text-indigo-200 text-xs">{data.categoryData?.nodeCount || 0} nodes</p>
                </div>
            </div>
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-300" />
        </div>
    );
}

// Graph Node Component (for individual code elements)
export function GraphNode({ data, selected }: BaseNodeProps) {
    const getNodeColors = (nodeType: string) => {
        switch (nodeType) {
            case "class":
            case "interface":
                return { from: "#7c3aed", to: "#5b21b6", border: "#a78bfa", handle: "#ddd6fe", text: "#e9d5ff" };
            case "method":
            case "function":
            case "constructor":
                return { from: "#f59e0b", to: "#d97706", border: "#fbbf24", handle: "#fde68a", text: "#fde68a" };
            case "variable":
            case "property":
                return { from: "#ef4444", to: "#dc2626", border: "#f87171", handle: "#fecaca", text: "#fecaca" };
            case "file":
                return { from: "#10b981", to: "#059669", border: "#34d399", handle: "#a7f3d0", text: "#a7f3d0" };
            case "folder":
                return { from: "#0ea5e9", to: "#0284c7", border: "#38bdf8", handle: "#bae6fd", text: "#bae6fd" };
            default:
                return { from: "#6b7280", to: "#4b5563", border: "#9ca3af", handle: "#d1d5db", text: "#d1d5db" };
        }
    };

    const colors = getNodeColors(data.type);

    return (
        <div
            className="border-2 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer min-w-[160px] max-w-[220px] w-[220px] overflow-hidden"
            style={{
                background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`,
                borderColor: colors.border,
            }}
        >
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3"
                style={{ backgroundColor: colors.handle }}
            />
            <div className="flex items-center gap-2">
                <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: colors.handle }}
                />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm line-clamp-2" title={data.label}>
                        {data.label}
                    </h4>
                    <p className="text-xs" style={{ color: colors.text }}>
                        {data.syntaxType || data.type}
                    </p>
                    {data.filePath && (
                        <p className="text-xs truncate" style={{ color: colors.text }} title={data.filePath}>
                            {data.filePath.split("/").pop()}
                        </p>
                    )}
                    {data.isAbstract && (
                        <p className="text-xs font-medium" style={{ color: colors.text }}>
                            Abstract
                        </p>
                    )}
                    {data.isOverride && (
                        <p className="text-xs font-medium" style={{ color: colors.text }}>
                            Override
                        </p>
                    )}
                </div>
            </div>
            <Handle
                type="source"
                position={Position.Bottom}
                className="w-3 h-3"
                style={{ backgroundColor: colors.handle }}
            />
        </div>
    );
}

// Node type definitions for React Flow
export const nodeTypes = {
    c1CategoryNode: C1CategoryNode,
    c2SubcategoryNode: C2SubcategoryNode,
    graphNode: GraphNode,
};