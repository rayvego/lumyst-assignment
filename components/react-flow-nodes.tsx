// src/components/react-flow-nodes.tsx
import { Handle, Position } from "@xyflow/react";
import type { ReactFlowNode } from "../core/types";

interface BaseNodeProps {
    data: ReactFlowNode["data"];
    selected?: boolean;
    style?: React.CSSProperties; // 💡 Add style prop to handle opacity
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

// C1 Category Node Component
export function C1CategoryNode({ data, selected, style }: CategoryNodeProps) { // 💡 Destructure style from props
    return (
        <div
            // 💡 Apply the style prop here to control opacity
            style={style}
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
export function C2SubcategoryNode({ data, selected, style }: CategoryNodeProps) { // 💡 Destructure style from props
    return (
        <div
            // 💡 Apply the style prop here to control opacity
            style={style}
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
export function GraphNode({ data, selected, style }: BaseNodeProps) { // 💡 Destructure style from props
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
            // 💡 Apply the style prop here to control opacity
            style={style}
            className="border-2 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer min-w-[160px] max-w-[220px] w-[220px] overflow-hidden"
            style={{
                ...style, // 💡 Merge the incoming style prop with existing styles
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