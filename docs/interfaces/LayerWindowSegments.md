[**zoomies-js**](../README.md)

***

Defined in: [managers/ScaleBar.ts:46](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L46)

LAYER WINDOW SEGMENTS: Presentation mode boundaries for a single layer in SCALE COORDINATES.

COORDINATE SYSTEM:
- scale = 2^(-zoom), monotonically increasing as zoom becomes more negative
- scale = 0.5 → zoom = 1 (zoomed in)
- scale = 1.0 → zoom = 0 (reference)
- scale = 2.0 → zoom = -1 (zoomed out)
- scale = ∞ → zoom = -∞ (far zoomed out)

ORDERING (left to right visually, low scale → high scale):
  [0] fadingInMin [0] expandedMin [0] expandedMax [0] collapsedMin [0] collapsedMax [0] fadingOutMax
   ← zoomed in (higher zoom, more detail)    zoomed out (lower zoom, less detail) →

6 REGIONS (ordered by scale):
  1. INVISIBLE        [0, fadingInMin)           - Too zoomed in, entity not visible
  2. FADING_IN        [fadingInMin, expandedMin) - Approaching optimal, alpha increases 0→1
  3. EXPANDED         [expandedMin, expandedMax) - At optimal zoom, peak detail visible
  4. COLLAPSING       [expandedMax, collapsedMin)- Transitioning to summary, details fade
  5. COLLAPSED        [collapsedMin, collapsedMax)- Summary view, opaque background
  6. FADING_OUT       [collapsedMax, fadingOutMax)- Zooming out beyond, alpha decreases 1→0
  7. INVISIBLE (right) [fadingOutMax, ∞)        - Too zoomed out, entity invisible

SPECIAL CASES (EDGE LAYERS):
- Layer 0 (first/most detailed):  fadingInMin = NaN (no region to the left, can't zoom in further)
                                  collapsedMin/Max = next layer's expandedMin/Max
- Layer N (last/most abstract):   fadingOutMax = NaN (no region to the right, can't zoom out further)
                                  collapsedMin/Max = previous layer's expandedMin/Max (extended)

NaN SEMANTICS:
- NaN fadingInMin for L0: "No FADING_IN region, EXPANDED starts immediately"
  → Handled downstream: determinePresentationMode() treats NaN as "skip region"
- NaN fadingOutMax for LN: "No FADING_OUT region, FADING_OUT extends to infinity"
  → Handled downstream: getVisibleLayers() treats NaN as ±∞ boundary

CONSTRUCTION:
- Built by ScaleBar.computeAllLayerWindows() in 4 passes:
  1. expandedMin/Max: Around optimal zoom (±25% log-spacing)
  2. collapsedMin/Max: Next layer's expanded or extended for last layer
  3. fadingInMin: Previous layer's expandedMax or NaN for first layer
  4. fadingOutMax: Next layer's collapsedMin or NaN for last layer

## Properties

### fadingInMin

> **fadingInMin**: `number`

Defined in: [managers/ScaleBar.ts:47](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L47)

***

### expandedMin

> **expandedMin**: `number`

Defined in: [managers/ScaleBar.ts:48](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L48)

***

### expandedMax

> **expandedMax**: `number`

Defined in: [managers/ScaleBar.ts:49](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L49)

***

### collapsedMin

> **collapsedMin**: `number`

Defined in: [managers/ScaleBar.ts:50](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L50)

***

### collapsedMax

> **collapsedMax**: `number`

Defined in: [managers/ScaleBar.ts:51](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L51)

***

### fadingOutMax

> **fadingOutMax**: `number`

Defined in: [managers/ScaleBar.ts:52](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L52)
