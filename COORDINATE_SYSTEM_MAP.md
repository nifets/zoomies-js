# Coordinate System Usage Map

## Overview

The codebase uses **two coordinate systems** inconsistently:

- **Zoom coordinates**: Camera zoom level (positive = zoomed in/left, negative = zoomed out/right)
- **Scale coordinates**: Cumulative scale factor = 2^(-zoom) (how much we zoom visually)

These are related: `scale = 2^(-zoom)` and `zoom = -log₂(scale)`

---

## Current Usage by Component

### ✅ ZOOM COORDINATES (Internal Layer Calculations)

Used for layer positioning and spacing calculations:

**ScaleBar.ts**:

- `layerPositions: Map<number, number>` - stores optimal zoom for each layer
- `layerSpacings: Map<number, number>` - spacing between adjacent layers in zoom units
- `getOptimalZoomForLayer(layer)` - returns zoom coordinate
- `getDistanceFromOptimal(layer, zoomLevel)` - returns zoom delta
- All layer arithmetic: `nextOptimal - optimalZoom`, `optimalZoom + spacingToNext * 0.75`, etc.
- **Window calculation method**: `getLayerWindow()` calculates bounds in zoom space, converts to scale at return

**ZoomManager.ts**:

- `zoomLevel` - current camera zoom (zoom coordinate)
- All zoom animation/easing calculations

**Entity.ts**:

- Layer positioning uses zoom-based optimal zoom values (indirectly via ScaleBar)

**LayerDetailManager.ts**:

- `getLayerScale(i)` - returns scale factor for layer i (used internally for cumulative scale calculation)
- Takes `zoomLevel` parameter in `getDetailStateAtZoom()` (zoom coordinate)

**ZoomDebugWidget.ts**:

- `zoomLevel` - camera position in zoom space
- Converts zoom to scale for display: `cumulativeScale = Math.pow(2, -zoomLevel)`
- Converts window scales back to zoom for visualization

### ✅ SCALE COORDINATES (Visual/Physics)

Used for visibility determination and rendering:

**ScaleBar.ts - Public API**:

- `getLayerWindow(layer)` returns `{ minScale, maxScale }` (scale coordinates)
- Used in `isLayerVisible()`: compares `currentScale = Math.pow(2, -zoomLevel)` against window
- Used in `getNormalisedFadeParameter()`: works with scale for fade margin calculation

**Renderer.ts**:

- `node.getCumulativeScale()` - visual size scaling factor (scale coordinate)
- `cumulativeScale` used to calculate:
  - Font sizes: `fontSize = CONFIG.LABEL_FONT_SIZE * cumulativeScale`
  - Texture resolution: `resolution = CONFIG.LABEL_TEXTURE_RESOLUTION / cumulativeScale`
  - Offset positions

**LabelRenderer.ts**:

- `entity.getCumulativeScale()` - for font size calculation
- `source.getCumulativeScale()` - for edge label positioning

**Entity.ts**:

- `cumulativeScale` property - stores cumulative layer scale factor
- `setCumulativeScale(scale)` / `getCumulativeScale()` - accessor methods
- Used in `getWorldSize()` and `getWorldArea()` calculations

**Connection.ts**:

- `cumulativeScale` property - cumulative scale factor for edges

**LayerDetailManager.ts**:

- Builds cumulative scale: `cumulativeScale *= this.getLayerScale(i)` for each layer
- Accumulates scale factors to determine entity visual size

### ⚠️ CONVERSION BOUNDARIES

Where systems interface:

**LayerDetailManager.getDetailStateAtZoom()**:

```typescript
// INPUT: zoomLevel (zoom coordinate)
const isVisible = this.scaleBar.isLayerVisible(entity.layer, zoomLevel);
const fadedParam = this.scaleBar.getNormalisedFadeParameter(entity.layer, zoomLevel);
// ScaleBar internally converts to scale: const currentScale = Math.pow(2, -zoomLevel)
```

**ZoomDebugWidget.render()**:

```typescript
// Gets scale-based window from ScaleBar
const { minScale, maxScale } = scaleBar.getLayerWindow(layer);
// Converts back to zoom for visualization
const minZoomForLayer = minScale <= Number.EPSILON ? maxZoom : -Math.log2(minScale);
const maxZoomForLayer = maxScale === Infinity ? minZoom : -Math.log2(maxScale);
```

---

## Current Window Calculation Logic (in zoom space)

**getLayerWindow()** method (lines 181-227):

1. Calculates bounds in **zoom coordinates**
2. Extends from optimal zoom based on adjacent layer spacing
3. Uses arbitrary splits: 25% towards previous, 75% towards next
4. Converts final bounds to scale: `minScale = 2^(-minZoom)`, `maxScale = 2^(-maxZoom)`
5. Returns scale coordinates to caller

**Formula per layer**:

```
optimalZoom = layerPositions[layer]
spacingToPrev = prevOptimal - optimalZoom
spacingToNext = nextOptimal - optimalZoom

minZoom = optimalZoom + spacingToPrev * 0.25  (extend 25% left)
maxZoom = optimalZoom + spacingToNext * 0.75  (extend 75% right)

// Convert to scale for API
minScale = 2^(-minZoom)
maxScale = 2^(-maxZoom)
```

---

## Problems with Current Approach

### 1. **Inconsistent Coordinate Usage**

- Internal layer calculations in zoom space
- Visibility windows exposed as scale coordinates
- Requires constant conversion at boundaries
- ZoomDebugWidget has to convert back to zoom for visualization

### 2. **Per-Layer Window Calculation (Not Global)**

- Each layer calculates its window independently
- Uses arbitrary 25/75 split to adjacent layers
- **Does NOT enforce alignment constraints**:
  - L(n).collapsingZone may NOT equal L(n+1).fadingZone
  - Can have gaps or overlaps between adjacent layers
  - No guarantee hierarchy is maintained

### 3. **Segment Information Missing**

- Window is just min/max bounds (2 numbers)
- No explicit boundaries for presentation modes:
  - Where does FADING_IN end and EXPANDED begin?
  - Where does EXPANDED end and COLLAPSING begin?
  - Where does COLLAPSING end and FADING_OUT begin?
- Can't determine which mode entity is in without more logic

---

## Recommended Consolidation Strategy

### Option A: Keep Zoom Internal, Scale External (RECOMMENDED)

- **Pro**: Simpler to work with, fewer conversions
- **Pro**: Layer arithmetic more natural in log space
- **Con**: Must expose scale in public API for compatibility

**Changes needed**:

1. ScaleBar keeps internal zoom calculations (no change)
2. ScaleBar still exposes scale in `getLayerWindow()` (no change)
3. Add `getLayerWindowZoom(layer)` method returning zoom bounds
4. Use zoom bounds internally in all window calculations
5. ZoomDebugWidget can use zoom method directly

### Option B: Standardize on Scale Throughout

- **Pro**: Consistency, easier to reason about scale factors
- **Con**: Layer arithmetic less intuitive in scale space (multiplication instead of addition)
- **Con**: Would require larger refactor

---

## Critical Data Structures Needed for Constraint-Based Windows

To implement segment-based window design with global constraint solving:

```typescript
// New type to store explicit segment boundaries
type LayerWindowSegments = {
    fadingInMin: number;      // In zoom coordinates
    expandedMin: number;      // Optimal is centered: (expandedMin + expandedMax) / 2
    expandedMax: number;
    collapsingMax: number;    // Constraint: L(n).collapsingMax == L(n+1).fadingInMin
    fadingOutMax: number;     // Can be Infinity for max layer
};

// New method in ScaleBar
computeAllLayerWindows(): Map<number, LayerWindowSegments> {
    // Global constraint solving:
    // 1. Determine segment widths based on layer spacing
    // 2. Enforce: L(n).collapsingMax == L(n+1).fadingInMin
    // 3. Centre optimal in EXPANDED segment
    // 4. Return all segments at once
}

// Replace getLayerWindow() call with:
getLayerWindowSegments(layer: number): LayerWindowSegments {
    // Return pre-computed segments
}
```

---

## File-by-File Summary

| File | Coord System | Usage | Status |
|------|-------------|-------|--------|
| `ScaleBar.ts` | Zoom internal, Scale external | Layer positions, spacing, window bounds | ⚠️ Per-layer, not global |
| `ZoomManager.ts` | Zoom | Camera animation | ✅ Clean |
| `LayerDetailManager.ts` | Zoom input, Scale internal | Visibility checks, visibility state | ✅ Clean |
| `Renderer.ts` | Scale | Font sizes, texture resolution, positioning | ✅ Clean |
| `LabelRenderer.ts` | Scale | Font sizing, offset calculations | ✅ Clean |
| `Entity.ts` | Scale | Visual size storage | ✅ Clean |
| `Connection.ts` | Scale | Visual size storage | ✅ Clean |
| `ZoomDebugWidget.ts` | Both (Zoom→Scale→Zoom) | Visualization, conversions | ⚠️ Bidirectional conversion |

---

## Next Steps for Implementation

1. **Decide on consolidation**: Accept Option A (zoom internal, scale external)
2. **Refactor ScaleBar**:
   - Add `LayerWindowSegments` type
   - Implement `computeAllLayerWindows()` for global constraint solving
   - Store in `layerWindowSegments: Map<number, LayerWindowSegments>`
   - Add `getLayerWindowSegments(layer)` method
   - Keep `getLayerWindow()` for backward compatibility (convert segments to scale)
3. **Update LayerDetailManager**:
   - Use segment boundaries to determine presentation mode
   - Update `getDetailStateAtZoom()` to return mode-specific properties
4. **Update ZoomDebugWidget**:
   - Visualise segment boundaries instead of just min/max
5. **Add tests**:
   - Verify alignment constraints for all adjacent layers
   - Verify optimal centred in EXPANDED segment
