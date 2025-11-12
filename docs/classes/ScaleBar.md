[**zoomies-js**](../README.md)

***

Defined in: [managers/ScaleBar.ts:91](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L91)

Explicit scale bar representation for zoom-to-layer mapping.

The scale bar is a horizontal axis where each layer has an optimal viewing position.
Positions are calculated using logarithmic spacing based on relative scales:
  - L0-optimal: zoom = 0 (reference point)
  - L1-optimal: zoom = log₂(relativeScale[0])
  - L2-optimal: zoom = log₂(relativeScale[0]) + log₂(relativeScale[1])
  etc.

This ensures visual scale invariance: zooming out by log₂(k) units shows objects
that are k× bigger at the same on-screen size.

ZOOM DIRECTION REFERENCE (where scale = 2^(-zoom)):
- Higher/more positive zoom = lower scale = zoomed IN (LEFT on scale bar, see less)
- Lower/more negative zoom = higher scale = zoomed OUT (RIGHT on scale bar, see more)
- L0 optimal: zoom=0, scale=1 (mid-position)
- L1 optimal: zoom=-log₂(3)≈-1.585, scale=3 (right of L0, more abstract)
- L2 optimal: zoom≈-3.17, scale≈9 (further right, even more abstract)

LAYER VISIBILITY WINDOWS:
Each layer has a window [minScale, maxScale] where it's visible with fading at edges.
Window extends asymmetrically around optimal zoom:
- minZoom (left/zoomed-in): extends 25% towards previous layer (or maxZoom for L0)
- maxZoom (right/zoomed-out): extends 75% towards next layer (or minZoom for max layer)

Example with 3 layers (L0 at 0, L1 at -1.585, L2 at -3.17):
- L0 window: extends left slightly, right 75% towards L1 at -1.585
- L1 window: extends left 25% towards L0, right 75% towards L2
- L2 window: extends left 25% towards L1, right to minZoom (far right)

Fading:
- L0 never fades (always fully opaque when in window)
- Other layers: fade at window edges (checkpoints at 10% into window from edges)
- Creates smooth crossfading: L0 visible most of L1's window, L1 visible most of L2's window

## Constructors

### Constructor

> **new ScaleBar**(`maxLayer`, `layerMetadata`): `ScaleBar`

Defined in: [managers/ScaleBar.ts:110](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L110)

#### Parameters

##### maxLayer

`number`

##### layerMetadata

`Map`\<`number`, [`LayerMetadata`](../interfaces/LayerMetadata.md)\> | `undefined`

#### Returns

`ScaleBar`

## Properties

### layerPositions

> **layerPositions**: `Map`\<`number`, `number`\>

Defined in: [managers/ScaleBar.ts:93](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L93)

Layer index → optimal zoom position

***

### layerSpacings

> **layerSpacings**: `Map`\<`number`, `number`\>

Defined in: [managers/ScaleBar.ts:96](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L96)

Layer index → spacing to next layer (for fade calculations)

***

### layerWindowSegments

> **layerWindowSegments**: `Map`\<`number`, [`LayerWindowSegments`](../interfaces/LayerWindowSegments.md)\>

Defined in: [managers/ScaleBar.ts:99](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L99)

Layer index → pre-computed window segments (6 boundaries in zoom space)

***

### minZoom

> **minZoom**: `number`

Defined in: [managers/ScaleBar.ts:102](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L102)

Minimum zoom level (fully zoomed out)

***

### maxZoom

> **maxZoom**: `number`

Defined in: [managers/ScaleBar.ts:105](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L105)

Maximum zoom level (fully zoomed in)

***

### fadeDistance

> **fadeDistance**: `number`

Defined in: [managers/ScaleBar.ts:108](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L108)

Fade distance around each optimal point (half the layer spacing)

## Methods

### computeAllLayerWindows()

> `private` **computeAllLayerWindows**(): `void`

Defined in: [managers/ScaleBar.ts:168](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L168)

Compute layer window segments with constraint solving.
Works in SCALE SPACE using geometric progression:
- Uses actual layer spacings from layerSpacings map
- Each layer has a distinct zone size based on spacing to next layer
- CONSTRAINT: L(n).fadingOutMax == L(n+1).collapsedMin (adjacent layers connect)

#### Returns

`void`

***

### getOptimalZoomForLayer()

> **getOptimalZoomForLayer**(`layer`): `number`

Defined in: [managers/ScaleBar.ts:302](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L302)

Get the optimal zoom position for a layer.
Returns 0 if layer doesn't exist on scale bar.

#### Parameters

##### layer

`number`

#### Returns

`number`

***

### getPrimaryLayerAtZoom()

> **getPrimaryLayerAtZoom**(`zoomLevel`): `number`

Defined in: [managers/ScaleBar.ts:309](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L309)

Determine which layer is most prominent (closest to optimal) at given zoom.

#### Parameters

##### zoomLevel

`number`

#### Returns

`number`

***

### getLayerScale()

> `private` **getLayerScale**(`layer`, `layerMetadata`, `defaultScale`): `number`

Defined in: [managers/ScaleBar.ts:327](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ScaleBar.ts#L327)

Helper: get relative scale for a layer from metadata or default.

#### Parameters

##### layer

`number`

##### layerMetadata

`Map`\<`number`, [`LayerMetadata`](../interfaces/LayerMetadata.md)\> | `undefined`

##### defaultScale

`number`

#### Returns

`number`
