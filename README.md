# Lumyst SWE Internship Task – Graph Visualization

This repository contains solutions for two distinct graph visualization challenges:

## Task 3: Bidirectional Edge Visualization

**Problem:**  
Default rendering of bidirectional edges (A ↔ B) resulted in overlapping lines and labels, making them unreadable.

**Solution:**  
- Implemented a custom React Flow Edge component: `BidirectionalCurvedEdge`.
- Draws two separated, parallel quadratic Bézier curves for bidirectional edges.
- Positions two distinct labels at the center of each path using basic trigonometry for visibility and non-overlap.

**Key Files & Changes:**
- `components/BidirectionalCurvedEdge.tsx`:  
  New component logic for offset paths and label placement.
- `core/data/data-converter.ts`:  
  Logic to identify reciprocal edge pairs (A→B and B→A) and merge them into a single edge object with `type: 'bidirectional-curved'` and an array of two labels.

---

## Task 4: Graph Arrangement Algorithm

**Problem:**  
The graph layout was dense and tangled, with overlapping nodes and edges, making codebase flow difficult to interpret.

**Solution:**  
- Integrated the DagreJS layout library for hierarchical graph arrangement.
- Enforced a clean, top-to-bottom structure with generous spacing.

**Key Files & Changes:**
- `core/graph-format.service.ts`:  
  Modified `layoutCategoriesWithNodes` to:
  - Initialize Dagre.
  - Map nodes and edges to the Dagre graph model.
  - Execute `dagre.layout()`.
  - Apply calculated `(x, y)` coordinates to React Flow node objects.

**Layout Configuration:**
- `rankdir: 'TB'` (Top-to-Bottom) for hierarchy.
- `ranksep: 150`, `nodesep: 50` for spacing.

**Fixes:**
- Ensured `Position` enum is correctly imported for assigning `targetPosition` and `sourcePosition` based on Dagre orientation.

---

## Summary

- **Task 3:** Bidirectional edges are now clearly separated and labeled.
- **Task 4:** Graph layout is hierarchical, readable, and scalable for large codebases.

