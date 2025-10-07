## Level 2, Task 3: Graph Visualization for Bidirectional Edges

## Problem
Bidirectional edges (reciprocal relationships A ↔ B) in the graph had overlapping curved paths and labels, making the visualization unreadable and confusing.

**Issues:**
- Both edge paths rendered on top of each other
- Labels overlapped in the middle
- Impossible to distinguish between forward and backward relationships
- Poor user experience when analyzing graph connections

## The Solution

We fixed this with two main parts:

1. **Find bidirectional connections early** - Check the data first and combine paired connections
2. **Draw them separately** - Create two parallel curved lines with labels in different spots

## How It Works

### 1. Custom Edge Component (`BidirectionalCurvedEdge.tsx`)

We created a new component that draws connections differently:

- Calculates how to offset the two lines so they don't overlap
- Draws two parallel curved lines using Bézier curves
- One line curves upward (+20 pixels)
- One line curves downward (-20 pixels)  
- Places labels at different positions (35% and 65% along the line) so they don't overlap
- Uses efficient rendering for better performance

**The math behind it:**

```typescript
// Calculate perpendicular offset
const dx = targetX - sourceX;
const dy = targetY - sourceY;
const length = Math.sqrt(dx * dx + dy * dy);
const perpX = (-dy / length) * offset;
const perpY = (dx / length) * offset;

// Create offset curved paths
forwardPath: M sourceX,sourceY Q midX+perpX,midY+perpY targetX,targetY
backwardPath: M targetX,targetY Q midX-perpX,midY-perpY sourceX,sourceY
```

### 2. Edge Preprocessing (`ReactFlowService.ts`)

We modified how the data is prepared before drawing:

- Looks for connections that go both ways (A→B and B→A)
- Combines these pairs into one bidirectional connection
- Marks them with a special type 'bidirectional-curved'
- Stores both labels separately
- Prevents processing the same pair twice
- Handles special cases (like nodes connected to themselves)

### 3. Integration (`App.tsx`)

We connected everything together:

- Registered the new custom edge type in React Flow
- Added the bidirectional edge component
- Everything else works the same as before

## Requirements Met ✅

- ✅ Edges stay curved (no straight lines)
- ✅ Both labels are always visible
- ✅ Labels don't overlap each other
- ✅ Labels stay in the right place when you drag nodes around

## Files Changed

- **Added:** `src/components/BidirectionalCurvedEdge.tsx` - The new edge drawing component
- **Modified:** `src/core/react-flow.service.ts` - Logic to find and combine bidirectional edges
- **Modified:** `src/app/page.tsx` - Registration of the new edge type

## Testing Completed

- ✅ Bidirectional edges show as separate parallel lines
- ✅ Both labels are clear and easy to read
- ✅ Dragging nodes works correctly - labels move properly
- ✅ Multiple bidirectional connections work at the same time
- ✅ Works correctly at different zoom levels
- ✅ Regular one-way connections still work normally
- ✅ Edge styling (colors, dashed lines) still works

## Before & After

**Before:**
- Lines drew on top of each other
- Labels were unreadable
- Graph was confusing

**After:**
- Clean parallel curved lines
- Both labels clearly visible
- Easy to understand relationships
- Professional-looking graph

## Screenshots
**Before :**
<img width="974" height="519" alt="Screenshot from 2025-10-07 10-10-27" src="https://github.com/user-attachments/assets/25a1d639-12e0-498c-8644-abb283051cab" />

**After :**
<img width="715" height="439" alt="Screenshot from 2025-10-07 10-04-59" src="https://github.com/user-attachments/assets/72618f3d-2b04-4fc0-a684-32977f8d1f93" />



## Technical Notes

**Why this approach:** We process the data before drawing rather than checking during drawing. This is faster and easier to maintain.

**Trade-offs:** The 20-pixel spacing works well for most graphs but might need adjustment if you have many nodes very close together. You can easily change the offset value if needed.
