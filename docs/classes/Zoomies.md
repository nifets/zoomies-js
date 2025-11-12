[**zoomies-js**](../README.md)

***

Defined in: [index.ts:29](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L29)

## Constructors

### Constructor

> **new Zoomies**(`selector`, `entities`, `connections`, `options`): `Zoomies`

Defined in: [index.ts:32](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L32)

#### Parameters

##### selector

`string`

##### entities

[`Entity`](Entity.md) | [`Entity`](Entity.md)[]

##### connections

[`Connection`](Connection.md)[] = `[]`

##### options

###### enablePhysics?

`boolean`

###### layerDetailConfig?

[`LayerDetailConfig`](../interfaces/LayerDetailConfig.md)

###### renderConfig?

`Record`\<`string`, `any`\>

#### Returns

`Zoomies`

## Properties

### manager

> **manager**: [`GraphManager`](GraphManager.md)

Defined in: [index.ts:30](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L30)

## Methods

### init()

> `private` **init**(`entities`, `connections`, `options`): `Promise`\<`void`\>

Defined in: [index.ts:58](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L58)

#### Parameters

##### entities

[`Entity`](Entity.md)[]

##### connections

[`Connection`](Connection.md)[]

##### options

###### enablePhysics?

`boolean`

###### renderConfig?

`Record`\<`string`, `any`\>

#### Returns

`Promise`\<`void`\>

***

### enablePhysics()

> **enablePhysics**(): `void`

Defined in: [index.ts:89](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L89)

#### Returns

`void`

***

### disablePhysics()

> **disablePhysics**(): `void`

Defined in: [index.ts:93](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L93)

#### Returns

`void`

***

### setZoom()

> **setZoom**(`level`): `void`

Defined in: [index.ts:97](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L97)

#### Parameters

##### level

`number`

#### Returns

`void`

***

### getZoom()

> **getZoom**(): `number`

Defined in: [index.ts:101](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L101)

#### Returns

`number`

***

### on()

> **on**(`event`, `callback`): `void`

Defined in: [index.ts:105](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L105)

#### Parameters

##### event

`string`

##### callback

`Function`

#### Returns

`void`

***

### toggleZoomDebug()

> **toggleZoomDebug**(): `void`

Defined in: [index.ts:109](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L109)

#### Returns

`void`

***

### showZoomDebug()

> **showZoomDebug**(): `void`

Defined in: [index.ts:113](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L113)

#### Returns

`void`

***

### destroy()

> **destroy**(): `void`

Defined in: [index.ts:117](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/index.ts#L117)

#### Returns

`void`
