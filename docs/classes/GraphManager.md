[**zoomies-js**](../README.md)

***

Defined in: [managers/GraphManager.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L15)

Main graph manager and scene controller.
Works with flat lists of entities and connections.

## Constructors

### Constructor

> **new GraphManager**(`canvas`, `layerDetailConfig?`): `GraphManager`

Defined in: [managers/GraphManager.ts:38](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L38)

#### Parameters

##### canvas

`HTMLCanvasElement`

##### layerDetailConfig?

[`LayerDetailConfig`](../interfaces/LayerDetailConfig.md)

#### Returns

`GraphManager`

## Properties

### root

> **root**: [`Entity`](Entity.md) \| `null`

Defined in: [managers/GraphManager.ts:16](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L16)

***

### entities

> **entities**: [`Entity`](Entity.md)[]

Defined in: [managers/GraphManager.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L17)

***

### allConnections

> **allConnections**: [`Connection`](Connection.md)[]

Defined in: [managers/GraphManager.ts:18](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L18)

***

### renderer

> **renderer**: [`Renderer`](Renderer.md)

Defined in: [managers/GraphManager.ts:19](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L19)

***

### interactionManager

> **interactionManager**: [`InteractionManager`](InteractionManager.md)

Defined in: [managers/GraphManager.ts:20](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L20)

***

### zoomManager

> **zoomManager**: [`ZoomManager`](ZoomManager.md)

Defined in: [managers/GraphManager.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L21)

***

### physicsEngine

> **physicsEngine**: [`PhysicsEngine`](PhysicsEngine.md)

Defined in: [managers/GraphManager.ts:22](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L22)

***

### layerDetailManager

> **layerDetailManager**: [`LayerDetailManager`](LayerDetailManager.md)

Defined in: [managers/GraphManager.ts:23](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L23)

***

### zoomDebugWidget

> **zoomDebugWidget**: [`ZoomDebugWidget`](ZoomDebugWidget.md) \| `null`

Defined in: [managers/GraphManager.ts:24](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L24)

***

### canvas

> **canvas**: `HTMLCanvasElement`

Defined in: [managers/GraphManager.ts:25](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L25)

***

### isPhysicsEnabled

> **isPhysicsEnabled**: `boolean`

Defined in: [managers/GraphManager.ts:26](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L26)

***

### animationFrameId

> **animationFrameId**: `number` \| `null`

Defined in: [managers/GraphManager.ts:27](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L27)

***

### lastZoom

> **lastZoom**: `number`

Defined in: [managers/GraphManager.ts:28](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L28)

***

### draggedNode

> **draggedNode**: [`Entity`](Entity.md) \| `null`

Defined in: [managers/GraphManager.ts:29](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L29)

***

### pinnedNodes

> **pinnedNodes**: `Set`\<[`Entity`](Entity.md)\>

Defined in: [managers/GraphManager.ts:30](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L30)

***

### isPanning

> **isPanning**: `boolean`

Defined in: [managers/GraphManager.ts:31](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L31)

***

### panStartX

> **panStartX**: `number`

Defined in: [managers/GraphManager.ts:32](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L32)

***

### panStartY

> **panStartY**: `number`

Defined in: [managers/GraphManager.ts:33](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L33)

***

### offsetStartX

> **offsetStartX**: `number`

Defined in: [managers/GraphManager.ts:34](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L34)

***

### offsetStartY

> **offsetStartY**: `number`

Defined in: [managers/GraphManager.ts:35](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L35)

***

### renderConfig

> **renderConfig**: `Record`\<`string`, `any`\>

Defined in: [managers/GraphManager.ts:36](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L36)

## Methods

### init()

> **init**(): `Promise`\<`void`\>

Defined in: [managers/GraphManager.ts:66](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L66)

#### Returns

`Promise`\<`void`\>

***

### buildGraph()

> **buildGraph**(`entities`, `connections`): `void`

Defined in: [managers/GraphManager.ts:97](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L97)

Build the graph from flat lists: entities and connections.
- Populates entity.connections with edges they're involved in
- Populates entity.internalConnections for edges between their children
- Generates synthetic edges from parent-child relationships
- Merges user + synthetic edges that connect the same node pairs
- Builds scale bar from layer hierarchy

Call this after creating entities and connections, before physics/rendering.

#### Parameters

##### entities

[`Entity`](Entity.md)[]

##### connections

[`Connection`](Connection.md)[]

#### Returns

`void`

***

### connectionTouchesEntity()

> `private` **connectionTouchesEntity**(`conn`, `entity`): `boolean`

Defined in: [managers/GraphManager.ts:159](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L159)

Check if a connection touches an entity (directly or through its children).

#### Parameters

##### conn

[`Connection`](Connection.md)

##### entity

[`Entity`](Entity.md)

#### Returns

`boolean`

***

### generateSyntheticEdges()

> `private` **generateSyntheticEdges**(`entities`): [`Connection`](Connection.md)[]

Defined in: [managers/GraphManager.ts:178](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L178)

Generate synthetic edges from parent-child hierarchy.
When two composites have edges between their children, create synthetic
edges between the composites themselves.

#### Parameters

##### entities

[`Entity`](Entity.md)[]

#### Returns

[`Connection`](Connection.md)[]

***

### findEdgesBetweenChildren()

> `private` **findEdgesBetweenChildren**(`source`, `target`): [`Connection`](Connection.md)[]

Defined in: [managers/GraphManager.ts:218](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L218)

Find all edges that go from children of source to children of target.

#### Parameters

##### source

[`Entity`](Entity.md)

##### target

[`Entity`](Entity.md)

#### Returns

[`Connection`](Connection.md)[]

***

### mergeConnections()

> `private` **mergeConnections**(`userEdges`, `syntheticEdges`): `void`

Defined in: [managers/GraphManager.ts:237](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L237)

Merge synthetic edges with user edges. When edges connect the same node pair,
combine them into one Connection with multiple subEdges.
Also mark inter-composite edges as hidden (they're represented by synthetic edges).

#### Parameters

##### userEdges

[`Connection`](Connection.md)[]

##### syntheticEdges

[`Connection`](Connection.md)[]

#### Returns

`void`

***

### setRoot()

> **setRoot**(`root`): `void`

Defined in: [managers/GraphManager.ts:294](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L294)

Set the root entity for the entire graph.

#### Parameters

##### root

[`Entity`](Entity.md)

#### Returns

`void`

***

### getAllEntities()

> `private` **getAllEntities**(`entity`): [`Entity`](Entity.md)[]

Defined in: [managers/GraphManager.ts:304](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L304)

Collect all entities from tree (including composites and leaves, excluding implicit).

#### Parameters

##### entity

[`Entity`](Entity.md) = `...`

#### Returns

[`Entity`](Entity.md)[]

***

### getAllConnections()

> `private` **getAllConnections**(`entity`): [`Connection`](Connection.md)[]

Defined in: [managers/GraphManager.ts:330](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L330)

Collect all connections from tree (recursively from all composites).

#### Parameters

##### entity

[`Entity`](Entity.md) = `...`

#### Returns

[`Connection`](Connection.md)[]

***

### getAllComposites()

> `private` **getAllComposites**(`entity`): [`Entity`](Entity.md)[]

Defined in: [managers/GraphManager.ts:354](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L354)

Collect all composite entities from tree.

#### Parameters

##### entity

[`Entity`](Entity.md) = `...`

#### Returns

[`Entity`](Entity.md)[]

***

### getVisibleNodes()

> **getVisibleNodes**(): [`Entity`](Entity.md)[]

Defined in: [managers/GraphManager.ts:372](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L372)

Get visible nodes based on current zoom level (excluding implicit).

#### Returns

[`Entity`](Entity.md)[]

***

### getVisibleConnections()

> **getVisibleConnections**(): [`Connection`](Connection.md)[]

Defined in: [managers/GraphManager.ts:383](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L383)

Get all visible connections.

#### Returns

[`Connection`](Connection.md)[]

***

### findCompositeForEntity()

> `private` **findCompositeForEntity**(`target`, `entity`): [`Entity`](Entity.md) \| `null`

Defined in: [managers/GraphManager.ts:390](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L390)

Find which composite contains a given entity (recursively).

#### Parameters

##### target

[`Entity`](Entity.md)

##### entity

[`Entity`](Entity.md) = `...`

#### Returns

[`Entity`](Entity.md) \| `null`

***

### enablePhysics()

> **enablePhysics**(): `void`

Defined in: [managers/GraphManager.ts:409](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L409)

Enable physics-based layout.
Only simulates entities and connections in visible layers for performance.

#### Returns

`void`

***

### updatePhysicsForVisibleLayers()

> `private` **updatePhysicsForVisibleLayers**(): `void`

Defined in: [managers/GraphManager.ts:435](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L435)

Update physics to only simulate visible layers.
Called during animation to filter based on current zoom.

#### Returns

`void`

***

### disablePhysics()

> **disablePhysics**(): `void`

Defined in: [managers/GraphManager.ts:457](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L457)

Disable physics simulation.

#### Returns

`void`

***

### setZoom()

> **setZoom**(`level`, `animate`, `focusPoint?`): `void`

Defined in: [managers/GraphManager.ts:465](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L465)

Set zoom level.

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

### adjustZoom()

> **adjustZoom**(`delta`, `focusPoint?`): `void`

Defined in: [managers/GraphManager.ts:472](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L472)

Adjust zoom by delta, optionally towards a focus point (e.g., mouse position).

#### Parameters

##### delta

`number`

##### focusPoint?

###### x

`number`

###### y

`number`

#### Returns

`void`

***

### getZoom()

> **getZoom**(): `number`

Defined in: [managers/GraphManager.ts:481](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L481)

Get current zoom level.

#### Returns

`number`

***

### bindInteractions()

> `private` **bindInteractions**(): `void`

Defined in: [managers/GraphManager.ts:491](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L491)

Bind mouse/touch interactions.

#### Returns

`void`

***

### updateVisibility()

> `private` **updateVisibility**(): `void`

Defined in: [managers/GraphManager.ts:625](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L625)

Update entity and connection visibility based on scale bar and detail state.

#### Returns

`void`

***

### update()

> **update**(): `void`

Defined in: [managers/GraphManager.ts:657](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L657)

Update and render the scene.

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: [managers/GraphManager.ts:802](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L802)

Start animation loop.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [managers/GraphManager.ts:815](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L815)

Stop animation loop.

#### Returns

`void`

***

### getInteractionManager()

> **getInteractionManager**(): [`InteractionManager`](InteractionManager.md)

Defined in: [managers/GraphManager.ts:828](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L828)

Get interaction manager.

#### Returns

[`InteractionManager`](InteractionManager.md)

***

### getZoomManager()

> **getZoomManager**(): [`ZoomManager`](ZoomManager.md)

Defined in: [managers/GraphManager.ts:835](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L835)

Get zoom manager.

#### Returns

[`ZoomManager`](ZoomManager.md)

***

### getPhysicsEngine()

> **getPhysicsEngine**(): [`PhysicsEngine`](PhysicsEngine.md)

Defined in: [managers/GraphManager.ts:842](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L842)

Get physics engine.

#### Returns

[`PhysicsEngine`](PhysicsEngine.md)

***

### getLayerDetailManager()

> **getLayerDetailManager**(): [`LayerDetailManager`](LayerDetailManager.md)

Defined in: [managers/GraphManager.ts:849](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L849)

Get layer detail manager.

#### Returns

[`LayerDetailManager`](LayerDetailManager.md)

***

### toggleZoomDebug()

> **toggleZoomDebug**(): `void`

Defined in: [managers/GraphManager.ts:856](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L856)

Toggle zoom debug widget visibility.

#### Returns

`void`

***

### showZoomDebug()

> **showZoomDebug**(): `void`

Defined in: [managers/GraphManager.ts:868](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L868)

Show the zoom debug widget (create if not exists).

#### Returns

`void`

***

### setRenderConfig()

> **setRenderConfig**(`config`): `void`

Defined in: [managers/GraphManager.ts:877](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L877)

Set render configuration.

#### Parameters

##### config

`Record`\<`string`, `any`\>

#### Returns

`void`

***

### updateZoomDebug()

> `private` **updateZoomDebug**(): `void`

Defined in: [managers/GraphManager.ts:885](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/GraphManager.ts#L885)

Update zoom debug widget with current state.

#### Returns

`void`
