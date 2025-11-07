# Zoomies.js 🧬

**Interactive hierarchical multi-scale graph visualization library** for generic domains.

Zoomies.js is a fully domain-agnostic TypeScript/JavaScript library for rendering complex hierarchical graphs with smooth zoom-based abstraction, physics-based layout, and rich interactions. Originally designed with biological networks (gene regulatory systems) in mind, it works for any domain.

## Features ✨

- **Hierarchical Modules**: Organise nodes into collapsible/expandable modules at multiple abstraction levels
- **Hyperedges**: Support multi-source, multi-target connections (reactions, interactions)
- **Implicit Nodes**: Hide nodes (e.g., catalysts) from rendering while maintaining hyperedge semantics
- **Zoom-Based Visibility**: Smooth transitions and layer-aware opacity as users zoom in/out
- **Physics Layout**: Force-directed layout with repulsive and attractive forces
- **Rich Interactions**: Click to select, hover to highlight, drag for manipulation, scroll to zoom
- **Canvas Rendering**: Fast 2D canvas rendering (no external graphics library required)
- **Fully Generic**: All semantics live in `attributes` — extend for your domain
- **TypeScript**: Fully typed with comprehensive documentation

## Installation

```bash
npm install zoomies-js
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; }
        canvas { display: block; width: 100vw; height: 100vh; }
    </style>
</head>
<body>
    <canvas id="graph-canvas"></canvas>
    <script type="module">
        import { Zoomies, Node, Edge, Module } from './node_modules/zoomies-js/dist/index.esm.js';

        // Create nodes
        const nodeA = new Node('Node_A', { colour: '#3498db' });
        const nodeB = new Node('Node_B', { colour: '#e74c3c' });

        // Create edge
        const edge = new Edge('edge1', nodeA, nodeB, { colour: '#95a5a6' });

        // Initialise graph
        const zoomies = new Zoomies('#graph-canvas', {
            nodes: [nodeA, nodeB],
            edges: [edge],
            enablePhysics: true
        });

        // Zoom controls
        window.addEventListener('wheel', (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.2 : 0.2;
                zoomies.manager.adjustZoom(delta);
            }
        });
    </script>
</body>
</html>
```

## Core Classes

### `Node`
Represents a single entity in the graph.

```typescript
const node = new Node('my_node', {
    layer: 0,                    // Abstraction level
    colour: '#3498db',           // Colour (hex or CSS)
    radius: 15,                  // Radius in pixels
    implicit: false,             // If true, node is not rendered
    customAttr: 'value'          // Domain-specific metadata
});

node.select();
node.setPosition(x, y);
node.setOpacity(alpha);
node.updateAttribute('key', value);
```

### `Edge`
Represents a simple directed connection between two nodes.

```typescript
const edge = new Edge('edge_id', sourceNode, targetNode, {
    colour: '#95a5a6',
    width: 2,
    weight: 1.0
});

edge.highlight();
edge.setOpacity(0.5);
```

### `HyperEdge`
Represents a connection from multiple sources to multiple targets. **Implicit nodes are automatically excluded**.

```typescript
const reaction = new HyperEdge('transcription', 
    [tf_node, dna_node],      // sources
    [mrna_node],               // targets
    { colour: '#9b59b6' }
);

// Implicit nodes are filtered out
const implicit_catalyst = new Node('catalyst', { implicit: true });
const he = new HyperEdge('rxn', [implicit_catalyst, gene], [product]);
// he.sources only contains [gene]
```

### `Module`
Hierarchical grouping of nodes and edges. Can be collapsed/expanded.

```typescript
const module = new Module('Gene_A', {
    nodes: [mRNA, protein],
    edges: [edge1, edge2],
    hyperEdges: [transcription, translation],
    layer: 1,
    colour: '#ecf0f1',
    radius: 30
});

module.collapse();  // Hide internal nodes, show summary edges
module.expand();    // Reverse
module.setLayer(2); // Update layer for all children
```

### `GraphManager`
Main orchestrator. Manages all entities, physics, rendering, and interactions.

```typescript
const manager = new GraphManager(canvas);

manager.addNode(node);
manager.addEdge(edge);
manager.addModule(module);

manager.enablePhysics();
manager.setZoom(1.5);
manager.collapseModule(module);

manager.start();  // Begin animation loop
```

### `Zoomies` (Convenience Wrapper)
Simplified API for quick setup.

```typescript
const zoomies = new Zoomies('#canvas', {
    nodes: [n1, n2],
    edges: [e1, e2],
    hyperEdges: [he1],
    modules: [m1],
    enablePhysics: true
});

zoomies.setZoom(level);
zoomies.addNode(newNode);
zoomies.on('nodeSelected', (node) => console.log(node));
zoomies.collapseModule(module);
```

## Advanced Usage

### Gene Regulatory Network Example

```typescript
import { Zoomies, Node, Edge, HyperEdge, Module } from 'zoomies-js';

// Level 0: Base molecular species
const mRNA_A = new Node('mRNA_A', { layer: 0, colour: '#3498db' });
const protein_A = new Node('Protein_A', { layer: 0, colour: '#3498db' });
const protein_B = new Node('Protein_B', { layer: 0, colour: '#3498db' });

// Implicit nodes (not rendered but part of reactions)
const ribosome = new Node('Ribosome', { implicit: true });
const tf = new Node('TF_A', { implicit: true });

// Level 0: Reactions (hyperedges)
const transcription = new HyperEdge('transcription', [tf], [mRNA_A], {
    colour: '#9b59b6'
});
const translation = new HyperEdge('translation', [mRNA_A, ribosome], [protein_A], {
    colour: '#9b59b6'
});

// Regulatory edge
const repression = new Edge('repression', protein_B, mRNA_A, { colour: '#e74c3c' });

// Level 1: Gene module
const geneModule = new Module('Gene_A', {
    nodes: [mRNA_A, protein_A],
    edges: [repression],
    hyperEdges: [transcription, translation],
    layer: 1
});

// Level 2: Cellular process module
const processModule = new Module('DifferentiationProcess', {
    nodes: [geneModule, /* other genes */],
    layer: 2
});

// Initialise
const zoomies = new Zoomies('#canvas', {
    nodes: [mRNA_A, protein_A, protein_B, ribosome, tf],
    edges: [repression],
    hyperEdges: [transcription, translation],
    modules: [geneModule, processModule],
    enablePhysics: true
});

// Interactions
zoomies.on('nodeHover', (node) => {
    console.log('Hovering:', node.id);
});

zoomies.on('nodeSelected', (node) => {
    // Highlight dependencies
    zoomies.manager.edges.forEach(e => {
        if (e.source === node || e.target === node) {
            e.highlight();
        }
    });
});
```

### Custom Rendering Attributes

All styling is controlled via `attributes`:

```typescript
const node = new Node('styled_node', {
    colour: '#e74c3c',           // CSS colour
    radius: 20,
    layer: 1,
    domain: 'biology',           // Custom attribute
    expression_level: 42,        // Custom attribute
    interactions: ['node_b']     // Custom attribute
});

const edge = new Edge('e', n1, n2, {
    colour: '#95a5a6',
    width: 3,
    weight: 0.8,
    type: 'activation'           // Custom semantic
});
```

## Physics

The `PhysicsEngine` uses spring forces and repulsion for layout.

```typescript
const manager = new GraphManager(canvas);

manager.enablePhysics();

// Adjust forces
manager.getPhysicsEngine().setCharge(300);      // Repulsion
manager.getPhysicsEngine().setLinkDistance(100);// Spring length

// Drag a node
manager.getPhysicsEngine().pinNode(node, x, y);
manager.getPhysicsEngine().unpinNode(node);
```

## Zoom & Layers

Zoom level controls visibility of nodes and edges based on their layer.

```typescript
const zoomManager = manager.getZoomManager();

zoomManager.setZoom(1.5);                        // Animated zoom
zoomManager.setZoom(1.5, false);                 // Instant zoom

// Automatic module expand/collapse based on zoom
// (triggered by ZoomManager internally)

// Manual control
manager.collapseModule(module);
manager.expandModule(module);
```

## Interactions

Mouse and keyboard events are handled automatically:

- **Scroll**: Zoom in/out
- **Click**: Select node
- **Ctrl+Click**: Multi-select
- **Hover**: Highlight node
- **Right-click on Module**: Toggle collapse/expand

Listen to events via `InteractionManager`:

```typescript
const im = manager.getInteractionManager();

im.on('nodeSelected', (node) => console.log('Selected:', node.id));
im.on('nodeDeselected', (node) => console.log('Deselected:', node.id));
im.on('nodeHover', (node) => console.log('Hovering:', node.id));
im.on('edgeHover', (edge) => console.log('Edge hover:', edge.id));
im.on('hyperEdgeHover', (he) => console.log('HE hover:', he.id));
```

## API Reference

### GraphManager

```typescript
// Add/remove entities
addNode(node: Node): void
removeNode(node: Node): void
addEdge(edge: Edge): void
removeEdge(edge: Edge): void
addHyperEdge(he: HyperEdge): void
removeHyperEdge(he: HyperEdge): void
addModule(module: Module): void
removeModule(module: Module): void

// Module control
collapseModule(module: Module): void
expandModule(module: Module): void

// Physics
enablePhysics(): void
disablePhysics(): void

// Zoom
setZoom(level: number, animate?: boolean): void
adjustZoom(delta: number): void
getZoom(): number

// Animation
start(): void
stop(): void

// Accessors
getVisibleNodes(): Node[]
getVisibleEdges(): Edge[]
getVisibleHyperEdges(): HyperEdge[]
getInteractionManager(): InteractionManager
getZoomManager(): ZoomManager
getPhysicsEngine(): PhysicsEngine
```

### Zoomies (Wrapper)

```typescript
addNode(node: Node): void
removeNode(node: Node): void
addEdge(edge: Edge): void
removeEdge(edge: Edge): void
addHyperEdge(he: HyperEdge): void
removeHyperEdge(he: HyperEdge): void
addModule(module: Module): void
removeModule(module: Module): void
enablePhysics(): void
disablePhysics(): void
setZoom(level: number): void
getZoom(): number
on(event: string, callback: Function): void
collapseModule(module: Module): void
expandModule(module: Module): void
destroy(): void
```

## Testing

```bash
npm test
npm run test:watch
```

## Architecture Notes

See `ARCHITECTURE.md` for detailed class hierarchy and design patterns.

### Design Principles

1. **Fully Generic**: No domain-specific types. Use `attributes` for metadata.
2. **Modular**: Each class has one responsibility. Keep functions small.
3. **Extensible**: Override `Renderer` or `PhysicsEngine` for custom behaviour.
4. **Performance**: Canvas rendering, efficient physics updates, lazy re-renders.
5. **Implicit Nodes**: Hidden nodes don't affect rendering or hyperedge calculations.

## Browser Compatibility

- Modern browsers with HTML5 Canvas support
- Chrome, Firefox, Safari, Edge (recent versions)

## Performance Tips

- Disable physics for static graphs: `manager.disablePhysics()`
- Use implicit nodes for catalysts/intermediates
- Collapse modules when zoomed out
- Limit number of visible nodes (use layers effectively)

## Contributing

Issues and pull requests welcome!

## License

MIT

---

**Zoomies.js** © 2025. Built for generic, hierarchical, multi-scale graph visualisation.