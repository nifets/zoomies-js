[**zoomies-js**](../README.md)

***

Defined in: [managers/ZoomManager.ts:5](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L5)

Manages zoom level and layer-based visibility.
Handles smooth zoom animations with easing.

## Constructors

### Constructor

> **new ZoomManager**(`initialZoom`, `minZoom`, `maxZoom`): `ZoomManager`

Defined in: [managers/ZoomManager.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L17)

#### Parameters

##### initialZoom

`number` = `0`

##### minZoom

`number` = `-3`

##### maxZoom

`number` = `3`

#### Returns

`ZoomManager`

## Properties

### zoomLevel

> **zoomLevel**: `number`

Defined in: [managers/ZoomManager.ts:6](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L6)

***

### minZoom

> **minZoom**: `number`

Defined in: [managers/ZoomManager.ts:7](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L7)

***

### maxZoom

> **maxZoom**: `number`

Defined in: [managers/ZoomManager.ts:8](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L8)

***

### animationDuration

> **animationDuration**: `number`

Defined in: [managers/ZoomManager.ts:9](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L9)

***

### isAnimating

> **isAnimating**: `boolean`

Defined in: [managers/ZoomManager.ts:10](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L10)

***

### onZoomChange

> **onZoomChange**: `Function` \| `null`

Defined in: [managers/ZoomManager.ts:11](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L11)

***

### targetZoom

> **targetZoom**: `number`

Defined in: [managers/ZoomManager.ts:12](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L12)

***

### startZoom

> **startZoom**: `number`

Defined in: [managers/ZoomManager.ts:13](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L13)

***

### prevZoom

> **prevZoom**: `number`

Defined in: [managers/ZoomManager.ts:14](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L14)

***

### focusPoint

> **focusPoint**: \{ `x`: `number`; `y`: `number`; \} \| `null`

Defined in: [managers/ZoomManager.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L15)

## Methods

### setZoom()

> **setZoom**(`level`, `animate`, `focusPoint?`): `void`

Defined in: [managers/ZoomManager.ts:34](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L34)

#### Parameters

##### level

`number`

##### animate

`boolean` = `true`

##### focusPoint?

###### x

`number`

###### y

`number`

#### Returns

`void`

***

### animateToTargetZoom()

> `private` **animateToTargetZoom**(): `void`

Defined in: [managers/ZoomManager.ts:51](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/ZoomManager.ts#L51)

#### Returns

`void`
