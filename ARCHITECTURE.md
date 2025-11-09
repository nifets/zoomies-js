# Zoomies.js Architecture

## Overview

Zoomies.js is a **force-directed graph visualization library** with hierarchical layers, physics-based layout, and zoom-aware LOD rendering.

**Key Concept**: Entities exist in a flat list with optional hierarchy (via `parent` references and `children` arrays). The visualization supports infinite zoom with layer-based detail levels.

---

## Core Principles

1. **Flat API**: Works with `Entity[]` + `Connection[]` lists, not nested trees
2. **Hierarchical Semantics**: Entities can have `parent` and `children` for logical grouping
3. **Shape-Entity Separation**: Each entity has a configurable `Shape` (circle, rectangle, custom). Shapes handle their own geometry and rendering.
4. **Layer-Based LOD**: Zoom maps to layers; higher layers shown less detail as you zoom out
5. **Scale-Invariant Physics**: Force magnitudes adapt to node sizes for stable simulation
6. **Unified Rendering**: Renderer is shape-agnostic; each shape implements `draw()` and `drawStroke()` methods

---

## Core Data Types

**Entity** - Node or composite container
- Position (x, y), layer, parent/children hierarchy
- Shape (circle/rectangle/custom) handles geometry and rendering
- Methods: `isComposite()`, `collapse()`, `expand()`, `highlight()`

**Connection** - Unified edge (1-to-1, many-to-many)
- Sources/targets arrays, sub-edges for visualization
- Synthetic edges auto-generated for parent-child relationships

**Shape** - Abstract base for geometry (see `src/shapes/`)
- Built-in: `CircleShape`, `RectangleShape`
- Each shape implements: `draw()`, `getDiameter()`, `containsPoint()`

---

## Manager System

### GraphManager

Central orchestrator. Builds graph from flat lists, manages renderer/physics/zoom/interactions.

**Key flow:** User input → zoom animation → update visibility → filter entities → update physics → render visible entities

### LayerDetailManager

Maps zoom levels to layers. Auto-computes visibility window from `layerScaleFactor`.

**Key methods:**
- `getVisibleEntities()` - Filter entities for physics/rendering
- `getDetailStateAtZoom()` - Returns opacity, border, label position, etc.

**Boundary handling:** At extreme zoom, keeps min/max layer visible to prevent physics freeze.

**Config:** Per-layer metadata for shape, colour, scale overrides.

### PhysicsEngine

Force-directed layout: repulsion, spring tension, parent/layer center attraction.

Scale-invariant forces. Only simulates visible entities (`setVisibleEntities()`).

### Renderer

PixiJS WebGL rendering. Shape-agnostic: calls `entity.shapeObject.draw()` for each node.

Filters to visible entities only (same logic as physics).

### ZoomManager, InteractionManager

Zoom: smooth ease-in-out-quad animation, mouse-aware focus.
Interaction: drag, select, hover, pan.

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
PhysicsEngine.setVisibleEntities(filtered)  // ← Freezes out-of-view
        ↓
GraphManager.update()
  ├─→ Filters nodes by visible entities
  ├─→ Filters connections by visible endpoints
  ├─→ Renderer.drawNode() → shapeObject.draw() / drawStroke()
  ├─→ Renderer.drawConnection()
  └─→ Renderer.render()
```

---



---

## Zoom Window

Logarithmic layer scaling: `zoomPerLayer = log₂(layerScaleFactor)`. Multiple layers visible at once with smooth opacity fading. Boundary layers persist at extreme zoom to keep physics active.

---



---

## Key Design Decisions

1. **Flat List API**: Easier to use than nested trees; supports arbitrary hierarchies
2. **Shape Separation**: Each entity has a configurable `Shape` subclass; shapes handle geometry and rendering completely
3. **Layer-Based LOD**: Zoom level maps cleanly to abstraction layers; smooth interpolation via opacity
4. **Unified Visibility Logic**: Both renderer and physics use `getVisibleEntities()` so they stay in sync
5. **Boundary Layer Persistence**: At extreme zoom, keep min/max layers visible to prevent physics freeze
6. **Scale-Invariant Physics**: Forces scale by `getDiameter() / 2` so all node sizes behave consistently
7. **Universal Sizing**: `getDiameter()` replaces shape-specific `getEffectiveRadius()` / `getCornerRadius()`

---

## Performance Optimization

- **Physics**: Only simulates visible layers (`PhysicsEngine.setVisibleEntities()`)
- **Rendering**: Only renders entities in visible layers (via `getVisibleEntities()`)
- **Hitbox Detection**: Only checks entities in visible layers in `getEntityAtPoint()`
- **Caching**: Entity shape recreated when layer scale changes; not recomputed per frame

---

## Future Enhancements

- Advanced physics filters (e.g., only simulate children of same parent)
- Multi-select drag
- Animated expand/collapse transitions
- Custom shape types via plugin system
