[**zoomies-js**](../README.md)

***

Defined in: [managers/PhysicsEngine.ts:11](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L11)

Physics engine for force-directed layout.
Uses layer-based simulation where all entities at the same hierarchy level
are simulated together in their own "universe".

## Constructors

### Constructor

> **new PhysicsEngine**(): `PhysicsEngine`

Defined in: [managers/PhysicsEngine.ts:21](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L21)

#### Returns

`PhysicsEngine`

## Properties

### root

> **root**: [`Entity`](Entity.md) \| `null`

Defined in: [managers/PhysicsEngine.ts:12](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L12)

***

### layers

> **layers**: [`Entity`](Entity.md)[][] = `[]`

Defined in: [managers/PhysicsEngine.ts:13](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L13)

***

### connections

> **connections**: [`Connection`](Connection.md)[]

Defined in: [managers/PhysicsEngine.ts:14](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L14)

***

### isRunning

> **isRunning**: `boolean`

Defined in: [managers/PhysicsEngine.ts:15](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L15)

***

### animationFrameId

> **animationFrameId**: `number` \| `null`

Defined in: [managers/PhysicsEngine.ts:16](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L16)

***

### pinnedNodes

> **pinnedNodes**: `Set`\<[`Entity`](Entity.md)\>

Defined in: [managers/PhysicsEngine.ts:17](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L17)

***

### visibleEntities

> **visibleEntities**: `Set`\<[`Entity`](Entity.md)\>

Defined in: [managers/PhysicsEngine.ts:18](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L18)

***

### crossLayerConnections

> **crossLayerConnections**: [`Connection`](Connection.md)[]

Defined in: [managers/PhysicsEngine.ts:19](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L19)

## Methods

### init()

> **init**(`root`): `void`

Defined in: [managers/PhysicsEngine.ts:36](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L36)

Initialize the physics simulation with the root entity.
Organizes entities into layers based on their depth in the hierarchy.

#### Parameters

##### root

[`Entity`](Entity.md)

#### Returns

`void`

***

### buildLayers()

> `private` **buildLayers**(`entity`, `parentDepth`): `number`

Defined in: [managers/PhysicsEngine.ts:62](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L62)

Recursively build layers: group entities by their depth.
Level 0: leaf nodes (Entity)
Level 1: CompositeEntity containing level 0 entities
Level N: CompositeEntity containing level N-1 entities

#### Parameters

##### entity

[`Entity`](Entity.md)

##### parentDepth

`number`

#### Returns

`number`

***

### setConnections()

> **setConnections**(`connections`): `void`

Defined in: [managers/PhysicsEngine.ts:99](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L99)

Set connections for the physics simulation.

#### Parameters

##### connections

[`Connection`](Connection.md)[]

#### Returns

`void`

***

### setVisibleEntities()

> **setVisibleEntities**(`visibleEntities`): `void`

Defined in: [managers/PhysicsEngine.ts:131](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L131)

Set the visible entities for physics simulation.
Only entities in this set are simulated; others are frozen.
Called per frame to filter based on zoom level.

#### Parameters

##### visibleEntities

[`Entity`](Entity.md)[]

#### Returns

`void`

***

### start()

> **start**(): `void`

Defined in: [managers/PhysicsEngine.ts:138](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L138)

Start the physics simulation.

#### Returns

`void`

***

### stop()

> **stop**(): `void`

Defined in: [managers/PhysicsEngine.ts:146](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L146)

Stop the simulation.

#### Returns

`void`

***

### animate()

> `private` **animate**(): `void`

Defined in: [managers/PhysicsEngine.ts:157](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L157)

Main simulation loop.

#### Returns

`void`

***

### simulationStep()

> `private` **simulationStep**(): `void`

Defined in: [managers/PhysicsEngine.ts:171](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L171)

Perform one step of the physics simulation.
Simulates each layer independently: entities at the same depth interact with each other.

#### Returns

`void`

***

### simulateLayer()

> `private` **simulateLayer**(`entities`, `depth`): `void`

Defined in: [managers/PhysicsEngine.ts:188](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L188)

Simulate physics for all entities at a given layer/depth.
All entities at the same depth are treated as peers in the same physics universe.

#### Parameters

##### entities

[`Entity`](Entity.md)[]

##### depth

`number`

#### Returns

`void`

***

### applySoftBoundaryRepulsion()

> `private` **applySoftBoundaryRepulsion**(`child`, `parent`): `void`

Defined in: [managers/PhysicsEngine.ts:379](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L379)

Apply soft repulsive force when child approaches parent boundary.
Repulsion only activates when child is meaningfully outside (beyond margin).

#### Parameters

##### child

[`Entity`](Entity.md)

##### parent

[`Entity`](Entity.md)

#### Returns

`void`

***

### enforceHardBoundary()

> `private` **enforceHardBoundary**(`child`, `parent`): `void`

Defined in: [managers/PhysicsEngine.ts:401](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L401)

Hard boundary constraint - last-resort safety net.
Only activates if child has escaped significantly despite soft repulsion.
Forcibly repositions child back inside and damps outward velocity.

#### Parameters

##### child

[`Entity`](Entity.md)

##### parent

[`Entity`](Entity.md)

#### Returns

`void`

***

### updatePositions()

> `private` **updatePositions**(): `void`

Defined in: [managers/PhysicsEngine.ts:428](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L428)

Update positions for all entities in all layers.

#### Returns

`void`

***

### applyRepulsion()

> `private` **applyRepulsion**(`a`, `b`, `multiplier`): `void`

Defined in: [managers/PhysicsEngine.ts:462](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L462)

Apply repulsive force between two nodes.
Considers node size (radius) to prevent overlap.
All forces scale by node sizes for invariant behavior across different scales.

#### Parameters

##### a

[`Entity`](Entity.md)

##### b

[`Entity`](Entity.md)

##### multiplier

`number` = `1.0`

#### Returns

`void`

***

### applyAttraction()

> `private` **applyAttraction**(`a`, `b`, `isBranching`): `void`

Defined in: [managers/PhysicsEngine.ts:506](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L506)

Apply attractive force along an edge.
Target distance depends on node sizes: equilibrium = minDist + baseSpacing.
Force magnitude scales with node sizes for scale-invariant behavior.

#### Parameters

##### a

[`Entity`](Entity.md)

##### b

[`Entity`](Entity.md)

##### isBranching

`boolean` = `false`

#### Returns

`void`

***

### setCharge()

> **setCharge**(`strength`): `void`

Defined in: [managers/PhysicsEngine.ts:557](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L557)

Set the repulsive charge force strength.

#### Parameters

##### strength

`number`

#### Returns

`void`

***

### setLinkDistance()

> **setLinkDistance**(`distance`): `void`

Defined in: [managers/PhysicsEngine.ts:566](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L566)

Set the target link distance.

#### Parameters

##### distance

`number`

#### Returns

`void`

***

### pinNode()

> **pinNode**(`node`, `x`, `y`): `void`

Defined in: [managers/PhysicsEngine.ts:575](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L575)

Manually set a node's position and pin it (for dragging).

#### Parameters

##### node

[`Entity`](Entity.md)

##### x

`number`

##### y

`number`

#### Returns

`void`

***

### unpinNode()

> **unpinNode**(`node`): `void`

Defined in: [managers/PhysicsEngine.ts:586](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/managers/PhysicsEngine.ts#L586)

Unpin a node (allow it to move again).

#### Parameters

##### node

[`Entity`](Entity.md)

#### Returns

`void`
