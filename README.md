# Zoomies.js

**Interactive hierarchical multi-scale graph visualisation library.**

Domain-agnostic TypeScript library for complex hierarchical graphs with zoom-based abstraction, physics layout, and rich interactions.

## Features

- **Hierarchical Composites**: Collapsible/expandable containers at multiple levels
- **Unified Connections**: Single type supporting 1-to-1, many-to-many, any pattern
- **Implicit Entities**: Hide entities from rendering whilst maintaining connection semantics
- **Zoom-Based Visibility**: Layer-aware opacity transitions
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
import { Zoomies, Entity, CompositeEntity, Connection } from 'zoomies-js';

// Create entities
const entityA = new Entity('Entity_A', { colour: '#3498db' });
const entityB = new Entity('Entity_B', { colour: '#e74c3c' });

// Create connection
const conn = new Connection('conn1', entityA, entityB, { colour: '#95a5a6' });

// Create root composite
const root = new CompositeEntity('root', {
    children: [entityA, entityB],
    connections: [conn]
});

// Initialise
const zoomies = new Zoomies('#canvas', root, { enablePhysics: true });
```


## Core Classes

### Entity

Atomic node in the graph.

```typescript
const entity = new Entity('my_entity', {
    layer: 0,
    colour: '#3498db',
    radius: 15,
    implicit: false,
    shape: 'circle'  // or 'rectangle'
});

entity.setPosition(x, y);
entity.select();
```

### CompositeEntity

Container for entities and connections (recursive hierarchy).

```typescript
const composite = new CompositeEntity('Gene_A', {
    children: [mRNA, protein],
    connections: [conn1, conn2],
    layer: 1,
    colour: '#ecf0f1',
    radius: 30,
    shape: 'rectangle'
});

composite.collapse();
composite.expand();
```

### Connection

Unified connection type (1-to-1, many-to-many, any pattern).

```typescript
// Simple 1-to-1
const edge = new Connection('e1', sourceEntity, targetEntity);

// Many-to-many (replaces HyperEdge)
const reaction = new Connection('rxn', 
    [enzyme, substrate],  // sources
    [product],            // targets
    { colour: '#9b59b6' }
);
```



## API

### Zoomies

```typescript
const zoomies = new Zoomies(selector, root, options);

zoomies.enablePhysics();
zoomies.disablePhysics();
zoomies.setZoom(level);
zoomies.getZoom();
zoomies.on(event, callback);
zoomies.collapseEntity(composite);
zoomies.expandEntity(composite);
```

### GraphManager

```typescript
manager.setRoot(composite);
manager.enablePhysics();
manager.setZoom(level);
manager.collapseEntity(composite);
manager.expandEntity(composite);
manager.start();
manager.stop();
```

## Events

```typescript
zoomies.on('nodeSelected', (entity) => console.log(entity));
zoomies.on('nodeHover', (entity) => console.log(entity));
```

## Architecture

See `ARCHITECTURE.md` for design overview.
See `CODE_STRUCTURE.md` for complete file/function listing (auto-generated via `npm run generate-structure`).

## License

MIT
