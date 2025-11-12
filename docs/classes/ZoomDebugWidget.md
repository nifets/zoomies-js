[**zoomies-js**](../README.md)

***

Defined in: [debug/ZoomDebugWidget.ts:11](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L11)

## Constructors

### Constructor

> **new ZoomDebugWidget**(`layerDetailManager`): `ZoomDebugWidget`

Defined in: [debug/ZoomDebugWidget.ts:19](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L19)

#### Parameters

##### layerDetailManager

[`LayerDetailManager`](LayerDetailManager.md)

#### Returns

`ZoomDebugWidget`

## Properties

### container

> **container**: `HTMLElement`

Defined in: [debug/ZoomDebugWidget.ts:12](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L12)

***

### scaleCanvas

> **scaleCanvas**: `HTMLCanvasElement`

Defined in: [debug/ZoomDebugWidget.ts:13](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L13)

***

### zoomLabel

> **zoomLabel**: `HTMLElement`

Defined in: [debug/ZoomDebugWidget.ts:14](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L14)

***

### layerLabel

> **layerLabel**: `HTMLElement`

Defined in: [debug/ZoomDebugWidget.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L15)

***

### layerDetailManager

> **layerDetailManager**: [`LayerDetailManager`](LayerDetailManager.md)

Defined in: [debug/ZoomDebugWidget.ts:16](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L16)

***

### loggingDone

> `private` **loggingDone**: `boolean` = `false`

Defined in: [debug/ZoomDebugWidget.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L17)

## Methods

### update()

> **update**(`zoomLevel`, `currentLayer`, `opacity`, `minZoom`, `maxZoom`): `void`

Defined in: [debug/ZoomDebugWidget.ts:70](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L70)

Update widget with current zoom state and layer info.

#### Parameters

##### zoomLevel

`number`

##### currentLayer

`number`

##### opacity

`number`

##### minZoom

`number`

##### maxZoom

`number`

#### Returns

`void`

***

### scaleToZoom()

> `private` **scaleToZoom**(`scale`): `number`

Defined in: [debug/ZoomDebugWidget.ts:125](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L125)

Convert scale coordinate to zoom coordinate.
scale = 2^(-zoom), so zoom = -log2(scale)
Special cases:
  - scale = 0 → zoom = ∞ (zoomed out infinitely)
  - scale = ∞ → zoom = -∞ (zoomed in infinitely)
  - scale ≤ 0 or NaN → clamp to visible zoom range bounds

#### Parameters

##### scale

`number`

#### Returns

`number`

***

### getPresentationModeForLayer()

> `private` **getPresentationModeForLayer**(`layer`, `zoomLevel`, `scaleBar`): [`PresentationMode`](../enumerations/PresentationMode.md)

Defined in: [debug/ZoomDebugWidget.ts:145](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L145)

Get presentation mode for a layer at the current zoom level.

#### Parameters

##### layer

`number`

##### zoomLevel

`number`

##### scaleBar

`any`

#### Returns

[`PresentationMode`](../enumerations/PresentationMode.md)

***

### formatModeName()

> `private` **formatModeName**(`mode`): `string`

Defined in: [debug/ZoomDebugWidget.ts:154](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L154)

Format presentation mode name for display.

#### Parameters

##### mode

[`PresentationMode`](../enumerations/PresentationMode.md)

#### Returns

`string`

***

### drawScale()

> `private` **drawScale**(`zoomLevel`, `minZoom`, `maxZoom`, `currentLayer`, `scaleBar`): `void`

Defined in: [debug/ZoomDebugWidget.ts:162](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L162)

Draw segment windows for each layer.
Each layer gets its own horizontal axis, stacked vertically.

#### Parameters

##### zoomLevel

`number`

##### minZoom

`number`

##### maxZoom

`number`

##### currentLayer

`number`

##### scaleBar

`any`

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [debug/ZoomDebugWidget.ts:312](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/debug/ZoomDebugWidget.ts#L312)

Remove widget from DOM.

#### Returns

`void`
