# ARCHITECTURE.md

---

### **1. Node Class**

```text
Node
  - id: string
  - layer: integer                  // zoom/abstraction level
  - attributes: object              // user-defined (shape, color, mass, priority, domain-specific metadata)
  - selected: boolean
  - visible: boolean
  - methods:
      - highlight()
      - select()
      - deselect()
      - setPosition(x, y)
      - setOpacity(alpha)
      - updateAttribute(key, value)
```

---

### **2. Edge Class**

```text
Edge
  - id: string
  - source: Node | Node[]
  - target: Node | Node[]
  - attributes: object              // user-defined (weight, style, semantic type)
  - hidden: boolean
  - methods:
      - highlight()
      - setOpacity(alpha)
      - updateAttribute(key, value)
```

---

### **3. HyperEdge Class**

```text
HyperEdge extends Edge
  - supports multiple sources and targets
  - dynamic summarization when nodes/modules collapse
  - methods:
      - summarizeEdge(newSources, newTargets)
      - expandEdge()
```

---

### **4. Module Class**

```text
Module extends Node
  - nodes: Node[]                  // children
  - edges: Edge[]                  // internal edges
  - summaryEdges: Edge[]           // edges connecting outside modules
  - collapsed: boolean
  - methods:
      - collapse()
      - expand()
      - updateSummaryEdges()
      - setLayer(level)
```

---

### **5. Graph / Scene Manager**

```text
GraphManager / Scene
  - nodes: Node[]
  - edges: Edge[]
  - modules: Module[]
  - layers: integer
  - viewport: Pixi.js viewport or equivalent
  - physicsEngine: d3-force or cola.js
  - zoomLevel: float
  - methods:
      - addNode(node)
      - removeNode(node)
      - addEdge(edge)
      - removeEdge(edge)
      - addModule(module)
      - removeModule(module)
      - updatePhysics()
      - setZoom(level)
      - applyLayerVisibility()
      - collapseModule(module)
      - expandModule(module)
      - bindInteractions()  // hover, drag, multi-select
```

---

### **6. Interaction Manager**

```text
InteractionManager
  - selectedNodes: Node[]
  - selectedModules: Module[]
  - methods:
      - selectNode(node, multi=false)
      - deselectNode(node)
      - selectModule(module, multi=false)
      - hoverNode(node)
      - hoverEdge(edge)
      - dragNode(node)
      - dragModule(module)
      - on(event, callback)  // e.g., nodeHover, nodeClick, zoomChange
```

---

### **7. Renderer**

```text
Renderer
  - engine: Pixi.js
  - drawNode(node)
  - drawEdge(edge)
  - drawModule(module)
  - updatePositions(nodes)
  - updateStyles(nodes, edges)
  - animateZoomTransition(startLevel, endLevel)
```

---

### **8. Zoom / Layer Manager**

```text
ZoomManager
  - zoomLevel: float
  - minZoom, maxZoom
  - layerMap: Node/Edge visibility per zoom
  - methods:
      - setZoom(level)
      - getVisibleNodes()
      - getVisibleEdges()
      - interpolateOpacity()
      - triggerModuleExpandCollapse()
```

---

### **9. Typical Flow**

1. Initialize **GraphManager** with user-provided nodes/edges (any domain).
2. Create **modules** hierarchically (abstract layers).
3. Bind **interactions** using InteractionManager.
4. Apply **physics layout** (d3-force/cola.js).
5. Render via **Renderer**, layer-aware.
6. **Zoom events** handled by ZoomManager → smooth visibility and module expansion.
7. **Dynamic updates**: add/remove nodes, hyperedges, or modules at runtime.

---

**Key Features:**

* Fully **generic and domain-agnostic**: no fixed node or edge types.
* **Hyperedge support** for multi-source/target connections.
* **Hierarchical modules** for multi-scale abstraction.
* **Physics-based layout** with optional priority/weighting.
* **Rich interactivity**: drag, hover, multi-selection, module collapsing.
* **Zoom-aware rendering**: smooth opacity transitions, dynamic summarization.

---
