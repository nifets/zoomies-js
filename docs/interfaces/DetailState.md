[**zoomies-js**](../README.md)

***

Defined in: [managers/LayerDetailManager.ts:186](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L186)

DETAIL STATE: Complete visual configuration for rendering an entity at current zoom.

This interface bundles all rendering properties derived from presentation mode and zoom distance.
Computed by `getDetailStateAtZoom()` and consumed by `Renderer.drawNode()`.

OPACITY MECHANICS:
- `opacity`: Node alpha, fades 0→1 during FADING_IN and 1→0 during FADING_OUT
            Always 1.0 during EXPANDED/COLLAPSING/COLLAPSED
- `backgroundOpacity`: Fill transparency, interpolated during COLLAPSING (0.2→1.0)
                      Always 0.2 (EXPANDED) or 1.0 (COLLAPSED) outside COLLAPSING
- Final rendered background opacity: backgroundOpacity × opacity
  Example: EXPANDED (bgOp=0.2) + FADING_IN (opacity=0.5) → 0.1 visible transparency
- `borderOpacity`: Border/outline line alpha, controlled by MODE_CONFIG
                  0 when invisible/fading, 1.0 when visible
- `borderWidth`: Border thickness multiplier (1.0, 2.0, 2.5)
                EXPANDED uses 2.5 for emphasis, others use 2.0

VISIBILITY:
- `visible`: true if layer is in visible range at current zoom
            Renderer skips drawing if false
            Updated by `getVisibleLayers(zoom)`

LABEL POSITIONING:
- `labelInside`: Label placement strategy (inside node vs outside above)
                true: inside (COLLAPSED, COLLAPSING) for space efficiency
                false: outside (EXPANDED, FADING_IN) for clarity

BORDER RENDERING:
- `showBorder`: Whether to render the border line at all
               true: EXPANDED, COLLAPSING, COLLAPSED (visible detail)
               false: INVISIBLE, FADING_IN, FADING_OUT (no emphasis)

DATA FLOW:
  Entity + zoom → determinePresentationMode() → MODE_CONFIG → DetailState
  DetailState → Renderer.drawNode() → [apply opacity, colors, borders]

## Properties

### visible

> **visible**: `boolean`

Defined in: [managers/LayerDetailManager.ts:187](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L187)

***

### opacity

> **opacity**: `number`

Defined in: [managers/LayerDetailManager.ts:188](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L188)

***

### showBorder

> **showBorder**: `boolean`

Defined in: [managers/LayerDetailManager.ts:189](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L189)

***

### borderOpacity

> **borderOpacity**: `number`

Defined in: [managers/LayerDetailManager.ts:190](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L190)

***

### borderWidth

> **borderWidth**: `number`

Defined in: [managers/LayerDetailManager.ts:191](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L191)

***

### backgroundOpacity

> **backgroundOpacity**: `number`

Defined in: [managers/LayerDetailManager.ts:192](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L192)

***

### labelInside

> **labelInside**: `boolean`

Defined in: [managers/LayerDetailManager.ts:193](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L193)
