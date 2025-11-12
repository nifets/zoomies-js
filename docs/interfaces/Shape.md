[**zoomies-js**](../README.md)

***

Defined in: [shapes/Shape.ts:9](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L9)

Abstract base class for node shapes.
Encapsulates geometry calculations for different shape types.
Subclasses store all shape-specific parameters internally in normalized coordinates.
Shape is responsible for converting normalized → world space using CONFIG.BASE_UNIT_TO_PIXELS.

## Methods

### getDiameter()

> `abstract` **getDiameter**(): `number`

Defined in: [shapes/Shape.ts:13](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L13)

Get normalized diameter/bounding size (in abstract coordinate space).

#### Returns

`number`

***

### getArea()

> `abstract` **getArea**(): `number`

Defined in: [shapes/Shape.ts:18](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L18)

Get the normalized area of this shape (in abstract coordinate space).

#### Returns

`number`

***

### getWorldSize()

> **getWorldSize**(`cumulativeScale`): `number`

Defined in: [shapes/Shape.ts:27](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L27)

Get the normalized area of this shape (in abstract coordinate space).
For circles: π × r². For rectangles: w × h.

/**
Get the world-space size (diameter for circles, max dimension for rectangles).

#### Parameters

##### cumulativeScale

`number`

Cumulative layer scale factor

#### Returns

`number`

***

### getWorldArea()

> **getWorldArea**(`cumulativeScale`): `number`

Defined in: [shapes/Shape.ts:34](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L34)

#### Parameters

##### cumulativeScale

`number`

#### Returns

`number`

***

### draw()

> `abstract` **draw**(`graphics`, `x`, `y`, `colour`, `bgOpacity`, `screenSize`): `void`

Defined in: [shapes/Shape.ts:45](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L45)

Draw this shape on a graphics context (for rendering).
Subclasses implement shape-specific drawing logic.

#### Parameters

##### graphics

`any`

##### x

`number`

##### y

`number`

##### colour

`number`

##### bgOpacity

`number`

##### screenSize

`number`

The screen-space size for rendering

#### Returns

`void`

***

### drawStroke()

> `abstract` **drawStroke**(`graphics`, `x`, `y`, `colour`, `isSelected`, `isHighlighted`, `screenSize`): `void`

Defined in: [shapes/Shape.ts:52](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L52)

Draw border/stroke for this shape.
Subclasses implement shape-specific stroke logic.

#### Parameters

##### graphics

`any`

##### x

`number`

##### y

`number`

##### colour

`number`

##### isSelected

`boolean`

##### isHighlighted

`boolean`

##### screenSize

`number`

The screen-space size for rendering borders

#### Returns

`void`

***

### getRandomInteriorPoint()

> `abstract` **getRandomInteriorPoint**(`centerX`, `centerY`): `object`

Defined in: [shapes/Shape.ts:57](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L57)

Get a random point inside the shape.

#### Parameters

##### centerX

`number`

##### centerY

`number`

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

***

### getBorderPoint()

> `abstract` **getBorderPoint**(`centerX`, `centerY`, `targetX`, `targetY`, `worldSize`): `object`

Defined in: [shapes/Shape.ts:64](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L64)

Get the border intersection point when drawing a line from center toward target.
All coordinates are in world space.

#### Parameters

##### centerX

`number`

##### centerY

`number`

##### targetX

`number`

##### targetY

`number`

##### worldSize

`number`

The world-space size (diameter) of the shape

#### Returns

`object`

##### x

> **x**: `number`

##### y

> **y**: `number`

***

### isInside()

> `abstract` **isInside**(`worldPointX`, `worldPointY`, `worldCenterX`, `worldCenterY`, `worldSize`): `boolean`

Defined in: [shapes/Shape.ts:77](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L77)

Check if a point is inside the shape (world-space coordinates).
COORDINATE SYSTEM: WORLD SPACE

#### Parameters

##### worldPointX

`number`

##### worldPointY

`number`

##### worldCenterX

`number`

##### worldCenterY

`number`

##### worldSize

`number`

The size (diameter) of the shape in world coordinates

#### Returns

`boolean`

***

### containsPoint()

> **containsPoint**(`worldPointX`, `worldPointY`, `worldCenterX`, `worldCenterY`, `worldSize`): `boolean`

Defined in: [shapes/Shape.ts:91](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L91)

Check if a point is within the interactive hitbox of the shape (for clicking).
COORDINATE SYSTEM: WORLD SPACE
Can be larger than visual bounds for better UX (10% larger).

#### Parameters

##### worldPointX

`number`

##### worldPointY

`number`

##### worldCenterX

`number`

##### worldCenterY

`number`

##### worldSize

`number`

The size (diameter) of the shape in world coordinates

#### Returns

`boolean`

***

### enforceConstraint()

> **enforceConstraint**(`worldPointX`, `worldPointY`, `vx`, `vy`, `worldCenterX`, `worldCenterY`, `worldSize`, `margin`): \{ `x`: `number`; `y`: `number`; `vx`: `number`; `vy`: `number`; \} \| `null`

Defined in: [shapes/Shape.ts:107](https://github.com/nifets/zoomies-js/blob/0d7758852e4c1a3b4634cb238d563fd82f3a7920/src/shapes/Shape.ts#L107)

Enforce boundary constraint - teleport point back inside if outside.
COORDINATE SYSTEM: WORLD SPACE

#### Parameters

##### worldPointX

`number`

##### worldPointY

`number`

##### vx

`number`

##### vy

`number`

##### worldCenterX

`number`

##### worldCenterY

`number`

##### worldSize

`number`

The size (diameter) of the boundary shape in world coordinates

##### margin

`number` = `0.9`

#### Returns

\{ `x`: `number`; `y`: `number`; `vx`: `number`; `vy`: `number`; \} \| `null`
