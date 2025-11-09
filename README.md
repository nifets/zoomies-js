# Zoomies.js

**Interactive hierarchical multi-scale graph visualisation library.**

Domain-agnostic TypeScript library for complex hierarchical graphs with zoom-based abstraction, physics layout, and rich interactions.

## Features

- **Hierarchical Composites**: Collapsible/expandable containers at multiple levels
- **Unified Connections**: Single type supporting 1-to-1, many-to-many, any pattern
- **Configurable Shapes**: Circle, rectangle, or custom shapes per entity
- **Shape-Agnostic Rendering**: Each shape handles its own rendering logic
- **Zoom-Based Visibility**: Layer-aware opacity transitions with boundary layer persistence
- **Physics Layout**: Force-directed with stratified composite physics
- **Rich Interactions**: Click, hover, drag, scroll
- **WebGL Rendering**: PixiJS-based GPU acceleration
- **Fully Generic**: All semantics in `attributes`
- **TypeScript**: Fully typed

## Installation

```bash
npm install zoomies-js
```

## Quick Start

```typescript
import { Zoomies, Entity, Connection } from 'zoomies-js';

// Create entities
const entityA = new Entity('Entity_A', { colour: '#3498db' });
const entityB = new Entity('Entity_B', { colour: '#e74c3c' });

// Create connection
const conn = new Connection('conn1', [entityA], [entityB], { colour: '#95a5a6' });

// Create composite
const composite = new Entity('Group', {
    children: [entityA, entityB],
    layer: 1,
    colour: '#ecf0f1'
});

// Initialise
const zoomies = new Zoomies('#canvas', [composite, entityA, entityB], [conn], { 
    enablePhysics: true 
});
```

## Core Classes

### Entity

Atomic node or composite container in the graph.

```typescript
const entity = new Entity('my_entity', {
    layer: 0,
    colour: '#3498db',
    radius: 15,
    shape: 'circle'     // or 'rectangle' or custom
});

// Composite (has children)
const composite = new Entity('group', {
    children: [entity],
    layer: 1,
    radius: 50
});

entity.setPosition(x, y);
entity.highlight();
composite.collapse();
```

### Connection

Unified connection type (1-to-1, many-to-many, any pattern).

```typescript
// Simple 1-to-1
const edge = new Connection('e1', [entityA], [entityB]);

// Many-to-many
const reaction = new Connection('rxn', 
    [enzyme, substrate],
    [product],
    { colour: '#9b59b6' }
);
```

### Shape

Each entity has a configurable shape. Built-in shapes:
- **CircleShape**: `radius` parameter
- **RectangleShape**: `width`, `height`, `cornerRadius` parameters

Custom shapes extend the `Shape` abstract class:

```typescript
class CustomShape extends Shape {
    draw(graphics, x, y, colour, bgOpacity) {
        // Render filled shape
    }
    drawStroke(graphics, x, y, colour, isSelected, isHighlighted) {
        // Render border
    }
    getDiameter(): number {
        // Return universal sizing metric
    }
    containsPoint(worldX, worldY, entityX, entityY): boolean {
        // Hitbox detection
    }
}
```

## API

### Zoomies

```typescript
const zoomies = new Zoomies(selector, entities, connections, options);

zoomies.enablePhysics();
zoomies.disablePhysics();
zoomies.setZoom(level);
zoomies.getZoom(): number;
zoomies.on(event, callback);
zoomies.collapseEntity(composite);
zoomies.expandEntity(composite);
zoomies.toggleZoomDebug();
zoomies.destroy();
```

### Options

```typescript
interface Options {
    enablePhysics?: boolean;
    physicsConfig?: PhysicsConfig;
    layerDetailConfig?: {
        layerScaleFactor?: number;           // Default: 3 (3x zoom per layer)
        layerMetadata?: Map<number, LayerMetadata>;
    };
}
```

### Layer Metadata

Customise appearance per layer:

```typescript
const layerMetadata = new Map();
layerMetadata.set(0, {
    entityShape: 'circle',
    entityColour: '#3498db',
    edgeColour: '#17a2b8',
    relativeScale: 2        // 2× scale to next layer
});

new Zoomies('#canvas', entities, connections, {
    layerDetailConfig: { layerMetadata }
});
```

## Events

```typescript
zoomies.on('nodeSelected', (entity) => console.log(entity));
zoomies.on('nodeHover', (entity) => console.log(entity));
```

## Architecture

**Key Principles:**
- **Flat API**: Work with `Entity[]` + `Connection[]` lists, not nested trees
- **Hierarchy**: Entities can have `parent` and `children` for logical grouping
- **Shape Separation**: Each entity has a `Shape` that handles rendering and geometry
- **Layer-Based LOD**: Zoom maps to layers; smooth fading between detail levels
- **Unified Visibility**: Renderer and physics use same visibility filtering to stay in sync
- **Boundary Layer Persistence**: Extreme zoom keeps boundary layers visible to prevent physics freeze

See `ARCHITECTURE.md` for complete design overview.

## License

MIT
