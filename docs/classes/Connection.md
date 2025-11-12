[**zoomies-js**](../README.md)

***

Defined in: [core/Connection.ts:25](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L25)

Unified connection type supporting arbitrary source/target counts.
Replaces both Edge (1-to-1) and HyperEdge (many-to-many).
Can represent:
- Simple edges: 1 source → 1 target
- Reactions: N sources → M targets
- Any graph connection pattern

When multiple edges connect the same node pair, they're merged into one
Connection with multiple subEdges (one per actual edge).

## Constructors

### Constructor

> **new Connection**(`id`, `sources`, `targets`, `attributes`): `Connection`

Defined in: [core/Connection.ts:38](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L38)

#### Parameters

##### id

`string`

##### sources

[`Entity`](Entity.md) | [`Entity`](Entity.md)[]

##### targets

[`Entity`](Entity.md) | [`Entity`](Entity.md)[]

##### attributes

`Record`\<`string`, `any`\> = `{}`

#### Returns

`Connection`

## Properties

### id

> **id**: `string`

Defined in: [core/Connection.ts:26](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L26)

***

### sources

> **sources**: [`Entity`](Entity.md)[]

Defined in: [core/Connection.ts:27](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L27)

***

### targets

> **targets**: [`Entity`](Entity.md)[]

Defined in: [core/Connection.ts:28](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L28)

***

### attributes

> **attributes**: `Record`\<`string`, `any`\>

Defined in: [core/Connection.ts:29](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L29)

***

### hidden

> **hidden**: `boolean`

Defined in: [core/Connection.ts:30](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L30)

***

### highlighted

> **highlighted**: `boolean`

Defined in: [core/Connection.ts:31](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L31)

***

### alpha

> **alpha**: `number`

Defined in: [core/Connection.ts:32](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L32)

***

### detailConnections?

> `optional` **detailConnections**: `Connection`[]

Defined in: [core/Connection.ts:33](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L33)

***

### subEdges

> **subEdges**: [`SubEdge`](../interfaces/SubEdge.md)[]

Defined in: [core/Connection.ts:34](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L34)

***

### normalizedWidth

> **normalizedWidth**: `number`

Defined in: [core/Connection.ts:35](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L35)

***

### cumulativeScale

> **cumulativeScale**: `number`

Defined in: [core/Connection.ts:36](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L36)

## Methods

### addSubEdge()

> **addSubEdge**(`type`, `source`, `target`): `void`

Defined in: [core/Connection.ts:74](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L74)

Add a sub-edge to this connection (for edge merging).

#### Parameters

##### type

`"user"` | `"synthetic"`

##### source

[`Entity`](Entity.md)

##### target

[`Entity`](Entity.md)

#### Returns

`void`

***

### getVisibility()

> **getVisibility**(`zoomLevel`): `number`

Defined in: [core/Connection.ts:82](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L82)

Get visibility at a zoom level.
Connection is visible if all sources AND all targets are visible.

#### Parameters

##### zoomLevel

`number`

#### Returns

`number`

***

### setOpacity()

> **setOpacity**(`alpha`): `void`

Defined in: [core/Connection.ts:94](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L94)

Set opacity for rendering.

#### Parameters

##### alpha

`number`

#### Returns

`void`

***

### highlight()

> **highlight**(): `void`

Defined in: [core/Connection.ts:101](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L101)

Highlight the connection.

#### Returns

`void`

***

### unhighlight()

> **unhighlight**(): `void`

Defined in: [core/Connection.ts:108](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L108)

Remove highlight.

#### Returns

`void`

***

### setCumulativeScale()

> **setCumulativeScale**(`scale`): `void`

Defined in: [core/Connection.ts:115](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L115)

Inject cumulative layer scale from GraphManager.

#### Parameters

##### scale

`number`

#### Returns

`void`

***

### getCumulativeScale()

> **getCumulativeScale**(): `number`

Defined in: [core/Connection.ts:122](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L122)

Get cached cumulative layer scale (for label rendering).

#### Returns

`number`

***

### getWorldWidth()

> **getWorldWidth**(): `number`

Defined in: [core/Connection.ts:130](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L130)

Get the world-space width (for physics and rendering).
Edges scale the same way as nodes: (normalizedWidth × BASE_UNIT_TO_PIXELS × EDGE_WIDTH_SCALE) * cumulativeScale

#### Returns

`number`

***

### toJSON()

> **toJSON**(): `Record`\<`string`, `any`\>

Defined in: [core/Connection.ts:137](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/core/Connection.ts#L137)

Get simplified representation for serialization.

#### Returns

`Record`\<`string`, `any`\>
