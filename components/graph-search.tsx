"use client";

import { useMemo, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { useGraphStore } from "@/lib/graphStore";

/**
 * GraphSearch: lightweight search bar to center the viewport on a node.
 * - Search by node label or id
 * - Arrow-key navigate suggestions, Enter to center
 */
export default function GraphSearch() {
  const { setCenter, getNode } = useReactFlow();
  const nodes = useGraphStore((s) => s.nodes);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as { id: string; label: string }[];
    return nodes
      .map((n) => ({ id: n.id, label: String(n.data?.label ?? n.id) }))
      .filter(
        (n) =>
          n.id.toLowerCase().includes(q) || n.label.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [nodes, query]);

  const centerOnNode = (nodeId: string) => {
    // Prefer React Flow's internal node for most accurate position
    const rfNode = getNode(nodeId);
    const pos =
      rfNode?.position ?? nodes.find((n) => n.id === nodeId)?.position;
    if (pos) {
      setCenter(pos.x, pos.y, { zoom: 1.2, duration: 400 });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      centerOnNode(suggestions[activeIndex]?.id ?? suggestions[0].id);
    } else if (query.trim()) {
      const byId = nodes.find((n) => n.id === query.trim());
      if (byId) centerOnNode(byId.id);
    }
  };

  return (
    <div className="relative w-[40rem]">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIndex((i) =>
                Math.min(i + 1, Math.max(0, suggestions.length - 1))
              );
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIndex((i) => Math.max(0, i - 1));
            }
          }}
          placeholder="Search node by label or id..."
          className="w-full rounded-md border border-gray-300 bg-white/90 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
        />
      </form>

      {query && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 rounded-md border border-gray-200 bg-white shadow">
          {suggestions.map((s, idx) => (
            <li
              key={s.id}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 ${
                idx === activeIndex ? "bg-gray-100" : ""
              }`}
              onMouseEnter={() => setActiveIndex(idx)}
              onClick={() => centerOnNode(s.id)}
              title={s.id}
            >
              <span className="font-medium">{s.label}</span>
              {s.label !== s.id && (
                <span className="ml-2 text-gray-500">({s.id})</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
