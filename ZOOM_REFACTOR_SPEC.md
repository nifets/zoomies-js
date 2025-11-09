# Zoom/LOD System Refactoring Specification

## Overview

This document specifies a simplified zoom and level-of-detail (LOD) system for Zoomies.js. The goal is to replace the current "zoom window" approach with a more explicit scale-bar metaphor that's easier to reason about and implement.

---

## Core Concept: The Scale Bar

### Mental Model

Imagine a **horizontal scale bar** representing zoom levels. As you zoom out, you move an indicator to the right along this bar. At specific positions on this bar, we have **optimal viewing points** for each layer.

```
Scale Bar (zoom units):
L0-optimal          L1-optimal              L2-optimal
    |-------------------|---------------------|--------->
    0                   3                     5         zoom-out →
```

### Scale Bar Construction

The scale bar is defined by:

1. **Base Position (L0-optimal)**: Reference point at zoom = 0 (most zoomed in)
2. **Layer Spacing**: Distance between optimal points = `log₂(relativeScale)` zoom units
3. **Direction**: As zoom decreases (more negative), scale increases (higher layers)

#### Coordinate Systems

**Zoom Coordinates** (camera zoom level):
- Positive values = zoomed in (close up, detailed view)
- Negative values = zoomed out (far away, abstract view)
- Example: zoom = +2 (very zoomed in), zoom = -3 (very zoomed out)

**Scale Coordinates** (layer abstraction):
- L0 → L1 → L2 (left to right on mental model)
- Higher layer number = higher abstraction = bigger entities
- Visual scale increases from L0 to L2

**Mapping** (zoom → scale):
- High positive zoom → L0 (detailed, zoomed in)
- Low negative zoom → L2 (abstract, zoomed out)

#### Example

Layers:
- **L0**: Base layer (relativeScale = 1, since it's the base)
- **L1**: relativeScale = 3 (entities are 3× bigger than L0)
- **L2**: relativeScale = 2 (entities are 2× bigger than L1)

Scale Bar (zoom coordinates):
```
L0-optimal: zoom = 0 (most zoomed in)
L1-optimal: zoom = -log₂(3) ≈ -1.585 (zoom out to see 3× bigger entities)
L2-optimal: zoom = -1.585 - log₂(2) ≈ -2.585 (zoom out more to see 2× bigger entities)
```

**Key Insight**: The logarithmic spacing ensures visual scale invariance. When you zoom out by `log₂(k)` units (subtract from zoom), objects that are `k×` bigger appear the same size on screen.

---

## Layer Visibility and Detail States

### Boundary Layer Behaviour

**Special Rule**: Boundary layers never fade out when zooming past their optimal:

- **L0 (lowest layer)**: Always visible when zoom ≥ L0-optimal (zooming in past L0)
- **Lmax (highest layer)**: Always visible when zoom ≤ Lmax-optimal (zooming out past Lmax)

This ensures you can always see the most detailed layer when fully zoomed in, and always see the most abstract layer when fully zoomed out.

### For L1 Entities (Example)

The following describes the behaviour of L1 entities as the zoom level changes:

#### Position 1: L0-Optimal (zoom = 0, zoomed in)
- **L1 entities**: Not visible
- **L0 entities**: Fully opaque background, label inside, visible connections
- **L2 entities**: Not visible

#### Position 2: L1-Optimal (zoom ≈ -1.585, zoomed out to L1 scale)
- **L1 entities**:
  - Background: **Transparent** (opacity ≈ 0.15)
  - Border: **Visible**
  - Label: **Outside and above** the node
  - L1-to-L1 connections: **Visible**
  - Children (L0 entities): **Fully visible and opaque**, with labels inside
- **L0 entities**: **All visible** (both children and non-children), fully opaque with labels inside
- **L0 connections**: 
  - Connections within same parent (same L1 entity): **Visible**
  - Connections across different parents: **Hidden** (represented by synthetic L1 edges with branching visualisation)
- **L2 entities**: Not visible

#### Position 3: L2-Optimal (zoom ≈ -2.585, zoomed out to L2 scale)
- **L1 entities**:
  - Background: **Fully opaque** (opacity = 1.0)
  - Border: Visible
  - Label: **Inside** the node
  - L1-to-L1 connections: Visible
  - Children (L0 entities): **Not visible**
- **L0 entities**: Not visible
- **L2 entities**: Transparent background, border visible, label outside/above, visible connections

#### Position 4: Beyond L2-Optimal (zoom < -3.5, very zoomed out)
- **L1 entities**: Not visible
- **L2 entities**: Fully opaque, label inside, visible connections

### Generalised Behaviour for Layer Ln

For any layer Ln, relative to the zoom indicator position:

| Indicator Position | Ln Visibility | Ln Background | Ln Label Position | Ln Connections | Ln-1 Entities Visibility | Ln-1 Connections |
|-------------------|---------------|---------------|-------------------|----------------|--------------------------|------------------|
| At Ln-1 optimal   | Not visible   | N/A           | N/A               | Not visible    | N/A                      | N/A              |
| **At Ln optimal** | **Visible**   | **Transparent** | **Outside/above** | **Visible**    | **All visible & opaque** | **Same-parent only** |
| At Ln+1 optimal   | Visible       | Opaque        | Inside            | Visible        | Not visible              | Not visible      |
| At Ln+2 optimal   | Not visible   | N/A           | N/A               | Not visible    | N/A                      | N/A              |

---

## Transition Interpolation

Between optimal points, properties should interpolate smoothly using easing functions.

### Key Transitions

#### From Ln-Optimal to Ln+1-Optimal

As zoom moves from Ln-optimal towards Ln+1-optimal:

1. **Ln Background Opacity**: `0.15 → 1.0` (transparent to opaque)
2. **Ln Label Position**: Outside/above → Inside (interpolated Y-offset)
3. **Ln Children Opacity**: `1.0 → 0.0` (fade out)
4. **Ln+1 Entities Opacity**: `0.0 → 1.0` (fade in, starting with border)
5. **Ln+1 Background Opacity**: Starts transparent when visible

#### Easing Function

Use **smoothstep** for visual quality:
```typescript
smoothstep(t) = t² × (3 - 2t)  where t ∈ [0, 1]
```

#### Fade Regions

Define fade regions around each optimal point:

- **Fade-In Region**: Starts at `optimal - fadeDistance`
- **Optimal Region**: Fully visible with target detail state
- **Fade-Out Region**: Ends at `optimal + fadeDistance`

Suggested `fadeDistance = log₂(relativeScale) × 0.5` (half the spacing between layers)

---

## Physics and Hitbox Considerations

### Physics Simulation

Only simulate entities that are **partially or fully visible** (opacity > 0.05):

```typescript
visibleForPhysics = entities.filter(e => e.opacity > 0.05)
```

Freeze velocity of invisible entities:
```typescript
if (entity.opacity <= 0.05) {
    entity.vx = 0
    entity.vy = 0
}
```

### Hitbox/Interaction

Entities should only respond to mouse interactions when:
1. `opacity > 0.1` (significantly visible)
2. Cursor is within the entity's shape bounds

---

## Implementation Requirements

### 1. Scale Bar Data Structure

Create an explicit scale bar representation:

```typescript
interface ScaleBar {
    layerPositions: Map<number, number>  // layer → zoom position
    minZoom: number
    maxZoom: number
}
```

Initialise from layer metadata:
```typescript
function buildScaleBar(layers: LayerMetadata[]): ScaleBar {
    const positions = new Map<number, number>()
    let currentZoom = 0  // L0 at zoom = 0 (most zoomed in)
    positions.set(0, currentZoom)
    
    for (let i = 1; i < layers.length; i++) {
        const relativeScale = layers[i].relativeScale ?? 3
        currentZoom -= Math.log2(relativeScale)  // Subtract: zoom out for higher layers
        positions.set(i, currentZoom)
    }
    
    // Add buffer for zooming beyond extremes
    const buffer = 2.0
    return {
        layerPositions: positions,
        minZoom: currentZoom - buffer,  // Most negative (zoomed out)
        maxZoom: buffer                  // Most positive (zoomed in)
    }
}
```

### 2. Detail State Calculator

Replace `getDetailStateAtZoom()` with explicit scale-bar logic:

```typescript
function getDetailState(entity: Entity, zoom: number, scaleBar: ScaleBar): DetailState {
    const layerOptimal = scaleBar.layerPositions.get(entity.layer)!
    const distance = zoom - layerOptimal
    
    // Calculate fade based on distance from optimal
    const fadeDistance = calculateFadeDistance(entity.layer, scaleBar)
    
    // Special handling for boundary layers
    const isMinLayer = entity.layer === 0
    const isMaxLayer = entity.layer === maxLayer
    
    // Boundary layers never fade when zooming past their optimal
    if (isMinLayer && distance > 0) {
        // L0 zooming in: always visible
        return optimalState(entity)
    }
    if (isMaxLayer && distance < 0) {
        // Max layer zooming out: always visible
        return optimalState(entity)
    }
    
    // Not visible if too far from optimal
    if (Math.abs(distance) > fadeDistance * 2) {
        return { visible: false, opacity: 0, ... }
    }
    
    // Interpolate properties based on position relative to optimal
    if (distance < -fadeDistance) {
        // Before optimal (e.g., at L2 zoom when entity is L1)
        return fadeInState(distance, fadeDistance)
    } else if (distance >= -fadeDistance && distance <= fadeDistance) {
        // At optimal
        return optimalState(entity)
    } else {
        // After optimal (e.g., at L0 zoom when entity is L1)
        return fadeOutToOpaqueState(distance, fadeDistance)
    }
}

function optimalState(entity: Entity): DetailState {
    return {
        visible: true,
        opacity: 1.0,
        showBorder: true,
        backgroundOpacity: 0.15,  // transparent
        labelInside: false,       // outside/above
        showChildren: true,       // children fully visible
        collapseState: 0          // fully expanded
    }
}
```

### 3. Simplified Visibility Filter

```typescript
function getVisibleEntities(entities: Entity[], zoom: number, scaleBar: ScaleBar): Entity[] {
    return entities.filter(e => {
        const detail = getDetailState(e, zoom, scaleBar)
        return detail.visible
    })
}
```

### 4. Remove Zoom Window Parameters

Delete these config parameters (no longer needed):
- `zoomWindowSize`
- `fadeStartRatio`
- `zoomBuffer` (replaced by explicit buffer in scale bar)
- Auto-computed window logic

Keep only:
- `layerScaleFactor` (default global scale)
- Per-layer `relativeScale` in metadata

---

## Benefits of This Approach

1. **Simpler Mental Model**: Scale bar with discrete optimal points is easier to visualise than a sliding window
2. **Explicit Positioning**: No automatic calculations; scale bar is built once from metadata
3. **Per-Layer Control**: Each layer transition can have different fade distances and speeds
4. **Predictable Behaviour**: Clear rules for what's visible at each zoom position
5. **Easier Debugging**: Scale bar can be visualised directly (as in your debug widget)

---

## Migration Strategy

1. ✅ Create `ScaleBar` data structure
2. ✅ Implement `buildScaleBar()` from layer metadata
3. ✅ Replace `getDetailStateAtZoom()` with scale-bar-based logic
4. ✅ Update `getVisibleEntities()` to use scale bar
5. ✅ Remove old zoom window parameters and calculations
6. ✅ Update renderer to use new detail states
7. ✅ Test with existing hierarchies (flat, simple, complex networks)
8. ✅ Update documentation (ARCHITECTURE.md)

---

## Open Questions / Design Decisions

1. **Fade Distance Formula**: Should fade distance be proportional to layer spacing, or fixed? 
   - Proposal: `fadeDistance = log₂(relativeScale) × 0.5`

2. **Asymmetric Fading**: Should fade-in and fade-out have different rates?
   - Proposal: Symmetric for simplicity

3. **Layer Skipping**: Can zoom skip directly from L0 to L2 without showing L1?
   - Current: No, all intermediate layers fade through
   - Proposal: Keep current behaviour (smoother)

4. **Border Visibility**: Should border fade independently of background?
   - Proposal: Border visible when `opacity > 0.3`

5. **Connection Fading**: Should connections fade based on their endpoint layers or independently?
   - Proposal: Use average of source/target layer detail states

---

## Connection Visibility Rules

### Current Implementation

Connections are handled with the following logic:

1. **User-defined connections** between entities in different composites are marked as `hidden = true`
2. **Synthetic edges** are automatically generated between composites that have child-to-child connections
3. Synthetic edges store `subEdges` metadata about the actual child-to-child connections
4. During rendering, synthetic edges draw:
   - Main edge between composite borders
   - Branching edges from composite border to each child node involved

### Scale-Bar-Based Connection Visibility

At **Ln-optimal** zoom position:

**Ln Connections (Ln-to-Ln edges)**:
- Direct connections between Ln entities: **Fully visible**
- Synthetic edges between Ln composites: **Visible** (main segment + branching to children)

**Ln-1 Connections (child-level edges)**:
- Connections within same parent: **Visible** (opacity based on child detail state)
- Connections across different parents: **Hidden** (already represented by synthetic Ln edge)
- Direct child-to-child edges that aren't inter-composite: **Visible**

**Implementation Detail**:
When rendering at Ln-optimal:
```typescript
function shouldShowConnection(conn: Connection, currentOptimalLayer: number): boolean {
    const connLayer = Math.max(...conn.sources.map(s => s.layer), ...conn.targets.map(t => t.layer))
    
    // Show connections at or near the optimal layer
    if (connLayer === currentOptimalLayer) {
        return !conn.hidden  // Hide inter-composite edges (synthetic handles them)
    }
    
    // Show child connections only if within same parent
    if (connLayer === currentOptimalLayer - 1) {
        if (conn.hidden) return false  // Already hidden (inter-composite)
        
        // Check if source and target share same parent
        const source = conn.sources[0]
        const target = conn.targets[0]
        return source?.parent === target?.parent && source?.parent !== null
    }
    
    return false  // Too far from optimal
}
```
