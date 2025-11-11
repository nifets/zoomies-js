# Refactoring Checklist - Option A Implementation

---

## Phase 0: Ruthless Cleanup (Before Starting Phases)

**DELETE these methods entirely - they will NOT be replaced:**
- [ ] `ScaleBar.getNormalisedFadeParameter()` - no longer needed
- [ ] `ScaleBar.calculateFadeAtLayer()` - no longer needed
- [ ] `Renderer.getChildNodeOpacity()` - no longer needed
- [ ] Any `LayerDetailManager` methods that calculate fade parameters
- [ ] Any helper methods that interpolate opacity
- [ ] Any fallback or conditional visibility logic in Renderer

**DELETE these fields:**
- [ ] Any fade parameter caches in LayerDetailManager
- [ ] Any deprecated coordinate conversion fields

**Refactoring Motto:** If it doesn't fit the new mode-based design, DELETE IT. No deprecation warnings, no legacy branches.

---

### 1.1 Add LayerWindowSegments Type
- [ ] Define interface with 6 segment boundaries (all zoom coordinates):
  ```typescript
  interface LayerWindowSegments {
      fadingInMin: number;
      expandedMin: number;
      expandedMax: number;
      collapsingMax: number;   // End of COLLAPSING zone
      collapsedMax: number;    // End of COLLAPSED zone
      fadingOutMax: number;
  }
  ```
- [ ] Add `layerWindowSegments: Map<number, LayerWindowSegments>` field to ScaleBar

### 1.2 Implement Global Window Computation
- [ ] Add `computeAllLayerWindows(): Map<number, LayerWindowSegments>` method
  - Compute segment widths based on layer spacing
  - Enforce constraint: `L(n).collapsingMax == L(n+1).fadingInMin` (exact alignment)
  - Centre optimal in EXPANDED segment: `optimal = (expandedMin + expandedMax) / 2` in log space
  - Cache result in `layerWindowSegments`
- [ ] Call `computeAllLayerWindows()` from constructor after building `layerPositions` and `layerSpacings`

### 1.3 Add Zoom-Based Window Access
- [ ] Add `getLayerWindowSegments(layer): LayerWindowSegments` - returns pre-computed segments
- [ ] Add `getLayerWindowZoom(layer): { minZoom, maxZoom }` - direct zoom access
- [ ] **REMOVE** `getLayerWindow(layer)` entirely - only internal methods remain

---

## Phase 2: Presentation Mode System (Logic Foundation)

### 2.1 Define Presentation Mode Enum
- [ ] In LayerDetailManager.ts, add:
  ```typescript
  enum PresentationMode {
      INVISIBLE = 'INVISIBLE',
      FADING_IN = 'FADING_IN',
      EXPANDED = 'EXPANDED',
      COLLAPSING = 'COLLAPSING',
      COLLAPSED = 'COLLAPSED',
      FADING_OUT = 'FADING_OUT',
  }
  ```

**Mode semantics**:
- **EXPANDED**: Full detail, optimal zoom for this layer
- **COLLAPSING**: Transitioning from expanded to collapsed state
- **COLLAPSED**: Less detail, but fully visible (for children shown under expanded parent)
- **FADING_OUT**: Exiting, fading towards invisible
- Layers don't directly control children visibility; segment positioning ensures overlap

### 2.2 Implement Mode Determination
- [ ] Add method: `determinePresentationMode(zoomLevel: number, segments: LayerWindowSegments): PresentationMode`
  - Convert `zoomLevel` to cumulative scale: `scale = Math.pow(2, -zoomLevel)`
  - Compare scale against segment boundaries (in zoom space, left to right as you zoom out):
    - If `scale < 2^(-fadingInMin)`: return INVISIBLE
    - If `scale < 2^(-expandedMin)`: return FADING_IN
    - If `scale < 2^(-expandedMax)`: return EXPANDED
    - If `scale < 2^(-collapsingMax)`: return COLLAPSING
    - If `scale < 2^(-collapsedMax)`: return COLLAPSED
    - If `scale < 2^(-fadingOutMax)`: return FADING_OUT
    - Else: return INVISIBLE

### 2.3 Implement Mode-to-Property Helpers
- [ ] `getOpacityForMode(mode, zoomLevel, segments): number`
  - INVISIBLE: 0
  - FADING_IN: interpolate 0→1
  - EXPANDED: 1.0
  - COLLAPSING: interpolate 1→0
  - COLLAPSED: 1.0 (fully visible, just less detail)
  - FADING_OUT: interpolate 1→0
- [ ] `getShowBorderForMode(mode): boolean` - true for EXPANDED and COLLAPSED only
- [ ] `getBackgroundOpacityForMode(mode): number` - transparent (0.15) for FADING_IN/EXPANDED/COLLAPSED, opaque (1.0) for COLLAPSING/FADING_OUT
- [ ] `getLabelInsideForMode(mode): boolean` - false for FADING_IN/EXPANDED, true for COLLAPSING/COLLAPSED/FADING_OUT
- [ ] `getCollapseStateForMode(mode): number` - 0 for EXPANDED, 0.5 for COLLAPSING, 0.75 for COLLAPSED, 1 for INVISIBLE

---

## Phase 3: LayerDetailManager Refactor (Visibility Authority)

### 3.1 Refactor getDetailStateAtZoom()
- [ ] Replace entire method body:
  ```typescript
  getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
      const segments = this.scaleBar.getLayerWindowSegments(entity.layer);
      const mode = this.determinePresentationMode(zoomLevel, segments);
      
      return {
          visible: mode !== PresentationMode.INVISIBLE,
          opacity: this.getOpacityForMode(mode, zoomLevel, segments),
          showBorder: this.getShowBorderForMode(mode),
          backgroundOpacity: this.getBackgroundOpacityForMode(mode),
          labelInside: this.getLabelInsideForMode(mode),
          showChildren: this.getShowChildrenForMode(mode),
          collapseState: this.getCollapseStateForMode(mode)
      };
  }
  ```
- [ ] **REMOVE** old fade-parameter-based logic entirely
- [ ] **REMOVE** calls to `scaleBar.getNormalisedFadeParameter()`
- [ ] **REMOVE** fade parameter interpolation methods

---

## Phase 4: Renderer Cleanup (Pure Rendering)

### 4.1 Remove Visibility Logic
- [ ] **DELETE** `getChildNodeOpacity()` method entirely
- [ ] **DELETE** any conditional visibility logic
- [ ] **DELETE** any fallback opacity calculations
- [ ] **DELETE** any fade parameter dependencies

### 4.2 Update drawNode()
- [ ] Require `DetailState` (no optional fallback):
  ```typescript
  drawNode(node: Entity, detailState: DetailState): void
  ```
- [ ] Apply properties directly:
  - `graphics.alpha = detailState.opacity * node.alpha`
  - `if (detailState.showBorder) { ... draw stroke ... }`
  - Use `detailState.labelInside` for label positioning
- [ ] **DELETE** any `?? fallback` logic
- [ ] **DELETE** any conditional checks for DetailState existence

### 4.3 Update drawConnection()
- [ ] Use `detailState.opacity` directly
- [ ] **DELETE** any fallback calculations
- [ ] **DELETE** any conditional opacity logic

---

## Phase 5: Debug Visualization (Quality of Life)

### 5.1 Update ZoomDebugWidget
- [ ] Replace `getLayerWindow()` calls with `getLayerWindowZoom()` to avoid bidirectional conversion
- [ ] For each layer, display all 6 segment boundaries:
  - Draw horizontal lines at: fadingInMin, expandedMin, expandedMax, collapsingMax, collapsedMax, fadingOutMax
  - Color-code regions:
    - fadingInMin → expandedMin: light red (FADING_IN)
    - expandedMin → expandedMax: green (EXPANDED)
    - expandedMax → collapsingMax: yellow (COLLAPSING)
    - collapsingMax → collapsedMax: blue (COLLAPSED)
    - collapsedMax → fadingOutMax: light red (FADING_OUT)
- [ ] Show current zoom indicator

---

## Phase 6: Testing & Verification

### 6.1 Add Constraint Tests
- [ ] Test file: `src/__tests__/LayerWindowSegments.test.ts`
- [ ] Test: For all adjacent layers `n` and `n+1`: `L(n).collapsingMax == L(n+1).fadingInMin`
- [ ] Test: For each layer, optimal centred in EXPANDED segment: `optimal ≈ (expandedMin + expandedMax) / 2` in log space
- [ ] Test: No gaps or overlaps between segments for a single layer
- [ ] Test: Mode transitions happen at correct zoom levels

### 6.2 Integration Test
- [ ] Verify: No render errors or warnings
- [ ] Verify: All 5 modes can be observed by zooming
- [ ] Verify: Properties change correctly as mode transitions

---

## Validation Checklist

After all phases complete:

**Cleanup**:
- [ ] ZERO deprecated methods remain
- [ ] ZERO fallback logic in Renderer
- [ ] ZERO conditional visibility checks
- [ ] Old fade parameter methods completely deleted

**Coordinate System**:
- [ ] ScaleBar uses zoom internally for all calculations
- [ ] `getLayerWindowZoom()` is used by debug widget
- [ ] No bidirectional scale↔zoom conversion in hot paths

**Visibility Logic**:
- [ ] `LayerDetailManager.getDetailStateAtZoom()` computes ALL properties
- [ ] `DetailState` is complete package (never needs fallbacks)
- [ ] Renderer has NO visibility logic whatsoever
- [ ] All 6 mode-to-property helpers called in sequence

**Mode System**:
- [ ] 6 presentation modes working correctly
- [ ] `determinePresentationMode()` maps zoom to mode correctly
- [ ] Mode→property helpers deterministic and complete

**Tests**:
- [ ] Alignment constraints verified for all layer pairs
- [ ] Optimal positioning verified for all layers
- [ ] Mode transitions tested at boundaries
