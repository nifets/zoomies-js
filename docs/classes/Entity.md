[**zoomies-js**](../README.md)

***

Defined in: [core/Entity.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L15)

Entity - unified representation of any node in the graph.
Can be atomic (no children) or composite (with children).
All nodes in the hierarchy are the same type - no subclassing needed.

NOTE: connections are cached by GraphManager.buildGraph() based on the flat
Connection[] list, not stored by the user at construction time.

## Constructors

### Constructor

> **new Entity**(`id`, `attributes`): `Entity`

Defined in: [core/Entity.ts:44](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L44)

#### Parameters

##### id

`string`

##### attributes

`Record`\<`string`, `any`\> = `{}`

#### Returns

`Entity`

## Properties

### id

> **id**: `string`

Defined in: [core/Entity.ts:16](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L16)

***

### x

> **x**: `number`

Defined in: [core/Entity.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L17)

***

### y

> **y**: `number`

Defined in: [core/Entity.ts:18](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L18)

***

### vx

> **vx**: `number`

Defined in: [core/Entity.ts:19](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L19)

***

### vy

> **vy**: `number`

Defined in: [core/Entity.ts:20](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L20)

***

### implicit

> **implicit**: `boolean`

Defined in: [core/Entity.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L21)

***

### visible

> **visible**: `boolean`

Defined in: [core/Entity.ts:22](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L22)

***

### layer

> **layer**: `number`

Defined in: [core/Entity.ts:23](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L23)

***

### colour

> **colour**: `string`

Defined in: [core/Entity.ts:24](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L24)

***

### shape?

> `optional` **shape**: `string`

Defined in: [core/Entity.ts:25](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L25)

***

### shapeObject

> **shapeObject**: [`Shape`](../interfaces/Shape.md)

Defined in: [core/Entity.ts:26](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L26)

***

### attributes

> **attributes**: `Record`\<`string`, `any`\>

Defined in: [core/Entity.ts:27](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L27)

***

### selected

> **selected**: `boolean`

Defined in: [core/Entity.ts:28](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L28)

***

### highlighted

> **highlighted**: `boolean`

Defined in: [core/Entity.ts:29](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L29)

***

### alpha

> **alpha**: `number`

Defined in: [core/Entity.ts:30](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L30)

***

### parent

> **parent**: `Entity` \| `null`

Defined in: [core/Entity.ts:31](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L31)

***

### cumulativeScale

> **cumulativeScale**: `number`

Defined in: [core/Entity.ts:32](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L32)

***

### children

> **children**: `Entity`[]

Defined in: [core/Entity.ts:35](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L35)

***

### collapsed

> **collapsed**: `boolean`

Defined in: [core/Entity.ts:36](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L36)

***

### connections

> **connections**: [`Connection`](Connection.md)[]

Defined in: [core/Entity.ts:39](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L39)

***

### internalConnections

> **internalConnections**: [`Connection`](Connection.md)[]

Defined in: [core/Entity.ts:41](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L41)

***

### summaryConnections

> **summaryConnections**: [`Connection`](Connection.md)[]

Defined in: [core/Entity.ts:42](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L42)

## Methods

### setPosition()

> **setPosition**(`x`, `y`): `void`

Defined in: [core/Entity.ts:90](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L90)

Set position of this entity.

#### Parameters

##### x

`number`

##### y

`number`

#### Returns

`void`

***

### setCumulativeScale()

> **setCumulativeScale**(`scale`): `void`

Defined in: [core/Entity.ts:98](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L98)

Set the cumulative scale factor for this entity (layer scaling).

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### getCumulativeScale()

> **getCumulativeScale**(): `number`

Defined in: [core/Entity.ts:105](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L105)

Get the cumulative scale factor.

#### Returns

`number`

***

### getWorldSize()

> **getWorldSize**(): `number`

Defined in: [core/Entity.ts:112](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L112)

Get the world-space size (diameter).

#### Returns

`number`

***

### getWorldArea()

> **getWorldArea**(): `number`

Defined in: [core/Entity.ts:119](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L119)

Get the world-space area (for validation and physics).

#### Returns

`number`

***

### containsPoint()

> **containsPoint**(`worldPointX`, `worldPointY`): `boolean`

Defined in: [core/Entity.ts:127](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L127)

Check if a point is inside this entity's hitbox (for click detection).
COORDINATE SYSTEM: WORLD SPACE

#### Parameters

##### worldPointX

`number`

##### worldPointY

`number`

#### Returns

`boolean`

***

### isInside()

> **isInside**(`other`): `boolean`

Defined in: [core/Entity.ts:135](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L135)

Check if this entity is completely inside another entity.

#### Parameters

##### other

`Entity`

#### Returns

`boolean`

***

### intersects()

> **intersects**(`other`): `boolean`

Defined in: [core/Entity.ts:151](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L151)

Check if this entity intersects/overlaps with another entity.

#### Parameters

##### other

`Entity`

#### Returns

`boolean`

***

### updateShapeType()

> **updateShapeType**(`newShapeType`): `void`

Defined in: [core/Entity.ts:168](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L168)

Updates the shape type (typically when layer metadata overrides it).
Recreates the shape with the new type.

#### Parameters

##### newShapeType

`string`

#### Returns

`void`

***

### isComposite()

> **isComposite**(): `boolean`

Defined in: [core/Entity.ts:176](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L176)

Check if this entity has children (is a container).

#### Returns

`boolean`

***

### getAllChildren()

> **getAllChildren**(): `Entity`[]

Defined in: [core/Entity.ts:183](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L183)

Get all child entities recursively.

#### Returns

`Entity`[]

***

### getVisibleChildren()

> **getVisibleChildren**(): `Entity`[]

Defined in: [core/Entity.ts:195](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L195)

Get visible children recursively (accounting for collapsed state).

#### Returns

`Entity`[]

***

### getLeafEntities()

> **getLeafEntities**(): `Entity`[]

Defined in: [core/Entity.ts:218](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L218)

Get leaf entities recursively (excluding implicit).

#### Returns

`Entity`[]

***

### updateSummaryEdges()

> **updateSummaryEdges**(): `void`

Defined in: [core/Entity.ts:238](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L238)

Update summary connections when state changes.
Note: collapsed state is now managed by LayerDetailManager.

#### Returns

`void`

***

### setLayer()

> **setLayer**(`level`): `void`

Defined in: [core/Entity.ts:246](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L246)

Set layer for this entity and all children.

#### Parameters

##### level

`number`

#### Returns

`void`

***

### getVisibility()

> **getVisibility**(`zoomLevel`): `number`

Defined in: [core/Entity.ts:258](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L258)

Get visibility opacity based on zoom level (default: always visible).

#### Parameters

##### zoomLevel

`number`

#### Returns

`number`

***

### highlight()

> **highlight**(): `void`

Defined in: [core/Entity.ts:271](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L271)

Highlight/select methods for interactivity.

#### Returns

`void`

***

### unhighlight()

> **unhighlight**(): `void`

Defined in: [core/Entity.ts:275](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L275)

#### Returns

`void`

***

### select()

> **select**(): `void`

Defined in: [core/Entity.ts:279](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L279)

#### Returns

`void`

***

### deselect()

> **deselect**(): `void`

Defined in: [core/Entity.ts:283](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L283)

#### Returns

`void`

***

### setOpacity()

> **setOpacity**(`alpha`): `void`

Defined in: [core/Entity.ts:287](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L287)

#### Parameters

##### alpha

`number`

#### Returns

`void`

***

### updateAttribute()

> **updateAttribute**(`key`, `value`): `void`

Defined in: [core/Entity.ts:291](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Entity.ts#L291)

#### Parameters

##### key

`string`

##### value

`any`

#### Returns

`void`
