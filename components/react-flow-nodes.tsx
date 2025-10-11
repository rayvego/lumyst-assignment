import { ReactFlowNode } from "@/core/react-flow.service";
import { useGraphStore } from "@/lib/graphStore";
import { getDescendants, getNodeColors } from "@/lib/utils";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import {
	LucideMinus,
	LucidePlus
} from "lucide-react";



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

// C1 Category Node Component
export function C1CategoryNode({ data, selected }: CategoryNodeProps) {
  return (
    <div
      className={`bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-400 rounded-lg p-3 shadow-lg hover:shadow-xl hover:from-purple-500 hover:to-purple-700 transition-all cursor-pointer min-w-[180px] max-w-[240px] w-[220px] overflow-hidden ${
        selected ? "ring-2 ring-purple-300" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-purple-300"
      />

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-purple-300 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-white text-sm line-clamp-2"
            title={data.categoryData?.c1Category || data.label}
          >
            {data.categoryData?.c1Category || data.label}
          </h3>
          <p className="text-purple-200 text-xs">
            {data.categoryData?.nodesInCategory || 0} nodes
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-purple-300"
      />
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
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-indigo-300"
      />

      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-indigo-300 rounded-full flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold text-white text-sm line-clamp-2"
            title={data.categoryData?.c2Name || data.label}
          >
            {data.categoryData?.c2Name || data.label}
          </h4>
          <p className="text-indigo-200 text-xs">
            {data.categoryData?.nodeCount || 0} nodes
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-indigo-300"
      />
    </div>
  );
}

// Graph Node Component (for individual code elements)
export function GraphNode({ data, selected }: BaseNodeProps) {
  const setNodes = useGraphStore((state) => state.setNodes);
  const setEdges = useGraphStore((state) => state.setEdges);
  const colors = getNodeColors(data.type);
  // Fetch adjacency map on demand to avoid subscribing & rerendering this component
  const getAdjacencyMap = () => useGraphStore.getState().adjacencyMap;

  const onCollapseToggle = () => {
    const descendants = getDescendants(data.id, getAdjacencyMap());
    const nodeId = data.id;

    // Determine new state: if currently collapsed, expand; if expanded, collapse
    const isCurrentlyCollapsed = data.isCollapsed ?? false;
    const newCollapsedState = !isCurrentlyCollapsed;

    // Toggle visibility for descendant nodes
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id === nodeId) {
          // Update the clicked node's collapse state
          return {
            ...n,
            data: {
              ...n.data,
              isCollapsed: newCollapsedState,
            },
          };
        }
        if (descendants.has(n.id)) {
          // Toggle hidden state for descendants
          return {
            ...n,
            hidden: newCollapsedState,
            data: {
              ...n.data,
              isCollapsed: newCollapsedState,
            },
          };
        }
        return n;
      })
    );

    // Toggle visibility for edges connected to descendants
    setEdges((prev) =>
      prev.map((e) => {
        // Hide edges where source OR target is a descendant
        if (descendants.has(e.source) || descendants.has(e.target)) {
          return { ...e, hidden: !e.hidden };
        }
        return e;
      })
    );
  };

  return (
    <div className="border-2 bg-sky-400 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all cursor-pointer min-w-[160px] max-w-[220px] w-[160px] overflow-hidden">
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
          <h4
            className="font-semibold text-white text-sm line-clamp-2 justify-between flex items-center"
            title={data.label}
          >
            {data.label}

            <button className="p-2 cursor-pointer" onClick={onCollapseToggle}>
              {data.isCollapsed ? <LucidePlus /> : <LucideMinus />}
            </button>
          </h4>
          <p className="text-xs" style={{ color: colors.text }}>
            {data.syntaxType || data.type}
          </p>
          {data.filePath && (
            <p
              className="text-xs truncate"
              style={{ color: colors.text }}
              title={data.filePath}
            >
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


export function StubNode({ data, selected }: BaseNodeProps) {
  // Get colors based on node type - matching formatService.ts

  const { getNode, setCenter } = useReactFlow();

  const colors = getNodeColors(data.type);

  return (
    <div
      className="border-2 rounded-lg p-3 shadow-lg hover:shadow-xl bg-amber-200 transition-all cursor-pointer min-w-[160px] max-w-[220px] w-[160px] overflow-hidden"
      onClick={() => {
        console.log("Stub node clicked", data.id);
        const parentNode = getNode(data.id.split("-stub-")[0]);
        if (parentNode) {
          setCenter(parentNode.position?.x || 0, parentNode.position?.y || 0, {
            zoom: 1,
            duration: 800,
          });
        }
      }}
      style={
        {
          // background: `linear-gradient(to bottom right, ${colors.from}, ${colors.to})`,
          // borderColor: colors.border,
        }
      }
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3"
        style={{ backgroundColor: colors.handle }}
      />

      <div className="flex items-center gap-2 text-sm">{data.label}</div>

      {/* <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3"
        style={{ backgroundColor: colors.handle }}
      /> */}
    </div>
  );
}

// Node type definitions for React Flow
export const nodeTypes = {
  c1CategoryNode: C1CategoryNode,
  c2SubcategoryNode: C2SubcategoryNode,
  node: GraphNode,
  stubNode: StubNode,
};
