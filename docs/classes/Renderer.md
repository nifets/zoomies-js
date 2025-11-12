[**zoomies-js**](../README.md)

***

Defined in: [rendering/Renderer.ts:9](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L9)

## Constructors

### Constructor

> **new Renderer**(`canvas`, `zoomManager`, `layerDetailManager`): `Renderer`

Defined in: [rendering/Renderer.ts:29](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L29)

#### Parameters

##### canvas

`HTMLCanvasElement`

##### zoomManager

[`ZoomManager`](ZoomManager.md) | `null`

##### layerDetailManager

[`LayerDetailManager`](LayerDetailManager.md) | `null`

#### Returns

`Renderer`

## Properties

### canvas

> **canvas**: `HTMLCanvasElement`

Defined in: [rendering/Renderer.ts:10](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L10)

***

### app

> **app**: `Application`

Defined in: [rendering/Renderer.ts:11](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L11)

***

### nodeGraphics

> **nodeGraphics**: `Map`\<[`Entity`](Entity.md), `Graphics`\>

Defined in: [rendering/Renderer.ts:12](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L12)

***

### connectionGraphics

> **connectionGraphics**: `Map`\<[`Connection`](Connection.md), `Graphics`\>

Defined in: [rendering/Renderer.ts:13](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L13)

***

### nodeLabels

> **nodeLabels**: `Map`\<[`Entity`](Entity.md), `Text`\>

Defined in: [rendering/Renderer.ts:14](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L14)

***

### edgeLabels

> **edgeLabels**: `Map`\<[`Connection`](Connection.md), `Text`\>

Defined in: [rendering/Renderer.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L15)

***

### worldContainer

> **worldContainer**: `Container`

Defined in: [rendering/Renderer.ts:16](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L16)

***

### intraLayerConnectionContainer

> **intraLayerConnectionContainer**: `Container`

Defined in: [rendering/Renderer.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L17)

***

### crossLayerConnectionContainer

> **crossLayerConnectionContainer**: `Container`

Defined in: [rendering/Renderer.ts:18](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L18)

***

### nodeContainer

> **nodeContainer**: `Container`

Defined in: [rendering/Renderer.ts:19](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L19)

***

### labelContainer

> **labelContainer**: `Container`

Defined in: [rendering/Renderer.ts:20](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L20)

***

### scale

> **scale**: `number`

Defined in: [rendering/Renderer.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L21)

***

### offsetX

> **offsetX**: `number`

Defined in: [rendering/Renderer.ts:22](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L22)

***

### offsetY

> **offsetY**: `number`

Defined in: [rendering/Renderer.ts:23](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L23)

***

### zoomManager

> **zoomManager**: [`ZoomManager`](ZoomManager.md) \| `null`

Defined in: [rendering/Renderer.ts:24](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L24)

***

### layerDetailManager

> **layerDetailManager**: [`LayerDetailManager`](LayerDetailManager.md) \| `null`

Defined in: [rendering/Renderer.ts:25](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L25)

***

### renderConfig

> **renderConfig**: `Record`\<`string`, `any`\>

Defined in: [rendering/Renderer.ts:26](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L26)

***

### resizeHandler

> `private` **resizeHandler**: () => `void` \| `null`

Defined in: [rendering/Renderer.ts:27](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L27)

## Methods

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [rendering/Renderer.ts:56](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L56)

#### Returns

`Promise`\<`void`\>

***

### updateWorldTransform()

> `private` **updateWorldTransform**(): `void`

Defined in: [rendering/Renderer.ts:91](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L91)

#### Returns

`void`

***

### getTextureResolution()

> `private` **getTextureResolution**(`cumulativeScale`): `number`

Defined in: [rendering/Renderer.ts:100](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L100)

Calculate texture resolution based on cumulative scale.

#### Parameters

##### cumulativeScale

`number`

#### Returns

`number`

***

### updateLabel()

> `private` **updateLabel**(`labelMap`, `key`, `text`, `fontSize`, `resolution`): `Text`

Defined in: [rendering/Renderer.ts:107](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L107)

Create or update a text label, recreating only if resolution changed significantly.

#### Parameters

##### labelMap

`Map`\<`any`, `Text`\>

##### key

`any`

##### text

`string`

##### fontSize

`number`

##### resolution

`number`

#### Returns

`Text`

***

### getEdgeConnectionPoint()

> `private` **getEdgeConnectionPoint**(`fromNode`, `toNode`): `object`

Defined in: [rendering/Renderer.ts:158](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L158)

Get point where edge meets node boundary (for drawing edge endpoints).

#### Parameters

##### fromNode

[`Entity`](Entity.md)

##### toNode

[`Entity`](Entity.md)

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

***

### getConnectionMaxLayer()

> `private` **getConnectionMaxLayer**(`connection`): `number`

Defined in: [rendering/Renderer.ts:166](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L166)

Calculate max layer from connection sources and targets.

#### Parameters

##### connection

[`Connection`](Connection.md)

#### Returns

`number`

***

### isConnectionIntraLayer()

> `private` **isConnectionIntraLayer**(`connection`): `boolean`

Defined in: [rendering/Renderer.ts:181](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L181)

Check if a connection is within a single layer (intra-layer).
Returns true if all sources and targets are in the same layer.

#### Parameters

##### connection

[`Connection`](Connection.md)

#### Returns

`boolean`

***

### drawNode()

> **drawNode**(`node`, `detailState`): `void`

Defined in: [rendering/Renderer.ts:199](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L199)

#### Parameters

##### node

[`Entity`](Entity.md)

##### detailState

[`DetailState`](../interfaces/DetailState.md)

#### Returns

`void`

***

### drawConnection()

> **drawConnection**(`connection`, `detailState`): `void`

Defined in: [rendering/Renderer.ts:259](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L259)

#### Parameters

##### connection

[`Connection`](Connection.md)

##### detailState

[`DetailState`](../interfaces/DetailState.md)

#### Returns

`void`

***

### removeNodeGraphics()

> **removeNodeGraphics**(`node`): `void`

Defined in: [rendering/Renderer.ts:384](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L384)

Remove graphics for a node from the renderer.
Called when node becomes invisible to clean up Pixi containers.

#### Parameters

##### node

[`Entity`](Entity.md)

#### Returns

`void`

***

### removeConnectionGraphics()

> **removeConnectionGraphics**(`connection`): `void`

Defined in: [rendering/Renderer.ts:403](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L403)

Remove graphics for a connection from the renderer.
Called when connection becomes invisible to clean up Pixi containers.

#### Parameters

##### connection

[`Connection`](Connection.md)

#### Returns

`void`

***

### drawConnectionLabel()

> `private` **drawConnectionLabel**(`connection`, `opacity`): `void`

Defined in: [rendering/Renderer.ts:424](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L424)

Draw a label for a connection at its midpoint.

#### Parameters

##### connection

[`Connection`](Connection.md)

##### opacity

`number` = `1`

#### Returns

`void`

***

### setCamera()

> **setCamera**(`scale`, `offsetX`, `offsetY`): `void`

Defined in: [rendering/Renderer.ts:447](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L447)

#### Parameters

##### scale

`number`

##### offsetX

`number`

##### offsetY

`number`

#### Returns

`void`

***

### getDimensions()

> **getDimensions**(): `object`

Defined in: [rendering/Renderer.ts:454](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L454)

#### Returns

`object`

##### width

> **width**: `number`

##### height

> **height**: `number`

***

### destroy()

> **destroy**(): `void`

Defined in: [rendering/Renderer.ts:461](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L461)

#### Returns

`void`

***

### setRenderConfig()

> **setRenderConfig**(`config`): `void`

Defined in: [rendering/Renderer.ts:497](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/rendering/Renderer.ts#L497)

Set render configuration.

#### Parameters

##### config

`Record`\<`string`, `any`\>

#### Returns

`void`
