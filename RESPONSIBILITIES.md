# Class Responsibilities - Current vs Proposed

## Current State (Messy)

### ScaleBar.ts
**Currently does**:
- Calculates layer positions (zoom coordinates)
- Calculates layer spacings
- `getLayerWindow()` - returns scale-based visibility windows
- `isLayerVisible()` - visibility check in scale space
- `getNormalisedFadeParameter()` - fade amount in scale space
- `getLabelSwitchZoom()` - where to switch label position

**Problem**: Visibility logic mixed with coordinate conversion

### LayerDetailManager.ts
**Currently does**:
- Manages layer metadata
- `getDetailStateAtZoom()` - computes DetailState (opacity, showChildren, labelInside, etc.)
- Calls ScaleBar methods to get visibility and fade parameters
- Interprets fade parameters to determine mode properties

**Problem**: Depends on ScaleBar for low-level visibility, does mode calculation here

### Renderer.ts
**Currently does**:
- Takes DetailState from LayerDetailManager
- Applies opacity from DetailState
- Applies backgroundOpacity from DetailState
- Applies labelInside from DetailState
- Applies showBorder from DetailState
- Applies showChildren via parent's showChildren
- Calls `getChildNodeOpacity()` if no DetailState

**Problem**: Rendering logic correct but depends on DetailState being complete

---

## Proposed Clean Architecture

### ✅ **ScaleBar.ts** - Coordinate & Window Management

**Responsibility**: Convert between zoom/scale coordinates and provide geometry of layer windows

**Public API** (zoom-based, no conversion headaches):

```typescript
// Layer positioning
getOptimalZoomForLayer(layer: number): number

// Window geometry in zoom space
getLayerWindowZoom(layer: number): { minZoom: number; maxZoom: number }

// NEW: Segment boundaries for presentation modes
getLayerWindowSegments(layer: number): LayerWindowSegments
// Returns: { fadingInMin, expandedMin, expandedMax, collapsingMax, fadingOutMax }

// Backward compatibility (scale-based API)
getLayerWindow(layer: number): { minScale: number; maxScale: number }
  // Internally converts from zoom window
```

**NOT responsible for**:
- ❌ Determining visibility (that's LayerDetailManager's job)
- ❌ Computing presentation modes (that's LayerDetailManager's job)
- ❌ Fade parameters or mode-dependent properties

**Lifecycle**:
- Built once after graph loaded
- Never changes during zoom animations

---

### ✅ **LayerDetailManager.ts** - Visibility & Presentation State

**Responsibility**: Determine what to render and how to render it at any zoom level

**Input**: `zoomLevel: number` (camera position)

**Output**: `DetailState` with all necessary rendering parameters

**Logic flow**:

```typescript
getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
    // 1. Get segment boundaries from ScaleBar
    const segments = this.scaleBar.getLayerWindowSegments(entity.layer);
    
    // 2. Determine which presentation mode entity is in
    const mode = this.determinePresentationMode(zoomLevel, segments);
    // Returns: INVISIBLE | FADING_IN | EXPANDED | COLLAPSING | FADING_OUT
    
    // 3. Return mode-derived properties in DetailState
    return {
        visible: mode !== INVISIBLE,
        opacity: this.getOpacityForMode(mode, zoomLevel, segments),
        showBorder: this.getShowBorderForMode(mode),
        backgroundOpacity: this.getBackgroundOpacityForMode(mode),
        labelInside: this.getLabelInsideForMode(mode),
        showChildren: this.getShowChildrenForMode(mode),
        collapseState: this.getCollapseStateForMode(mode)
    };
}

// Helper: Determine which segment zoomLevel falls in
private determinePresentationMode(
    zoomLevel: number, 
    segments: LayerWindowSegments
): PresentationMode {
    const scale = Math.pow(2, -zoomLevel);
    
    if (scale < 2^(-segments.fadingInMin)) return INVISIBLE;
    if (scale < 2^(-segments.expandedMin)) return FADING_IN;
    if (scale < 2^(-segments.expandedMax)) return EXPANDED;
    if (scale < 2^(-segments.collapsingMax)) return COLLAPSING;
    if (scale < 2^(-segments.fadingOutMax)) return FADING_OUT;
    return INVISIBLE;
}
```

**Mode → Property mapping**:

| Mode | visible | opacity | background | label | children | border |
|------|---------|---------|-----------|-------|----------|--------|
| INVISIBLE | false | 0 | 0 | — | false | false |
| FADING_IN | true | 0→1 | 0 | outside | false | false |
| EXPANDED | true | 1 | 0.15 | outside | true | true |
| COLLAPSING | true | 1→0 | 1 | inside | false | true |
| FADING_OUT | true | 0→1 | 1 | inside | false | false |

**NOT responsible for**:
- ❌ Rendering (that's Renderer's job)
- ❌ Coordinate conversion (that's ScaleBar's job)
- ❌ Actually applying opacity/colors (that's Renderer's job)

---

### ✅ **Renderer.ts** - Visual Output

**Responsibility**: Take a DetailState and draw it

**Input**: `entity: Entity, detailState: DetailState`

**Output**: Graphics on screen

**Simple flow**:

```typescript
drawNode(node: Entity, detailState: DetailState): void {
    const graphics = this.getOrCreateGraphics(node);
    
    // Apply all DetailState properties directly
    graphics.alpha = detailState.opacity * node.alpha;
    node.shapeObject.draw(graphics, node.x, node.y, colour, 
                          detailState.backgroundOpacity, screenSize);
    
    if (detailState.showBorder) {
        node.shapeObject.drawStroke(...);
    }
    
    // Label positioning from DetailState
    const labelTransform = LabelRenderer.getNodeLabelTransform(
        node, 
        detailState.labelInside  // ← Use this boolean directly
    );
    
    const label = this.updateLabel(...);
    label.position.set(labelTransform.worldX, labelTransform.worldY);
    label.alpha = detailState.opacity * node.alpha;
}

drawConnection(connection: Connection, detailState: DetailState): void {
    const graphics = this.getOrCreateGraphics(connection);
    graphics.alpha = detailState.opacity * connection.alpha;
    // ... draw normally
}
```

**NOT responsible for**:
- ❌ Determining visibility (that's LayerDetailManager's job)
- ❌ Computing opacity (that's LayerDetailManager's job)
- ❌ Figuring out label position logic (that's DetailState's job)

---

### ✅ **LabelRenderer.ts** - Label Positioning Helper

**Responsibility**: Convert presentation mode to label position

**Input**: `entity: Entity, labelInside: boolean` (from DetailState)

**Output**: `{ fontSize, worldX, worldY }`

```typescript
static getNodeLabelTransform(entity: Entity, labelInside: boolean) {
    const fontSize = CONFIG.LABEL_FONT_SIZE * entity.getCumulativeScale();
    
    if (labelInside) {
        return {
            fontSize,
            worldX: entity.x,
            worldY: entity.y,  // Center on node
        };
    } else {
        return {
            fontSize,
            worldX: entity.x,
            worldY: entity.y - entity.getWorldSize() * 1.5,  // Above node
        };
    }
}
```

---

## Call Chain for Rendering

```
GraphManager.update()
    ↓
    for each visible entity:
        ↓
        layerDetailManager.getDetailStateAtZoom(entity, currentZoom)
            ↓
            scaleBar.getLayerWindowSegments(entity.layer)
            ↓
            returns DetailState { visible, opacity, labelInside, ... }
        ↓
        renderer.drawNode(entity, detailState)
            ↓
            labelRenderer.getNodeLabelTransform(entity, detailState.labelInside)
            ↓
            applies detailState.opacity, detailState.backgroundOpacity, etc.
            ↓
            draws graphics
```

---

## Data Flow

### Before (Messy)

```
GraphManager
    → needs to know what's visible
    → calls LayerDetailManager.getVisibleEntities()
    → LayerDetailManager calls ScaleBar.isLayerVisible()
    → ScaleBar returns binary visibility

GraphManager
    → for rendering, calls LayerDetailManager.getDetailStateAtZoom()
    → LayerDetailManager calls ScaleBar.getNormalisedFadeParameter()
    → LayerDetailManager computes opacity from fade parameter
    → returns DetailState

Renderer
    → takes DetailState
    → applies all properties
    → but also has to know about labelInside logic?
```

### After (Clean)

```
ScaleBar (one-time init)
    → computes layer positions, spacing, segment boundaries
    → stores in layerWindowSegments cache
    → never changes

LayerDetailManager (per frame, per entity)
    → gets zoomLevel from camera
    → for each entity:
        → queries scaleBar.getLayerWindowSegments()
        → determines presentation mode
        → computes all properties from mode
        → returns complete DetailState

Renderer (per frame, per entity)
    → gets DetailState
    → applies properties mechanically
    → done
```

---

## Type Definitions Needed

```typescript
// Presentation mode enum
enum PresentationMode {
    INVISIBLE = 'INVISIBLE',
    FADING_IN = 'FADING_IN',
    EXPANDED = 'EXPANDED',
    COLLAPSING = 'COLLAPSING',
    FADING_OUT = 'FADING_OUT',
}

// Layer window segment boundaries
interface LayerWindowSegments {
    fadingInMin: number;      // min zoom (scale coordinate) for FADING_IN start
    expandedMin: number;      // start of EXPANDED segment
    expandedMax: number;      // end of EXPANDED segment (optimal centered between min/max)
    collapsingMax: number;    // end of COLLAPSING segment (= next layer's fadingInMin)
    fadingOutMax: number;     // end of FADING_OUT segment (can be -Infinity)
}

// Already exists, will be enhanced
interface DetailState {
    visible: boolean;
    opacity: number;
    showBorder: boolean;
    backgroundOpacity: number;
    labelInside: boolean;
    showChildren: boolean;
    collapseState: number;
    // NEW (optional):
    // presentationMode?: PresentationMode;  // For debugging
}
```

---

## Benefits of This Architecture

✅ **Single Responsibility**: Each class has one clear job

✅ **Testability**: Can test mode logic independently of rendering

✅ **Clarity**: Looking at code, obvious who computes what

✅ **Composability**: DetailState is a complete package, can be cached/debugged easily

✅ **Extensibility**: Adding new presentation modes only affects LayerDetailManager

✅ **No Bidirectional Conversion**: ScaleBar stays in zoom space internally

✅ **Mode-Based**: All properties derive from mode, can reason about system holistically
