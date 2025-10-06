import type { GraphNode, GraphEdge, C1Output, C2Subcategory } from './types';

/** Project note (cust		labelStyle: {
			fill: '#000',
			fontWeight: '500',
			pointerEvents: 'none',
			transform: `translate(${edge.position?.x || 0}px, ${edge.position?.y || 0}px)`,
			transition: 'transform 150ms ease' // Smooth label movement
		},
		labelBgStyle: {
			fill: '#fff',
			stroke: edge.style?.stroke || '#6b7280',
			strokeWidth: 1,
			rx: 4,
			opacity: 0.9
		},
		labelShowBg: true,ions vs original repo)
 * This mapper adds two practical tweaks for clarity:
 * 1) Node de-duplication by id so the same entity is not rendered twice.
 * 2) Reciprocal edges (A→B and B→A) get small label offsets so both remain
 *    readable on curved edges without changing the default edge type.
 */

export class ReactFlowService {
	convertDataToReactFlowDataTypes(
		graphNodes: GraphNode[],
		c1Nodes: C1Output[],
		c2Nodes: C2Subcategory[],
		edges: GraphEdge[]
	) {
		// De-duplicate nodes by id across all categories (change)
		const nodeById = new Map<string, { id: string; position: { x: number; y: number }; data: { label: string }; type: 'default'; style: Record<string, string> }>();
		const pushUnique = (n: { id: string; position?: { x: number; y: number }; data: { label: string }; type: 'default'; style: Record<string, string> }) => {
			if (!nodeById.has(n.id)) {
				nodeById.set(n.id, { ...n, position: n.position || { x: 0, y: 0 } });
			}
		};

		// Regular graph nodes with importance-aware coloring
		graphNodes.forEach((node) => {
			const importance = node.importanceScore ?? 0;
			const syntax = (node as any).syntaxType as (string | undefined);
			const isFunctionLike = !!syntax && /function|method/i.test(syntax);
			const isImportantFunction = !node.isUtility && isFunctionLike && importance >= 0.6;
			const style = isImportantFunction
				? {
					background: '#ffedd5', // orange-100
					border: '2px solid #f59e0b', // amber-500
					color: '#b45309', // amber-700
					opacity: '1',
					borderRadius: '6px'
				}
				: node.isUtility
				? {
					background: '#f3f4f6',
					border: '1px dashed #9ca3af',
					color: '#6b7280',
					opacity: '0.7',
					borderRadius: '6px'
				}
				: {
					background: '#dbeafe',
					border: '2px solid #3b82f6',
					color: '#1e40af',
					opacity: '1',
					borderRadius: '6px'
				};

			pushUnique({
				id: node.id,
				position: node.position,
				data: { label: node.label },
				type: 'default',
				style,
			});
		});
		// C1 category nodes
		c1Nodes.forEach((node) => pushUnique({
			id: node.id,
			position: node.position,
			data: { label: node.label },
			type: 'default',
			style: {
				background: '#fef2f2',
				border: '3px solid #dc2626',
				color: '#991b1b',
				fontWeight: 'bold',
				borderRadius: '6px'
			},
		}));
		// C2 subcategory nodes
		c2Nodes.forEach((node) => pushUnique({
			id: node.id,
			position: node.position,
			data: { label: node.label },
			type: 'default',
			style: {
				background: '#f0fdf4',
				border: '2px solid #16a34a',
				color: '#166534',
				borderRadius: '6px'
			},
		}));

		const reactFlowNodes = Array.from(nodeById.values());

		// Build lookup for node positions
		const posById = new Map<string, { x: number; y: number }>(
			reactFlowNodes.map(n => [n.id, { x: n.position.x, y: n.position.y }])
		);

		// 1) De-duplicate edges that share the same source, target, and label
		const groupKey = (e: GraphEdge) => `${e.source}|${e.target}|${e.label || ''}`;
		const grouped = new Map<string, { base: GraphEdge; count: number }>();
		edges.forEach((e) => {
			const gk = groupKey(e);
			if (!grouped.has(gk)) grouped.set(gk, { base: e, count: 0 });
			grouped.get(gk)!.count += 1;
		});
		const dedupedEdges: GraphEdge[] = Array.from(grouped.values()).map(({ base, count }) => ({
			...base,
			// If there are multiple identical relationships, collapse into one with a count suffix
			label: count > 1 ? `${base.label} ×${count}` : base.label,
		}));

		// 2) Detect reciprocal edges (A->B and B->A) to separate with animation/hints
		const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
		const pairCounts = new Map<string, number>();
		dedupedEdges.forEach((e) => {
			const key = pairKey(e.source, e.target);
			pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
		});

		// 3) Track used label offsets per midpoint bucket to avoid overlapping labels
		const GRID = 140; // group midpoints into buckets
		const usedOffsetsByBucket = new Map<string, Set<string>>();

		const reactFlowEdges = dedupedEdges.map((edge) => {
	const key = pairKey(edge.source, edge.target);
	const hasReciprocal = (pairCounts.get(key) ?? 0) > 1;

	// Geometry
	const sp = posById.get(edge.source) || { x: 0, y: 0 };
	const tp = posById.get(edge.target) || { x: 0, y: 0 };
	const midX = (sp.x + tp.x) / 2;
	const midY = (sp.y + tp.y) / 2;
	const dx = tp.x - sp.x;
	const dy = tp.y - sp.y;
	const len = Math.hypot(dx, dy) || 1;
	const tx = dx / len;
	const ty = dy / len;
	const nx = -ty;
	const ny = tx;

	// Base perpendicular offset; bump if reciprocal
	let perp = 24 + (hasReciprocal ? 12 : 0);

	// Try to avoid collisions by adjusting along the tangent if an offset was used in this bucket
	const bucketKey = `${Math.round(midX / GRID)}|${Math.round(midY / GRID)}`;
	if (!usedOffsetsByBucket.has(bucketKey)) usedOffsetsByBucket.set(bucketKey, new Set());
	const used = usedOffsetsByBucket.get(bucketKey)!;

	// Spiral along tangent and slightly in perpendicular: 0, +s, -s, +2s, -2s...
	const step = 22;
	let along = 0;
	let attempts = 0;
	let extraPerp = 0;
	let xo = nx * (perp + extraPerp) + tx * along;
	let yo = ny * (perp + extraPerp) + ty * along;
	let sig = `${Math.round(xo)},${Math.round(yo)}`;
	while (used.has(sig) && attempts < 14) {
		attempts++;
		const k = Math.ceil(attempts / 2);
		const sign = attempts % 2 === 0 ? -1 : 1;
		along = sign * k * step;
		// add a slight perpendicular stagger every other attempt
		extraPerp = (k % 2 === 0 ? 6 : 0) * sign;
		xo = nx * (perp + extraPerp) + tx * along;
		yo = ny * (perp + extraPerp) + ty * along;
		sig = `${Math.round(xo)},${Math.round(yo)}`;
	}

	// Avoid overlapping with source/target nodes: push further out if inside node rects
	const NODE_W = 180, NODE_H = 60; // keep in sync with layout
	const pad = 12; // padding around nodes for label clearance
	function intersectsNode(cx: number, cy: number, nodePos: { x: number; y: number }): boolean {
		const left = nodePos.x - NODE_W / 2 - pad;
		const right = nodePos.x + NODE_W / 2 + pad;
		const top = nodePos.y - NODE_H / 2 - pad;
		const bottom = nodePos.y + NODE_H / 2 + pad;
		return cx >= left && cx <= right && cy >= top && cy <= bottom;
	}
	let tries = 0;
	while (tries < 8) {
		const cx = midX + xo;
		const cy = midY + yo;
		const overlapWithSource = intersectsNode(cx, cy, sp);
		const overlapWithTarget = intersectsNode(cx, cy, tp);
		if (!overlapWithSource && !overlapWithTarget) break;
		// push further away perpendicular to the edge; if still overlapping, also move along tangent
		perp += 12;
		if (tries % 2 === 1) along += (tries % 4 === 1 ? step : -step);
		xo = nx * (perp + extraPerp) + tx * along;
		yo = ny * (perp + extraPerp) + ty * along;
		tries++;
	}
	used.add(sig);

	const labelXOffset = xo;
	const labelYOffset = yo;
		const labelBorder =
    edge.label === 'contains'
      ? { stroke: '#9ca3af', strokeWidth: 1 }
      : edge.id.startsWith('c2_relationship')
      ? { stroke: '#059669', strokeWidth: 1.5 }
      : edge.id.startsWith('cross_c1_c2_rel')
      ? { stroke: '#d97706', strokeWidth: 1.5 }
      : { stroke: '#6b7280', strokeWidth: 1 };
	return {
		id: edge.id,
		source: edge.source,
		target: edge.target,
		label: edge.label,
		type: 'bezier', // Use bezier curved edges
		animated: hasReciprocal, // Animate bidirectional edges
		style:
			edge.label === 'contains'
				? { stroke: '#9ca3af', strokeDasharray: '5,5', strokeWidth: 1 }
				: edge.id.startsWith('c2_relationship')
				? { stroke: '#059669', strokeWidth: 2 }
				: edge.id.startsWith('cross_c1_c2_rel')
				? { stroke: '#d97706', strokeWidth: 2 }
				: { stroke: '#374151', strokeWidth: 1 },

		labelStyle: {
			fill: '#000',
			fontWeight: '500',
			pointerEvents: 'none',
			transform: `translate(${labelXOffset}px, ${labelYOffset}px)`,
			transition: 'transform 150ms ease'
		},

		labelShowBg: true,
		labelBgPadding: [6, 4] as [number, number],
		labelBgBorderRadius: 4,
		labelBgStyle: {
			fill: '#ffffff',
			transform: `translate(${labelXOffset}px, ${labelYOffset}px)`,
			...labelBorder
		},
		markerEnd: {
			type: 'arrowclosed',
			width: 15,
			height: 15,
			color: edge.label === 'contains'
				? '#9ca3af'
				: edge.id.startsWith('c2_relationship')
				? '#059669'
				: edge.id.startsWith('cross_c1_c2_rel')
				? '#d97706'
				: '#374151'
		}
	};
});


		return {
			nodes: reactFlowNodes,
			edges: reactFlowEdges,
		};
	}
}