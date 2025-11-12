[**zoomies-js**](../README.md)

***

Defined in: [managers/InteractionManager.ts:8](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L8)

Manages user interactions with the graph.
Handles selection, hover, and drag events.

## Constructors

### Constructor

> **new InteractionManager**(): `InteractionManager`

Defined in: [managers/InteractionManager.ts:14](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L14)

#### Returns

`InteractionManager`

## Properties

### selectedNodes

> **selectedNodes**: [`Entity`](Entity.md)[]

Defined in: [managers/InteractionManager.ts:9](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L9)

***

### hoveredNode

> **hoveredNode**: [`Entity`](Entity.md) \| `null`

Defined in: [managers/InteractionManager.ts:10](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L10)

***

### hoveredConnection

> **hoveredConnection**: [`Connection`](Connection.md) \| `null`

Defined in: [managers/InteractionManager.ts:11](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L11)

***

### eventCallbacks

> **eventCallbacks**: `Map`\<`string`, `Function`[]\>

Defined in: [managers/InteractionManager.ts:12](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L12)

## Methods

### selectNode()

> **selectNode**(`node`, `multi`): `void`

Defined in: [managers/InteractionManager.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L21)

#### Parameters

##### node

[`Entity`](Entity.md)

##### multi

`boolean` = `false`

#### Returns

`void`

***

### deselectNode()

> **deselectNode**(`node`): `void`

Defined in: [managers/InteractionManager.ts:33](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L33)

#### Parameters

##### node

[`Entity`](Entity.md)

#### Returns

`void`

***

### clearSelection()

> **clearSelection**(): `void`

Defined in: [managers/InteractionManager.ts:39](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L39)

#### Returns

`void`

***

### hoverNode()

> **hoverNode**(`node`): `void`

Defined in: [managers/InteractionManager.ts:44](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L44)

#### Parameters

##### node

[`Entity`](Entity.md) | `null`

#### Returns

`void`

***

### hoverConnection()

> **hoverConnection**(`connection`): `void`

Defined in: [managers/InteractionManager.ts:55](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L55)

#### Parameters

##### connection

[`Connection`](Connection.md) | `null`

#### Returns

`void`

***

### on()

> **on**(`event`, `callback`): `void`

Defined in: [managers/InteractionManager.ts:66](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L66)

#### Parameters

##### event

`string`

##### callback

`Function`

#### Returns

`void`

***

### off()

> **off**(`event`, `callback`): `void`

Defined in: [managers/InteractionManager.ts:73](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L73)

#### Parameters

##### event

`string`

##### callback

`Function`

#### Returns

`void`

***

### emit()

> **emit**(`event`, ...`args`): `void`

Defined in: [managers/InteractionManager.ts:83](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/InteractionManager.ts#L83)

#### Parameters

##### event

`string`

##### args

...`any`[]

#### Returns

`void`
