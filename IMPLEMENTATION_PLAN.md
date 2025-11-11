# Implementation Plan: Option A Architecture Refactor

## Objective

Implement clean separation of concerns with explicit presentation modes:
- **ScaleBar**: Window geometry in zoom space
- **LayerDetailManager**: Determine presentation mode and compute all visibility properties
- **Renderer**: Apply computed properties mechanically
- **Result**: Single source of truth (mode), all properties derived from mode, no visibility logic in Renderer

---

## Implementation Order

### Phase 1: ScaleBar Enhancements (Foundation)

**1.1: Add LayerWindowSegments type**
- File: `src/managers/ScaleBar.ts`
- Add interface with 5 segment boundaries (all in zoom coordinates)
- Implement `computeAllLayerWindows()` to compute all segments globally with constraint solving
- Store in `layerWindowSegments: Map<number, LayerWindowSegments>`

**1.2: Add getLayerWindowZoom() method**
- File: `src/managers/ScaleBar.ts`
- Returns zoom-based window directly (no conversion)
- Used by LayerDetailManager and ZoomDebugWidget to avoid bidirectional conversion

**Status**: ScaleBar now provides both zoom and scale APIs, zoom is preferred internally

---

### Phase 2: Presentation Mode System (Logic Layer)

**2.1: Define PresentationMode enum**
- File: `src/managers/LayerDetailManager.ts`
- Enum: INVISIBLE, FADING_IN, EXPANDED, COLLAPSING, FADING_OUT
- Represents where entity is in its layer window

**2.2: Implement determinePresentationMode()**
- File: `src/managers/LayerDetailManager.ts`
- Takes: `zoomLevel`, `LayerWindowSegments`
- Returns: which of 5 presentation modes applies
- Logic: compare cumulative scale against segment boundaries

**2.3: Implement mode-to-property helpers**
- File: `src/managers/LayerDetailManager.ts`
- `getOpacityForMode(mode, zoomLevel, segments)` → [0, 1]
- `getShowBorderForMode(mode)` → boolean
- `getBackgroundOpacityForMode(mode)` → [0, 1]
- `getLabelInsideForMode(mode)` → boolean
- `getShowChildrenForMode(mode)` → boolean
- `getCollapseStateForMode(mode)` → [0, 1]

**Status**: Mode system in place, properties derive from mode

---

### Phase 3: LayerDetailManager Refactor (Centralized Logic)

**3.1: Refactor getDetailStateAtZoom()**
- File: `src/managers/LayerDetailManager.ts`
- New flow:
  1. Get segments: `scaleBar.getLayerWindowSegments(layer)`
  2. Determine mode: `determinePresentationMode(zoomLevel, segments)`
  3. Compute all properties via mode helpers
  4. Return complete DetailState
- Remove old fade-parameter-based logic
- Remove getChildNodeOpacity() calls

**Status**: LayerDetailManager is sole authority on visibility/opacity/mode

---

### Phase 4: Renderer Cleanup (Pure Rendering)

**4.1: Update drawNode()**
- File: `src/rendering/Renderer.ts`
- Accept `detailState: DetailState`
- Apply `detailState.opacity` directly
- Apply `detailState.backgroundOpacity` directly
- Apply `detailState.labelInside` directly
- Apply `detailState.showBorder` directly
- Remove `getChildNodeOpacity()` method entirely
- Remove any fallback logic

**4.2: Update drawConnection()**
- File: `src/rendering/Renderer.ts`
- Accept `detailState: DetailState`
- Apply `detailState.opacity` directly
- No visibility logic

**Status**: Renderer is pure application layer, no decision logic

---

### Phase 5: Debug & Visualization (Quality of Life)

**5.1: Update ZoomDebugWidget**
- File: `src/debug/ZoomDebugWidget.ts`
- Display all 5 segment boundaries per layer (fadingInMin, expandedMin, etc.)
- Use `scaleBar.getLayerWindowZoom()` to avoid conversion
- Color-code regions by presentation mode
- Show current zoom indicator and which mode each layer is in

**Status**: Debug visibility into mode system

---

### Phase 6: Testing (Verification)

**6.1: Add constraint tests**
- File: `src/__tests__/` (new test file)
- Test: For all adjacent layers, `L(n).collapsingMax == L(n+1).fadingInMin`
- Test: For each layer, `optimal == (expandedMin + expandedMax) / 2` in log space
- Test: No gaps or overlaps in segment transitions
- Test: Mode transitions happen at correct zoom levels

**Status**: Constraints mathematically verified

---

## Key Changes by File

### ScaleBar.ts (MAJOR - ~200 lines modified/added)

```diff
+ interface LayerWindowSegments {
+     fadingInMin: number;
+     expandedMin: number;
+     expandedMax: number;
+     collapsingMax: number;
+     fadingOutMax: number;
+ }

+ layerWindowSegments: Map<number, LayerWindowSegments>;

+ computeAllLayerWindows(): Map<number, LayerWindowSegments> {
+     // Global constraint solving
+     // 1. Compute segment widths from layer spacing
+     // 2. Enforce alignment constraints
+     // 3. Centre optimal in EXPANDED segment
+     // 4. Cache result
+ }

+ getLayerWindowSegments(layer: number): LayerWindowSegments {
+     return this.layerWindowSegments.get(layer)!;
+ }

+ getLayerWindowZoom(layer: number): { minZoom: number; maxZoom: number } {
+     const segments = this.getLayerWindowSegments(layer);
+     return {
+         minZoom: segments.fadingInMin,
+         maxZoom: segments.fadingOutMax
+     };
+ }

  getLayerWindow(layer: number): { minScale: number; maxScale: number } {
-     // Old per-layer calculation
+     // Now: convert from pre-computed segments
+     const segments = this.getLayerWindowSegments(layer);
+     return {
+         minScale: Math.pow(2, -segments.fadingInMin),
+         maxScale: Math.pow(2, -segments.fadingOutMax)
+     };
  }
```

### LayerDetailManager.ts (MAJOR - ~150 lines modified/added)

```diff
+ enum PresentationMode {
+     INVISIBLE = 'INVISIBLE',
+     FADING_IN = 'FADING_IN',
+     EXPANDED = 'EXPANDED',
+     COLLAPSING = 'COLLAPSING',
+     FADING_OUT = 'FADING_OUT',
+ }

+ determinePresentationMode(
+     zoomLevel: number,
+     segments: LayerWindowSegments
+ ): PresentationMode {
+     const scale = Math.pow(2, -zoomLevel);
+     // Compare scale against segment boundaries (in zoom space)
+     // Return appropriate mode
+ }

+ getOpacityForMode(mode: PresentationMode, ...): number { ... }
+ getShowBorderForMode(mode: PresentationMode): boolean { ... }
+ getBackgroundOpacityForMode(mode: PresentationMode): number { ... }
+ getLabelInsideForMode(mode: PresentationMode): boolean { ... }
+ getShowChildrenForMode(mode: PresentationMode): boolean { ... }
+ getCollapseStateForMode(mode: PresentationMode): number { ... }

  getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
-     const fadedParam = this.scaleBar.getNormalisedFadeParameter(...);
-     const smoothstep = fadedParam * fadedParam * (3 - 2 * fadedParam);
-     // compute each property separately
+     const segments = this.scaleBar.getLayerWindowSegments(entity.layer);
+     const mode = this.determinePresentationMode(zoomLevel, segments);
+     
+     return {
+         visible: mode !== INVISIBLE,
+         opacity: this.getOpacityForMode(mode, ...),
+         showBorder: this.getShowBorderForMode(mode),
+         backgroundOpacity: this.getBackgroundOpacityForMode(mode),
+         labelInside: this.getLabelInsideForMode(mode),
+         showChildren: this.getShowChildrenForMode(mode),
+         collapseState: this.getCollapseStateForMode(mode)
+     };
  }
```

### Renderer.ts (MODERATE - ~50 lines modified)

```diff
  drawNode(node: Entity, detailState?: DetailState): void {
-     const finalOpacity = detailState ? 
-         detailState.opacity * node.alpha : 
-         node.alpha * this.getChildNodeOpacity(node);  // ← Remove this fallback
+     const finalOpacity = detailState?.opacity ?? 1.0 * node.alpha;
      graphics.alpha = finalOpacity;

-     const bgOpacity = detailState?.backgroundOpacity ?? 1.0;
+     const bgOpacity = detailState!.backgroundOpacity;  // DetailState now required
      node.shapeObject.draw(graphics, node.x, node.y, colour, bgOpacity, screenSize);

-     if (detailState?.showBorder ?? true) {  // ← Remove default
+     if (detailState!.showBorder) {
          node.shapeObject.drawStroke(...);
      }
  }

- private getChildNodeOpacity(node: Entity): number {
-     // ← REMOVE THIS ENTIRE METHOD
- }
```

### ZoomDebugWidget.ts (MINOR - ~30 lines modified)

```diff
  const { minZoom, maxZoom } = 
-     scaleBar.getLayerWindow(layer);  // Was: had to convert back from scale
+     scaleBar.getLayerWindowZoom(layer);  // Now: direct zoom API

+ const segments = scaleBar.getLayerWindowSegments(layer);
+ // Draw region backgrounds for each segment:
+ // fadingInMin → expandedMin: FADING_IN (light red)
+ // expandedMin → expandedMax: EXPANDED (green)
+ // expandedMax → collapsingMax: COLLAPSING (yellow)
+ // collapsingMax → fadingOutMax: FADING_OUT (light red)
```

---

## Responsibility Boundaries After Refactor

| Layer | Input | Output | Logic |
|-------|-------|--------|-------|
| **ScaleBar** | layers, scales | segments, windows | Window geometry, constraint solving |
| **LayerDetailManager** | zoom level, entity | DetailState | Mode determination, property derivation |
| **Renderer** | entity, DetailState | graphics on screen | Apply properties mechanically |

---

## Benefits

✅ **No visibility logic in Renderer** - pure rendering engine

✅ **Single source of truth** - presentation mode determines all properties

✅ **No bidirectional conversion** - zoom internal, scale only at API boundary

✅ **Testable** - mode logic tested independently of rendering

✅ **Extensible** - add new mode or property? Update LayerDetailManager

✅ **Debuggable** - ZoomDebugWidget shows exactly which mode each layer is in

✅ **Maintainable** - clear separation of concerns

---

## Validation Checklist

After implementation:

- [ ] `ScaleBar.getLayerWindowSegments()` returns 5 boundaries per layer
- [ ] `ScaleBar.getLayerWindowZoom()` works and is used by debug widget
- [ ] `LayerDetailManager.getDetailStateAtZoom()` uses mode system
- [ ] `Renderer.drawNode()` never calls `getChildNodeOpacity()`
- [ ] `Renderer.drawNode()` applies `detailState.labelInside` directly
- [ ] All tests pass for constraint verification
- [ ] ZoomDebugWidget displays 5 colored segments per layer
- [ ] No render warnings or fallback logic executing

---

## Rollback Plan

If issues arise at any phase:
1. **Phase 1 issues**: Keep old `getLayerWindow()`, new methods are additive
2. **Phase 2-3 issues**: Keep old fade-parameter logic as fallback, layer in new mode system
3. **Phase 4 issues**: Restore `getChildNodeOpacity()` method with old logic

Each phase is relatively isolated, can implement incrementally.
