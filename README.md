# Lumyst Assignment – Bidirectional Edge Visualization

This app visualizes a code/feature graph using React Flow. The task implemented here improves how bidirectional edges are displayed so their curved paths and labels never overlap and remain aligned while nodes move.

## What changed

- **Custom curved edge**: `components/edges/BidirectionalEdge.tsx` renders a cubic-bezier path with control points offset perpendicular to the line. It positions the label slightly outward along the same side so two labels from opposite edges do not clash.
- **Edge registration**: `app/page.tsx` registers the edge type via `edgeTypes={ { bidirectional: BidirectionalEdge } }`.
- **Auto-detection of reverse pairs**: `core/react-flow.service.ts` detects edges that have a reverse counterpart and assigns them `type: 'bidirectional'` with complementary `data.offset` (+1 / -1). Containment edges (`label === 'contains'`) remain dashed and straight-forward as before.

## Constraints satisfied

- **Curved edges**: Edges remain bezier-curved (no alternate styles).
- **Non-overlapping labels**: Bidirectional labels are offset to different sides of the curve.
- **Alignment on move**: Label coordinates are computed from the bezier path so they stay aligned when nodes are dragged or layout changes.

## Run locally

Requirements: Node 18+ and pnpm or npm.

```bash
# install deps
pnpm install

# dev server
pnpm dev

# build
pnpm build
pnpm start
```

If you use npm:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Files to review

- `components/edges/BidirectionalEdge.tsx`
- `core/react-flow.service.ts`
- `app/page.tsx`

