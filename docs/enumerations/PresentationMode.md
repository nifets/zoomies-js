[**zoomies-js**](../README.md)

***

Defined in: [managers/LayerDetailManager.ts:20](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L20)

6 presentation modes representing entity visibility state at current zoom level.
Ordered from zoomed-in to zoomed-out (left to right on scale bar).

SEMANTIC MEANINGS:
- INVISIBLE: Entity is far beyond visibility range (scale distance too large)
- FADING_IN: Approaching optimal zoom from left, opacity increases 0→1
- EXPANDED: At/near optimal zoom, shows full detail with thin border & external label
- COLLAPSING: Transitioning past optimal zoom towards next layer (background opacity interpolates 0.2→1.0, label moves inside)
- COLLAPSED: Beyond EXPANDED, summarised view with full background opacity, label inside
- FADING_OUT: Far beyond, opacity decreases 1→0, approaching invisibility

Visual progression as zoom increases (left to right):
  [far] → FADING_IN → EXPANDED (peak detail) → COLLAPSING → COLLAPSED → FADING_OUT → [beyond]

## Enumeration Members

### INVISIBLE

> **INVISIBLE**: `"INVISIBLE"`

Defined in: [managers/LayerDetailManager.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L21)

***

### FADING\_IN

> **FADING\_IN**: `"FADING_IN"`

Defined in: [managers/LayerDetailManager.ts:22](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L22)

***

### EXPANDED

> **EXPANDED**: `"EXPANDED"`

Defined in: [managers/LayerDetailManager.ts:23](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L23)

***

### COLLAPSING

> **COLLAPSING**: `"COLLAPSING"`

Defined in: [managers/LayerDetailManager.ts:24](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L24)

***

### COLLAPSED

> **COLLAPSED**: `"COLLAPSED"`

Defined in: [managers/LayerDetailManager.ts:25](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L25)

***

### FADING\_OUT

> **FADING\_OUT**: `"FADING_OUT"`

Defined in: [managers/LayerDetailManager.ts:26](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L26)
