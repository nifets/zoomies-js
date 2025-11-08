# Zoomies.js Architecture

## Overview

Zoomies.js is a **force-directed graph visualization library** with hierarchical layers, physics-based layout, and zoom-aware LOD rendering.

**Key Concept**: Entities exist in a flat list with optional hierarchy (via `parent` references and `children` arrays). The visualization supports infinite zoom with layer-based detail levels.

---

## Core Principles

1. **Flat API**: Works with `Entity[]` + `Connection[]` lists, not nested trees
2. **Hierarchical Semantics**: Entities can have `parent` and `children` for logical grouping
3. **Synthetic Edges**: Parent-child edges automatically generated and merged from user edges
4. **Layer-Based LOD**: Zoom maps to layers; higher layers shown less detail as you zoom out
5. **Scale-Invariant Physics**: Force magnitudes adapt to node sizes for stable simulation

---

## Entity Architecture

### Entity (`src/core/Entity.ts`)

```text
Entity
  - id: string
  - x, y: number                   // position
  - vx, vy: number                 // velocity (physics)
  - radius: number                 // size
  - layer: number                  // hierarchy level (0 = deepest)
  - parent: Entity | null          // parent composite
  - children: Entity[]             // direct children (if composite)
  - visible: boolean               // rendering visibility
  - collapsed: boolean             // children hidden (UI state)
  - connections: Connection[]      // edges involving this entity
  - internalConnections: Connection[]  // edges between children
  - attributes: Record<string, any>    // user metadata
  - methods:
      - isComposite(): boolean     // has children
      - setPosition(x, y)
      - setOpacity(alpha)
      - collapse()
      - expand()
```

### Connection (`src/core/Connection.ts`)

```text
Connection
  - id: string
  - sources: Entity[]              // source nodes
  - targets: Entity[]              // target nodes
  - subEdges: SubEdge[]            // internal/synthetic edge list
  - hidden: boolean                // inter-composite edges hidden
  - attributes: Record<string, any>
  - synthetic: boolean             // auto-generated edge
  - methods:
      - addSubEdge(type, source, target)
```

---

## Manager System

### 1. GraphManager (`src/managers/GraphManager.ts`)

**Central orchestrator** - handles data, rendering, physics, interactions, zoom.

**Key Methods:**
- `buildGraph(entities, connections)` - Process flat lists, generate synthetic edges, merge edges
- `enablePhysics()` / `disablePhysics()` - Toggle force simulation
- `adjustZoom(delta, focusPoint)` - Zoom with mouse-aware focus
- `update()` - Main render loop
- `start()` / `stop()` - Animation loop control

**Internal Flow:**
```
wheel event → adjustZoom() → setZoom(animated) 
  → zoomManager.animateToTargetZoom()
  → onZoomChange callback → renderer.setCamera() + updateVisibility()
  → updatePhysicsForVisibleLayers()
  → physicsEngine.setVisibleEntities()  // freeze out-of-view entities
  → renderer.clear() + drawComposites() + drawConnections() + drawNodes() + render()
```

### 2. LayerDetailManager (`src/managers/LayerDetailManager.ts`) - **NEW**

**Manages zoom-to-layer mapping and rendering detail levels.**

**Architecture:**
- Logarithmic layer scaling: `zoomPerLayer = log₂(layerScaleFactor)` (auto-computed)
- Flexible zoom window: `zoomWindowSize = log₂(layerScaleFactor) × 3` (auto-computed)
- Smooth interpolation: opacity/detail based on distance from window center

**Key Methods:**
- `getVisibleLayerRange(zoomLevel)` - Returns min/max layer indices in view
- `getVisibleEntities(allEntities, zoomLevel)` - Filter entities for physics/rendering
- `getDetailStateAtZoom(entity, zoomLevel)` - Returns rendering detail state
  ```text
  DetailState {
    visible: boolean                 // within zoom window
    opacity: number (0-1)            // fade towards window edge
    showBorder: boolean              // render border
    backgroundOpacity: number (0.15-1.0)  // composite bg opacity
    labelInside: boolean             // label position
    showChildren: boolean            // render children
    collapseState: number (0-1)      // interpolated collapse
  }
  ```
- `getNodeRadiusAtLayer(relativeRadius, layer)` - Compute node size: `radius = relativeRadius × layerScaleFactor^layer`

**Configuration (only requires one parameter):**
```typescript
new LayerDetailManager({
  layerScaleFactor: 3      // all zoom params auto-computed from this
})
```

**Auto-Computed Parameters:**
- `zoomPerLayer = log₂(layerScaleFactor)` → zoom units per layer (e.g., log₂(3) ≈ 1.585)
- `zoomWindowSize = log₂(layerScaleFactor) × 3` → visible layer span (e.g., ≈ 4.755)
- These adapt dynamically when layerScaleFactor changes

#### Layer Metadata: Per-Layer Customisation

Customise appearance and scaling on a per-layer basis via `LayerMetadata`:

```typescript
interface LayerMetadata {
    entityShape?: string;      // override entity shape for this layer (e.g., 'circle', 'rectangle')
    entityColour?: string;     // override entity colour for this layer
    edgeColour?: string;       // override edge colour for this layer
    relativeScale?: number;    // scale relative to previous layer
}
```

Pass metadata via `LayerDetailConfig`:

```typescript
const layerMetadata = new Map();
layerMetadata.set(0, {
    entityShape: 'circle',
    entityColour: '#3498db',
    edgeColour: '#17a2b8',
    relativeScale: 2              // layer 0 nodes are 2x layer 1 nodes
});
layerMetadata.set(1, {
    entityShape: 'rectangle',
    entityColour: '#2ecc71',
    edgeColour: '#e67e22',
    relativeScale: 2.5            // layer 1 nodes are 2.5x layer 2 nodes
});

const zoomies = new Zoomies('#canvas', entities, connections, {
    layerDetailConfig: {
        layerScaleFactor: 3,
        layerMetadata: layerMetadata
    }
});
```

**Resolution:** Entity attributes → Layer metadata → Defaults. Entity-level attributes always override layer metadata.

#### Per-Layer Scaling

`relativeScale` multiplies cumulatively: `radius(n) = relativeRadius × scale[0] × ... × scale[n]`

#### Shape System

Shape types are extensible strings (not enum). Add new shapes by creating `Shape` subclass and updating `ShapeFactory`. Entity attributes override layer metadata.

### 3. PhysicsEngine (`src/managers/PhysicsEngine.ts`)

**Force-directed layout with layer-based simulation.**

**Forces Applied (in sequence):**

- **Step 1: Repulsion** - Nodes repel each other (inverse-square, scale-invariant)
- **Step 2: Spring Tension** - Connected nodes attract along edges  
- **Step 2b: Synthetic Edge Skip** - Synthetic edges (parent-child) skipped for force (visual only)
- **Step 3: Parent Center Attraction** - Child nodes attracted to parent's center (50% strength)
- **Step 3b: Branching Point Attraction** - Nodes with inter-composite edges attracted to boundary intersection point where edge visually branches (strength: `branchingEdgeAttractionStrength`)
- **Step 4: Layer Center Attraction** - Top-level nodes (no parent) attracted to their layer's center of gravity

**Features:**
- Stratified simulation: entities grouped by layer index (`layers[]`)
- Scale-invariant forces: `force × (avgRadius / 15)` multiplier
- Constraint enforcement: keeps entities within parent composites
- Visibility-based optimization: `setVisibleEntities()` freezes out-of-view nodes

**Key Methods:**
- `init(root)` - Build layer hierarchy
- `simulateLayer(layerIndex)` - Run physics for one layer
- `setVisibleEntities(entities)` - Freeze non-visible entities (velocity = 0)
- `pinNode(entity, x, y)` / `unpinNode(entity)` - Drag constraints

**Configuration:**
- `centerAttractionStrength: 0.01` - Global gravity strength (× 0.5 for parent center)
- `branchingEdgeAttractionStrength: 0.05` - Attraction to branching points

### 4. ZoomManager (`src/managers/ZoomManager.ts`)

**Manages zoom level and animations.**

**Features:**
- Zoom level range: `[-3, 3]` (configurable)
- Smooth animation: ease-in-out-quad, 2ms duration
- Mouse-aware zoom: focuses animation towards cursor position
- Camera adjustment: `offsetX/Y` adjusted to keep focus point under cursor

**Key Methods:**
- `setZoom(level, animate, focusPoint)` - Set target zoom (with optional animation)
- `animateToTargetZoom()` - Internal animation loop
- `onZoomChange` - Callback hook for camera/visibility updates

### 5. Renderer (`src/rendering/Renderer.ts`)

**PixiJS WebGL rendering with zoom-aware LOD.**

**Features:**
- GPU-accelerated via PixiJS v8
- Dynamic detail state: uses `LayerDetailManager.getDetailStateAtZoom()` for zoom-aware rendering
- Synthetic edge visualization: branches from composite borders to actual nodes
- Branching edge opacity: fades with child node detail state (scales by `childOpacity × 0.6`)
- Camera transform: scale + offset

**Key Methods:**
- `drawNode(entity)` - Render single node
- `drawComposite(entity)` - Render composite with children
- `drawConnection(connection)` - Render edge with branching for synthetic edges (opacity-aware)
- `setCamera(scale, offsetX, offsetY)` - Update view transform
- `render()` - Flush PixiJS render

**Integration:**
- Stores reference to `layerDetailManager` passed from GraphManager
- Fetches detail states during edge rendering to determine branching segment opacity

### 6. InteractionManager (`src/managers/InteractionManager.ts`)

**User input handling: drag, select, hover.**

**Features:**
- Node selection (single/multi with Ctrl/Cmd)
- Node dragging with physics pinning
- Canvas panning
- Hover highlight

---

## Data Flow Diagram

```
User Input (wheel, mouse)
        ↓
GraphManager.bindInteractions()
        ↓
adjustZoom(delta, focusPoint) / drag / pan
        ↓
ZoomManager.animateToTargetZoom() [ease-in-out-quad]
        ↓
onZoomChange callback
  ├─→ renderer.setCamera(scale, offsetX, offsetY)
  ├─→ updateVisibility()
  └─→ updatePhysicsForVisibleLayers()
        ↓
LayerDetailManager.getVisibleEntities(zoom)
        ↓
PhysicsEngine.setVisibleEntities(filtered)
        ↓
PhysicsEngine.simulateLayer() [only visible layers]
        ↓
update() render loop
  ├─→ Renderer.drawComposites()
  ├─→ Renderer.drawConnections()
  ├─→ Renderer.drawNodes()
  └─→ Renderer.render()
```

---

## Zoom Window Concept

**How zoom parameters auto-compute and control multi-layer visibility:**

```
Configuration:
  layerScaleFactor = 3         // user specifies only this

Auto-Computed:
  zoomPerLayer = log₂(3) ≈ 1.585          // zoom units per layer
  zoomWindowSize = 1.585 × 3 ≈ 4.755      // layer units visible at once

At Zoom Level 2.3:
  Primary Layer: layerOffset - (2.3 / 1.585) ≈ 2
  Window Radius: 4.755 / 2 ≈ 2.38 layer-units
  
  Visible Layer Range: [ceil(2 - 2.38), floor(2 + 2.38)] = [0, 4]

Entity Opacity Interpolation:
  - Layer 0: distance = |0 - 2| / 2.38 ≈ 0.84, opacity ≈ 0.16
  - Layer 1: distance = |1 - 2| / 2.38 ≈ 0.42, opacity ≈ 0.58
  - Layer 2: distance = |2 - 2| / 2.38 ≈ 0.0,  opacity ≈ 1.0
  - Layer 3: distance = |3 - 2| / 2.38 ≈ 0.42, opacity ≈ 0.58
  - Layer 4: distance = |4 - 2| / 2.38 ≈ 0.84, opacity ≈ 0.16
```

**Key Insight:**
- Zoom parameters use logarithmic scaling (`log₂`) to match camera zoom (which is exponential base 2)
- When `layerScaleFactor` changes, zoom fading automatically adapts
- Relationship ensures each layer traversal requires consistent zoom units

**Benefits:**
- Smooth fading between layers (no hard pop-in/out)
- Customizable view (adjust layerScaleFactor; window size follows automatically)
- Physics only simulates visible entities (performance)
- Rendering adapts detail state per layer (border, bg opacity, children)

---

## File Organization

```
src/
├── core/
│   ├── Entity.ts           # Node with layer hierarchy
│   ├── Connection.ts       # Edge with sub-edges
│   └── Shape.ts            # Shape base (unused in current version)
├── managers/
│   ├── GraphManager.ts     # Main orchestrator
│   ├── LayerDetailManager.ts   # Zoom-to-layer mapping (NEW)
│   ├── PhysicsEngine.ts    # Force simulation
│   ├── InteractionManager.ts   # User input
│   └── ZoomManager.ts      # Zoom level + animation
├── rendering/
│   └── Renderer.ts         # PixiJS rendering
├── index.ts                # Public API export
└── __tests__/              # Jest unit tests
```

---

## Key Design Decisions

1. **Flat List API**: Easier to use than nested trees; supports arbitrary hierarchies
2. **Synthetic Edges**: Auto-generate and merge parent-child connections for clean visualization
3. **Inter-composite Edge Hiding**: Mark edges between different parents as hidden; visualize via synthetic edges with branching
4. **Layer-Based LOD**: Zoom level maps cleanly to abstraction layers; smooth interpolation via opacity
5. **Visible Entity Filtering**: Only simulate/render entities in zoom window (major performance win for large hierarchies)
6. **Scale-Invariant Physics**: Forces scale by `avgRadius / 15` so large/small nodes behave consistently
7. **Ease-in-out-quad Animation**: Responsive zoom feel without aggressive acceleration/jitter

---

## Performance Optimization

- **Physics**: Only simulates visible layers (`PhysicsEngine.setVisibleEntities()`)
- **Rendering**: Only renders entities in zoom window (via detail state opacity)
- **Connections**: Synthetic edges reduce edge count by merging parent-child connections
- **Caching**: `entity.connections` and `entity.internalConnections` cached by `buildGraph()`

---

## Future Enhancements

- Per-layer rendering state (border style, label style, bg color)
- Dynamic node radius scaling based on layer
- Advanced physics filters (e.g., only simulate children of same parent)
- Multi-select drag
- Animated expand/collapse transitions
