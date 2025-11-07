# ARCHITECTURE.md

## File Structure

```
src/
├── index.ts                    # Main entry point, exports public API
├── core/                       # Core entity classes
│   ├── Node.ts                # Graph node with Shape integration
│   ├── Edge.ts                # Edge with hierarchical support
│   ├── HyperEdge.ts          # Multi-source/target edges
│   └── Module.ts              # Hierarchical container extending Node
├── managers/                   # Simulation and interaction logic
│   ├── GraphManager.ts        # Main scene orchestrator
│   ├── PhysicsEngine.ts       # Modular physics with Shape integration
│   ├── InteractionManager.ts  # User interactions (drag, select, hover)
│   └── ZoomManager.ts         # Zoom level and layer visibility
├── rendering/                  # GPU-accelerated rendering
│   └── Renderer.ts            # Pixi.js WebGL renderer
└── shapes/                     # Geometry abstraction
    ├── Shape.ts               # Abstract base class
    ├── CircleShape.ts         # Circular geometry
    └── RectangleShape.ts      # Rectangular geometry (with rounded corners)
```

---

### **1. Node Class** (`src/core/Node.ts`)

```text
Node
  - id: string
  - layer: integer                  // zoom/abstraction level
  - attributes: object              // user-defined (colour, cornerRadius, domain metadata)
  - selected: boolean
  - visible: boolean
  - shape: 'circle' | 'rectangle'
  - shapeObject: Shape              // polymorphic geometry handler
  - radius, width, height: number
  - x, y, vx, vy: number            // position and velocity
  - methods:
      - highlight()
      - select()
      - deselect()
      - setPosition(x, y)
      - setOpacity(alpha)
      - updateAttribute(key, value)
      - getVisibility(zoomLevel)
```

---

### **2. Edge Class** (`src/core/Edge.ts`)

```text
Edge
  - id: string
  - source: Node
  - target: Node
  - sourceModule, targetModule: Module  // for hierarchical edges
  - attributes: object              // user-defined (weight, style, type)
  - hidden: boolean
  - methods:
      - highlight()
      - setOpacity(alpha)
      - updateAttribute(key, value)
```

---

### **3. HyperEdge Class** (`src/core/HyperEdge.ts`)

```text
HyperEdge extends Edge
  - supports multiple sources and targets
  - dynamic summarization when nodes/modules collapse
  - methods:
      - summarizeEdge(newSources, newTargets)
      - expandEdge()
```

---

### **4. Module Class** (`src/core/Module.ts`)

```text
Module extends Node
  - children: Node[]               // children (can be Modules recursively)
  - edges: Edge[]                  // internal edges
  - hyperEdges: HyperEdge[]
  - summaryEdges: Edge[]           // edges connecting outside modules
  - collapsed: boolean
  - methods:
      - collapse()
      - expand()
      - updateSummaryEdges()
      - setLayer(level)
      - getLeafNodes()             // recursive leaf collection
      - getAllModules()            // recursive module collection
      - getVisibleChildren()       // collapse-aware visibility
```

---

### **5. Shape System** (`src/shapes/`)

```text
Shape (abstract)
  - getRandomInteriorPoint(centerX, centerY) → {x, y}
  - getBorderPoint(centerX, centerY, targetX, targetY) → {x, y}
  - isInside(pointX, pointY, centerX, centerY) → boolean
  - enforceConstraint(pointX, pointY, vx, vy, centerX, centerY, margin) → {x, y, vx, vy}?

CircleShape extends Shape
  - radius: number
  - implements all geometry methods for circles

RectangleShape extends Shape
  - width, height: number
  - cornerRadius: number           // visual only, not physics
  - implements all geometry methods for rectangles
```

**Integration:**
- `Node.shapeObject` provides polymorphic geometry calculations
- Physics engine uses `shapeObject.enforceConstraint()` for boundaries
- Renderer uses `shapeObject.getBorderPoint()` for edge connections
- Module initialization uses `shapeObject.getRandomInteriorPoint()`

---

### **6. Graph Manager** (`src/managers/GraphManager.ts`)

```text
GraphManager
  - nodes: Node[]
  - edges: Edge[]
  - modules: Module[]
  - renderer: Renderer
  - physicsEngine: PhysicsEngine
  - interactionManager: InteractionManager
  - zoomManager: ZoomManager
  - methods:
      - addNode(node)
      - removeNode(node)
      - addEdge(edge)
      - removeEdge(edge)
      - addModule(module)
      - getVisibleNodes()          // layer + collapse aware
      - getVisibleEdges()          // hierarchical edge filtering
      - update()                   // main render loop
      - collapseModule(module)
      - expandModule(module)
```

---

### **7. Physics Engine** (`src/managers/PhysicsEngine.ts`)

**Stratified Physics Architecture:**
- Module-level physics: modules repel each other
- Internal physics: each module runs independent simulation for children
- Hard boundary constraints: teleportation + velocity reflection

```text
PhysicsEngine
  - nodes, edges, modules
  - damping: 0.92
  - repulsionStrength: 80
  - methods:
      - init(nodes, edges, hyperEdges, modules)
      - simulationStep()
          → module-level physics
          → simulateModuleInternal() per module
      - simulateModuleInternal(module)
          → child-child repulsion (isolated)
          → edge attractions (within module)
          → enforceModuleBoundary() (hard constraint)
      - enforceModuleBoundary(child, module)
          → uses module.shapeObject.enforceConstraint()
      - applyRepulsion(node1, node2, strength)
      - applyAttraction(edge)
```

---

### **8. Interaction Manager** (`src/managers/InteractionManager.ts`)

```text
InteractionManager
  - selectedNodes: Node[]
  - draggedNode: Node?
  - pinnedNodes: Set<Node>         // prevents physics updates
  - methods:
      - selectNode(node, multi=false)
      - deselectNode(node)
      - hoverNode(node)
      - dragNode(node)              // sets pinned during drag
      - endDrag(node)
      - handleCanvasDrag()          // pan camera
      - on(event, callback)
```

---

### **9. Renderer** (`src/rendering/Renderer.ts`)

**Pixi.js GPU-Accelerated Rendering:**
- WebGL Graphics objects cached per node/edge
- Container hierarchy: worldContainer → edgeContainer, nodeContainer, labelContainer
- Camera transform via worldContainer.position

```text
Renderer
  - app: Pixi.Application
  - worldContainer: Container
  - nodeGraphics: Map<Node, Graphics>
  - edgeGraphics: Map<Edge, Graphics>
  - nodeLabels: Map<Node, Text>
  - methods:
      - init()
      - clear()
      - drawNode(node)
          → uses node.shapeObject for geometry
          → supports rounded corners via attributes.cornerRadius
      - drawEdge(edge, modules)
          → detects cross-module edges
          → draws 3-segment branching (node → module border → module border → node)
          → uses shapeObject.getBorderPoint() for connections
      - drawModule(module)
          → supports rounded corners
      - getEdgeConnectionPoint(fromNode, toNode)
          → delegates to fromNode.shapeObject.getBorderPoint()
      - setCamera(offsetX, offsetY, scale)
      - resize()
```

**Hierarchical Edge Visualization:**
- Intra-module edges: direct connection
- Cross-module edges: 3 segments with border intersection points
  1. Source node → source module border
  2. Source module border → target module border (thicker)
  3. Target module border → target node

---

### **10. Zoom Manager** (`src/managers/ZoomManager.ts`)

```text
ZoomManager
  - zoomLevel: float
  - minZoom, maxZoom
  - methods:
      - setZoom(level)
      - getNodeVisibility(node)    // layer-based opacity
      - handleWheel(event)
```

---

### **11. Typical Flow**

1. Initialize **GraphManager** with domain-agnostic nodes/edges
2. Create **modules** hierarchically with shape properties
3. Bind **interactions** via InteractionManager (drag, select, pan)
4. Initialize **physics** with modular constraints
5. **Render loop**: 
   - PhysicsEngine.simulationStep()
   - Renderer draws all visible elements
   - Shape system handles all geometry calculations
6. **Zoom events** → opacity transitions, module expand/collapse
7. **Dynamic updates**: add/remove nodes, edges, modules at runtime

---

**Key Features:**

* **GPU-accelerated rendering**: Pixi.js WebGL with cached Graphics objects
* **Polymorphic shape system**: OOP geometry abstraction (circle, rectangle + rounded corners)
* **Stratified physics**: module-level + independent internal simulations
* **Hard boundary constraints**: teleportation with velocity reflection
* **Hierarchical edge visualization**: automatic branching at module borders
* **Fully generic**: domain-agnostic node/edge attributes
* **Modular architecture**: clean separation (core/managers/rendering/shapes)

---
