# Graph Visualization Architecture

## System Overview

The graph visualization system is built on a layered architecture that separates concerns between data processing, layout calculation, and rendering.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (React Components + React Flow)                            │
│  - page.tsx                                                  │
│  - react-flow-nodes.tsx                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  Service Layer                               │
│  (Business Logic)                                            │
│  - GraphFormatService (layout calculation)                   │
│  - ReactFlowService (data transformation)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                    Data Layer                                │
│  (Data Models & Converters)                                  │
│  - types/index.ts                                            │
│  - data-converter.ts                                         │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### 1. Data Layer

#### Type Definitions (`types/index.ts`)

Defines the core data structures:

- `GraphNode` - Individual code elements
- `GraphEdge` - Connections between nodes
- `C1Output` - Top-level categories
- `C2Subcategory` - Second-level subcategories
- `C2Relationship` - Relationships within C1
- `CrossC1C2Relationship` - Cross-category relationships

#### Data Converter (`data-converter.ts`)

- Reads raw data files
- Converts to typed structures
- Prepares data for layout engine

### 2. Service Layer

#### GraphFormatService (`graph-format.service.ts`)

**Purpose**: Calculate optimal node positions and edge routes

**Key Method**: `layoutCategoriesWithNodes()`

**Algorithm Flow**:

```typescript
1. Create Dagre graph instance
2. Configure layout parameters
   ├─ Spacing (nodesep, ranksep, edgesep)
   ├─ Margins (marginx, marginy)
   ├─ Ranking algorithm (longest-path)
   └─ Cycle handling (greedy acyclicer)

3. Add nodes with dimensions
   ├─ C1: 240×100
   ├─ C2: 220×90
   └─ Regular: 220×80

4. Add edges with weights
   ├─ Hierarchical: weight=10, minlen=1
   └─ Cross-reference: weight=1, minlen=2

5. Execute dagre.layout()
6. Extract and return positions
```

**Key Innovation**: Weighted edge system

- High-weight edges get priority for shortest paths
- Low-weight edges route around, avoiding congestion
- Minimum length ensures vertical separation

#### ReactFlowService (`react-flow.service.ts`)

**Purpose**: Transform positioned data into React Flow format

**Key Method**: `convertDataToReactFlowDataTypes()`

**Transformation Process**:

```typescript
Nodes:
  ├─ Add React Flow required fields (id, position, data, type)
  ├─ Apply styling based on node type
  └─ Set dimensions matching layout calculations

Edges:
  ├─ Determine edge type (smoothstep vs bezier)
  ├─ Set colors and styles by relationship type
  ├─ Add arrow markers where appropriate
  ├─ Configure animation for emphasis
  └─ Set path options for routing
```

**Edge Type Decision Tree**:

```
Is 'contains' relationship?
  ├─ Yes: smoothstep, dashed, no arrow
  └─ No: Is C2-C2?
        ├─ Yes: bezier, solid green, arrow
        └─ No: Is Cross-C1-C2?
              ├─ Yes: bezier, animated orange, arrow
              └─ No: smoothstep, gray, arrow
```

### 3. Presentation Layer

#### Main Component (`page.tsx`)

**Purpose**: Render the graph with React Flow

**Component Hierarchy**:

```tsx
<ReactFlow>
  <Background /> // Dot grid for reference
  <Controls /> // Zoom, fit view controls
  <MiniMap /> // Overview navigator
  <Panel /> // Info display // Nodes and edges rendered automatically
</ReactFlow>
```

**State Management**:

- `nodes`: Current node positions and data
- `edges`: Current edge connections and styles
- Callbacks: `onNodesChange`, `onEdgesChange`, `onConnect`

**Configuration Features**:

- Snap to grid (15×15)
- Viewport controls (zoom, pan, fit)
- Connection line styling
- Selection behavior

#### Node Components (`react-flow-nodes.tsx`)

**Purpose**: Render individual nodes with custom styling

**Component Types**:

1. `C1CategoryNode` - Top-level categories
2. `C2SubcategoryNode` - Subcategories
3. `GraphNode` - Individual code elements

**Handle Architecture**:

```
Each node has 7 connection handles:

    ┌─────[top-target]──────┐
    │                        │
[left]                  [right]
[target]    NODE       [target]
[source]              [source]
    │                        │
    └────[bottom-source]─────┘
```

**Benefits**:

- React Flow automatically selects nearest handle
- Reduces edge path length
- Minimizes edge crossings
- Creates more natural routing

## Data Flow

### Initialization Flow

```
1. App Starts
   ↓
2. convertDataToGraphNodesAndEdges()
   - Loads raw data
   - Parses JSON files
   ↓
3. GraphFormatService.layoutCategoriesWithNodes()
   - Calculates positions
   - Returns positioned data
   ↓
4. ReactFlowService.convertDataToReactFlowDataTypes()
   - Transforms to React Flow format
   - Applies styling
   ↓
5. Component Renders
   - React Flow displays graph
   - Interactive features enabled
```

### Interaction Flow

```
User Action
   ↓
Event Handler (onNodesChange, onEdgesChange)
   ↓
Apply Changes (applyNodeChanges, applyEdgeChanges)
   ↓
Update State
   ↓
React Flow Re-renders
```

## Layout Algorithm Deep Dive

### Dagre Layout Process

**Phase 1: Rank Assignment**

```
Assigns each node to a hierarchical level (rank)
- Uses longest-path algorithm
- Ensures proper ordering
- Handles cycles via greedy acyclicer
```

**Phase 2: Node Ordering**

```
Orders nodes within each rank
- Minimizes edge crossings
- Considers edge weights
- Applies node spacing (nodesep)
```

**Phase 3: Position Assignment**

```
Assigns x,y coordinates
- Applies rank separation (ranksep)
- Adds edge separation (edgesep)
- Respects margins
```

**Phase 4: Edge Routing**

```
Calculates edge paths
- Uses edge weights for priority
- Applies minimum lengths
- Routes around nodes
```

### Why This Works

**Spacing Parameters**:

- Large `nodesep` (150px) prevents horizontal crowding
- Large `ranksep` (200px) ensures clear vertical separation
- `edgesep` (80px) provides edge breathing room

**Weight System**:

- Hierarchical edges (weight=10) take direct routes
- Cross-references (weight=1) route around obstacles
- Creates natural flow without forced constraints

**Multiple Handles**:

- React Flow chooses optimal connection points
- Reduces average edge length
- Minimizes path intersections
- Allows edges to "flow around" nodes

## Performance Optimization

### Initial Render

```
Optimization Techniques:
1. Single layout calculation (not continuous)
2. Static initial data (no dynamic loading)
3. Memoized callbacks (prevent re-renders)
4. React Flow's virtual rendering
```

### Runtime Performance

```
React Flow Features:
1. Only renders visible viewport
2. Uses requestAnimationFrame for smooth interactions
3. GPU-accelerated transforms
4. Efficient edge path calculations
```

### Scalability Considerations

```
Current: ~100 nodes (excellent performance)
Scale to 500 nodes: May need optimization
- Consider clustering
- Implement viewport culling
- Add progressive loading
Scale to 1000+ nodes: Requires advanced techniques
- Virtual scrolling
- Level-of-detail rendering
- Server-side layout
```

## Edge Routing Strategy

### Hierarchical Edges (Containment)

```
Goal: Direct parent-child connections
Strategy:
  - High weight = shortest path
  - Smooth step type = orthogonal paths
  - Dashed style = visual de-emphasis
  - No arrows = implied hierarchy
```

### Lateral Edges (Relationships)

```
Goal: Show peer relationships
Strategy:
  - Low weight = flexible routing
  - Bezier curves = smooth, organic feel
  - Solid style = emphasis
  - Arrows = directional flow
```

### Cross-Category Edges

```
Goal: Highlight important connections
Strategy:
  - Low weight = route around hierarchy
  - Bezier curves = avoid grid
  - Animation = draw attention
  - Orange color = distinct from others
  - minlen=2 = skip at least one rank
```

## Extension Points

### Adding New Node Types

```typescript
1. Define type in types/index.ts
2. Add size in GraphFormatService
3. Add styling in ReactFlowService
4. Create component in react-flow-nodes.tsx
5. Register in nodeTypes export
```

### Adding New Edge Types

```typescript
1. Determine relationship semantics
2. Add classification in ReactFlowService
3. Choose edge type (smoothstep/bezier/straight)
4. Define visual style (color, width, markers)
5. Set weight and minlen appropriately
```

### Custom Layout Algorithms

```typescript
1. Create new service extending GraphFormatService
2. Implement custom layout logic
3. Return nodes with position property
4. Maintain compatibility with ReactFlowService
5. Swap in page.tsx
```

## Design Patterns

### Service Pattern

- Encapsulates complex logic
- Provides clean interfaces
- Separates concerns
- Enables testing

### Transformer Pattern

- Converts between data formats
- Maintains data integrity
- Adds metadata
- Prepares for rendering

### Composition Pattern

- React Flow provides base functionality
- Custom components add features
- Services compose layout + styling
- Results in flexible, maintainable system

## Testing Considerations

### Unit Tests

```typescript
// GraphFormatService
- Test node positioning
- Verify edge weights
- Check spacing parameters

// ReactFlowService
- Test data transformation
- Verify edge type selection
- Check style application
```

### Integration Tests

```typescript
// Full pipeline
- Data load → Layout → Transform → Render
- Verify end-to-end flow
- Check React Flow integration
```

### Visual Regression Tests

```typescript
// Screenshot comparison
- Capture graph rendering
- Compare against baseline
- Detect layout changes
```

## Dependencies

### Core Libraries

- **dagre** (`^0.8.5`): Layout algorithm
- **@xyflow/react** (`^12.8.6`): React Flow visualization
- **Next.js** (`15.5.4`): React framework
- **TypeScript** (`^5`): Type safety

### Why These Libraries?

**Dagre**:

- Industry-standard hierarchical layout
- Highly configurable
- Efficient algorithm
- Mature and stable

**React Flow**:

- Excellent React integration
- Built-in interactions
- Extensible architecture
- Great performance
- Active development

**Next.js**:

- Modern React framework
- Great DX
- Easy deployment
- Built-in optimization

## Conclusion

This architecture balances **simplicity** and **power**:

- Clear separation of concerns
- Extensible design
- Performance optimized
- Maintainable codebase

The weighted edge system combined with multiple handles is the key innovation that eliminates edge intersections while maintaining intuitive layouts.
