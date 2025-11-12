[**zoomies-js**](../README.md)

***

Defined in: [managers/LayerDetailManager.ts:206](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L206)

Manages layer-based detail levels using explicit scale bar positioning.

Concept:
- Each layer has a relative scale and explicit optimal zoom position
- Scale bar is built once from layer metadata (no auto-computation)
- Detail state depends on distance from optimal position (interpolation via smoothstep)
- Visibility, opacity, background, label position, and children rendering all interpolate smoothly
- Only entities within visible layers are simulated/rendered (performance optimization)

## Constructors

### Constructor

> **new LayerDetailManager**(`config`): `LayerDetailManager`

Defined in: [managers/LayerDetailManager.ts:211](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L211)

#### Parameters

##### config

[`LayerDetailConfig`](../interfaces/LayerDetailConfig.md) = `{}`

#### Returns

`LayerDetailManager`

## Properties

### scaleBar

> **scaleBar**: [`ScaleBar`](ScaleBar.md) \| `null`

Defined in: [managers/LayerDetailManager.ts:207](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L207)

***

### layerMetadata

> **layerMetadata**: `Map`\<`number`, [`LayerMetadata`](../interfaces/LayerMetadata.md)\>

Defined in: [managers/LayerDetailManager.ts:208](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L208)

***

### maxLayer

> **maxLayer**: `number`

Defined in: [managers/LayerDetailManager.ts:209](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L209)

## Methods

### buildScaleBar()

> **buildScaleBar**(`minLayer`, `maxLayer`): `void`

Defined in: [managers/LayerDetailManager.ts:222](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L222)

Build and set the scale bar from layer hierarchy.
Must be called after determining all layers in the graph.

#### Parameters

##### minLayer

`number`

##### maxLayer

`number`

#### Returns

`void`

***

### getOptimalZoomForLayer()

> **getOptimalZoomForLayer**(`layer`): `number`

Defined in: [managers/LayerDetailManager.ts:230](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L230)

Get the optimal zoom level for a given layer from the scale bar.

#### Parameters

##### layer

`number`

#### Returns

`number`

***

### getPrimaryLayerAtZoom()

> **getPrimaryLayerAtZoom**(`zoomLevel`): `number`

Defined in: [managers/LayerDetailManager.ts:238](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L238)

Determine the primary (closest) layer at given zoom level.

#### Parameters

##### zoomLevel

`number`

#### Returns

`number`

***

### getVisibleLayers()

> **getVisibleLayers**(`zoomLevel`): `number`[]

Defined in: [managers/LayerDetailManager.ts:246](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L246)

Get all layers that are at least partially visible at the given zoom level.

#### Parameters

##### zoomLevel

`number`

#### Returns

`number`[]

***

### getVisibleEntities()

> **getVisibleEntities**(`allEntities`, `zoomLevel`): [`Entity`](Entity.md)[]

Defined in: [managers/LayerDetailManager.ts:273](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L273)

Filter entities to only those with visible layers at current zoom.
Performance optimization: only simulate/render visible layers.

#### Parameters

##### allEntities

[`Entity`](Entity.md)[]

##### zoomLevel

`number`

#### Returns

[`Entity`](Entity.md)[]

***

### determinePresentationMode()

> **determinePresentationMode**(`zoomLevel`, `segments`): [`PresentationMode`](../enumerations/PresentationMode.md)

Defined in: [managers/LayerDetailManager.ts:289](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L289)

Determine presentation mode based on current zoom and segment boundaries.
Segments are in SCALE coordinates, so we convert current zoom to scale for comparison.
Handles edge cases: NaN (first/last layer boundaries) and Infinity (far edges).

#### Parameters

##### zoomLevel

`number`

##### segments

`any`

#### Returns

[`PresentationMode`](../enumerations/PresentationMode.md)

***

### getOpacityForMode()

> **getOpacityForMode**(`mode`, `zoomLevel`, `segments`): `number`

Defined in: [managers/LayerDetailManager.ts:327](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L327)

Get node opacity (alpha) for a presentation mode.
Only FADING_IN and FADING_OUT interpolate opacity. COLLAPSING/EXPANDED/COLLAPSED stay at 1.0.
INVISIBLE is 0. Segments are in scale coordinates.
Handles NaN boundaries for first/last layers.

#### Parameters

##### mode

[`PresentationMode`](../enumerations/PresentationMode.md)

##### zoomLevel

`number`

##### segments

`any`

#### Returns

`number`

***

### getCollapsingBackgroundOpacity()

> `private` **getCollapsingBackgroundOpacity**(`zoomLevel`, `segments`): `number`

Defined in: [managers/LayerDetailManager.ts:360](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L360)

Get background opacity for COLLAPSING mode (interpolates from expanded to collapsed).

#### Parameters

##### zoomLevel

`number`

##### segments

`any`

#### Returns

`number`

***

### getDetailStateAtZoom()

> **getDetailStateAtZoom**(`entity`, `zoomLevel`): [`DetailState`](../interfaces/DetailState.md)

Defined in: [managers/LayerDetailManager.ts:372](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L372)

Get the detail state for an entity at a given zoom level.
Computes visibility, opacity, rendering style based on presentation mode.

#### Parameters

##### entity

[`Entity`](Entity.md)

##### zoomLevel

`number`

#### Returns

[`DetailState`](../interfaces/DetailState.md)

***

### getNodeRadiusAtLayer()

> **getNodeRadiusAtLayer**(`relativeRadius`, `layer`): `number`

Defined in: [managers/LayerDetailManager.ts:402](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L402)

Calculate the actual radius for a node based on its layer and relative size.
Scales cumulatively: radius = relativeRadius × scale[0] × ... × scale[layer]

#### Parameters

##### relativeRadius

`number`

##### layer

`number`

#### Returns

`number`

***

### getLayerMetadataProperty()

> `private` **getLayerMetadataProperty**\<`K`\>(`layer`, `key`): `NonNullable`\<[`LayerMetadata`](../interfaces/LayerMetadata.md)\[`K`\]\>

Defined in: [managers/LayerDetailManager.ts:413](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L413)

Get a metadata property for a layer with fallback to default.

#### Type Parameters

##### K

`K` *extends* keyof [`LayerMetadata`](../interfaces/LayerMetadata.md)

#### Parameters

##### layer

`number`

##### key

`K`

#### Returns

`NonNullable`\<[`LayerMetadata`](../interfaces/LayerMetadata.md)\[`K`\]\>

***

### getLayerEntityShape()

> **getLayerEntityShape**(`layer`): `string`

Defined in: [managers/LayerDetailManager.ts:424](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L424)

Get entity shape for a layer, falling back to default.

#### Parameters

##### layer

`number`

#### Returns

`string`

***

### getLayerEntityColour()

> **getLayerEntityColour**(`layer`): `string`

Defined in: [managers/LayerDetailManager.ts:431](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L431)

Get entity colour for a layer, falling back to default.

#### Parameters

##### layer

`number`

#### Returns

`string`

***

### getLayerEdgeColour()

> **getLayerEdgeColour**(`layer`): `string`

Defined in: [managers/LayerDetailManager.ts:438](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L438)

Get edge colour for a layer, falling back to default.

#### Parameters

##### layer

`number`

#### Returns

`string`

***

### getLayerScale()

> `private` **getLayerScale**(`layer`): `number`

Defined in: [managers/LayerDetailManager.ts:446](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L446)

Get relative scale factor for a layer.
Uses metadata if available, otherwise defaults to global DEFAULT_LAYER_SCALE_FACTOR.

#### Parameters

##### layer

`number`

#### Returns

`number`

***

### getLayersInHierarchy()

> **getLayersInHierarchy**(`entities`): `number`[]

Defined in: [managers/LayerDetailManager.ts:457](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/LayerDetailManager.ts#L457)

Get all unique layers in the entity hierarchy (recursively).

#### Parameters

##### entities

[`Entity`](Entity.md)[]

#### Returns

`number`[]
