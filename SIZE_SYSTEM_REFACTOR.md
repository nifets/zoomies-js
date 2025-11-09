# Size System Refactor Implementation Plan

## Overview
Replace absolute pixel sizes with Shape-based geometry + dual world/screen sizing for scalability and memory safety.

**Document Version:** 2.0 (includes label system integration + edge rendering future-proofing)

## Problem Statement
Current system uses absolute pixel sizes stored in Entity/Connection attributes. With deep hierarchies and layer scaling, this causes:
- Exponential texture memory growth
- WebGPU texture size limit exceeded (8192×8192)
- No principled relationship between entity sizes and viewport
- Manual area calculations scattered throughout codebase

## Solution: Shape-Centric Architecture

**Shape handles ALL geometry and scaling:**
- **Normalized geometry**: Shape stores dimensions in abstract coordinate space (radius: 1.0, width: 1.2)
- **World-space methods**: `getWorldSize(baseScale, cumulativeScale)` for physics
- **Screen-space methods**: `getScreenSize(baseScale, cumulativeScale, cameraScale)` for rendering
- **Area calculations**: `getArea()` returns normalized area, `getWorldArea()` returns scaled area
- **Shape owns sizing logic**: Entity/Connection just delegate to their shapes

**Coordinate System Convention:**
- **Prefix all coordinate variables** with their space: `worldX`, `screenX`, `normalizedRadius`
- **World space**: Physics simulation coordinates (entity positions, sizes for collision)
- **Screen space**: Pixel coordinates on canvas (rendering, NOT for hit detection)
- **Normalized space**: Abstract coordinates (1.0 = base size, stored in shapes)

**Benefits:**
- Shape knows its own geometry (area, diameter, border points)
- All size scaling logic centralized in Shape
- Physics and rendering both use Shape methods
- Easy to add new shape types with custom geometry
- **Explicit coordinate spaces prevent confusion**

---

## Changes Required

### 1. Update Shape Classes with Size Methods
**File:** `src/shapes/Shape.ts`

**Add abstract methods for geometry and scaling:**
```typescript
export abstract class Shape {
    /**
     * Get normalized area (in abstract coordinate space).
     */
    abstract getArea(): number;
    
    /**
     * Get normalized diameter/bounding size (in abstract coordinate space).
     */
    abstract getDiameter(): number;
    
    /**
     * Get world-space size (for physics).
     * @param baseScale - CONFIG.DEFAULT_NODE_RADIUS
     * @param cumulativeScale - Product of layer relative scales
     */
    getWorldSize(baseScale: number, cumulativeScale: number): number {
        return (this.getDiameter() * baseScale) / cumulativeScale;
    }
    
    /**
     * Get world-space area (for validation, composite sizing).
     * Area scales with size squared.
     */
    getWorldArea(baseScale: number, cumulativeScale: number): number {
        const normalizedArea = this.getArea();
        const scaleFactor = baseScale / cumulativeScale;
        return normalizedArea * scaleFactor * scaleFactor;
    }
    
    /**
     * Get screen-space size (for rendering).
     * @param cameraScale - Renderer.scale (NOT logarithmic zoom level)
     */
    getScreenSize(baseScale: number, cumulativeScale: number, cameraScale: number): number {
        return this.getWorldSize(baseScale, cumulativeScale) / cameraScale;
    }
    
    /**
     * Get border point at angle (normalized coordinates).
     */
    abstract getBorderPoint(angle: number): { x: number; y: number };
    
    /**
     * Check if point is inside shape (world-space coordinates).
     * COORDINATE SYSTEM: WORLD SPACE
     * - All positions and sizes in physics simulation coordinates
     * - Used for hit detection (mouse clicks transformed to world space first)
     * 
     * @param worldPointX - Point X in world space
     * @param worldPointY - Point Y in world space
     * @param worldCenterX - Shape center X in world space
     * @param worldCenterY - Shape center Y in world space
     * @param worldSize - Pre-computed world size (diameter, in world space)
     */
    abstract isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean;
    
    /**
     * Check if point is inside interactive hitbox (world-space, for clicking).
     * COORDINATE SYSTEM: WORLD SPACE
     * Can be larger than visual bounds for better UX.
     * 
     * @param worldPointX - Click position X in world space
     * @param worldPointY - Click position Y in world space
     * @param worldCenterX - Entity center X in world space
     * @param worldCenterY - Entity center Y in world space
     * @param worldSize - Pre-computed world size (diameter)
     */
    containsPoint(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        // Default: hitbox is 110% of visual size for easier clicking
        const expandedWorldSize = worldSize * 1.1;
        return this.isInside(worldPointX, worldPointY, worldCenterX, worldCenterY, expandedWorldSize);
    }
    
    /**
     * Draw the shape at given screen size.
     * @param graphics - PixiJS Graphics object
     * @param screenSize - Pre-computed screen size (diameter)
     */
    abstract draw(graphics: any, screenSize: number): void;
}
```

---

### 2. Update CircleShape
**File:** `src/shapes/CircleShape.ts`

**Implement geometry methods:**
```typescript
export class CircleShape extends Shape {
    constructor(private radius: number) {
        super();
    }
    
    getArea(): number {
        return Math.PI * this.radius * this.radius;
    }
    
    getDiameter(): number {
        return this.radius * 2;
    }
    
    getBorderPoint(angle: number): { x: number; y: number } {
        return {
            x: Math.cos(angle) * this.radius,
            y: Math.sin(angle) * this.radius
        };
    }
    
    isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        // COORDINATE SYSTEM: WORLD SPACE
        const worldDx = worldPointX - worldCenterX;
        const worldDy = worldPointY - worldCenterY;
        const worldRadius = worldSize / 2;
        const worldDistance = Math.hypot(worldDx, worldDy);
        return worldDistance <= worldRadius;
    }
    
    draw(graphics: any, screenSize: number): void {
        const screenRadius = screenSize / 2;
        graphics.circle(0, 0, screenRadius);
    }
}
```

---

### 3. Update RectangleShape
**File:** `src/shapes/RectangleShape.ts`

**Implement geometry methods:**
```typescript
export class RectangleShape extends Shape {
    constructor(private width: number, private height: number) {
        super();
    }
    
    getArea(): number {
        return this.width * this.height;
    }
    
    getDiameter(): number {
        // Bounding circle diameter
        return Math.sqrt(this.width ** 2 + this.height ** 2);
    }
    
    getBorderPoint(angle: number): { x: number; y: number } {
        // ...existing implementation (unchanged)
    }
    
    isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        // COORDINATE SYSTEM: WORLD SPACE
        // Scale normalized width/height to world size
        const normalizedDiameter = this.getDiameter();
        const worldScale = worldSize / normalizedDiameter;
        const worldWidth = this.width * worldScale;
        const worldHeight = this.height * worldScale;
        
        const worldDx = worldPointX - worldCenterX;
        const worldDy = worldPointY - worldCenterY;
        
        return Math.abs(worldDx) <= worldWidth / 2 && Math.abs(worldDy) <= worldHeight / 2;
    }
    
    draw(graphics: any, screenSize: number): void {
        // Scale width/height proportionally
        const scale = screenSize / this.getDiameter();
        const screenWidth = this.width * scale;
        const screenHeight = this.height * scale;
        
        graphics.rect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
    }
}
```

---

### 4. Update Entity to Use Shape Methods
**File:** `src/core/Entity.ts`

**Delegate to Shape for all sizing:**
```typescript
export class Entity {
    // ...existing properties
    private cumulativeLayerScale: number = 1.0;
    shapeObject: Shape;  // Already exists!
    
    /**
     * Inject cumulative layer scale from GraphManager.
     */
    setCumulativeScale(cumulativeLayerScale: number): void {
        this.cumulativeLayerScale = cumulativeLayerScale;
    }
    
    /**
     * Get world-space size (for physics).
     * Delegates to Shape.
     */
    getWorldSize(): number {
        return this.shapeObject.getWorldSize(
            CONFIG.DEFAULT_NODE_RADIUS,
            this.cumulativeLayerScale
        );
    }
    
    /**
     * Get world-space area (for validation).
     * Delegates to Shape.
     */
    getWorldArea(): number {
        return this.shapeObject.getWorldArea(
            CONFIG.DEFAULT_NODE_RADIUS,
            this.cumulativeLayerScale
        );
    }
    
    /**
     * Get screen-space size (for rendering).
     * @param cameraScale - Renderer.scale
     */
    getScreenSize(cameraScale: number): number {
        return this.shapeObject.getScreenSize(
            CONFIG.DEFAULT_NODE_RADIUS,
            this.cumulativeLayerScale,
            cameraScale
        );
    }
    
    /**
     * Check if point is inside entity hitbox (for hit detection).
     * COORDINATE SYSTEM: WORLD SPACE
     * - Mouse clicks are transformed to world space before calling this
     * - Entity positions (this.x, this.y) are in world space
     * - Uses world-space size for hit testing
     * 
     * @param worldPointX - Click position X in world space (from getWorldCoords)
     * @param worldPointY - Click position Y in world space (from getWorldCoords)
     */
    containsPoint(worldPointX: number, worldPointY: number): boolean {
        const worldSize = this.getWorldSize();
        return this.shapeObject.containsPoint(
            worldPointX,
            worldPointY,
            this.x,  // entity center X in world space
            this.y,  // entity center Y in world space
            worldSize
        );
    }
}
```

---

### 5. Create EdgeShape for Connections
**File:** `src/shapes/EdgeShape.ts` (NEW FILE)

**New shape class for edges:**
```typescript
import { Shape } from './Shape';

export class EdgeShape extends Shape {
    constructor(private width: number = 1.0) {
        super();
    }
    
    getArea(): number {
        // Edges don't have area, return 0
        return 0;
    }
    
    getDiameter(): number {
        // Return width as "size"
        return this.width;
    }
    
    getWorldSize(baseScale: number, cumulativeScale: number): number {
        // Use DEFAULT_EDGE_WIDTH as base scale
        return (this.width * baseScale) / cumulativeScale;
    }
    
    getBorderPoint(angle: number): { x: number; y: number } {
        // Not applicable for edges
        return { x: 0, y: 0 };
    }
    
    isInside(x: number, y: number): boolean {
        // Not applicable for edges
        return false;
    }
    
    draw(graphics: any, screenSize: number): void {
        // Edges are drawn differently (line from source to target)
        // This method not used for edges - drawing handled by Renderer
    }
}
```

---

### 6. Update Connection to Use EdgeShape
**File:** `src/core/Connection.ts`

**Add EdgeShape and delegate sizing:**
```typescript
import { EdgeShape } from '../shapes/EdgeShape';
import { CONFIG } from '../config';

export class Connection {
    // ...existing properties
    private cumulativeLayerScale: number = 1.0;
    private edgeShape: EdgeShape;
    
    constructor(id: string, source: Entity[], target: Entity[], attributes: ConnectionAttributes = {}) {
        // ...existing code
        
        const normalizedWidth = attributes.width ?? 1.0;
        this.edgeShape = new EdgeShape(normalizedWidth);
    }
    
    /**
     * Inject cumulative layer scale from GraphManager.
     */
    setCumulativeScale(cumulativeLayerScale: number): void {
        this.cumulativeLayerScale = cumulativeLayerScale;
    }
    
    /**
     * Get cached cumulative layer scale (for rendering).
     */
    getCumulativeScale(): number {
        return this.cumulativeLayerScale;
    }
    
    /**
     * Get world-space width (for rendering).
     */
    getWorldWidth(): number {
        return this.edgeShape.getWorldSize(
            CONFIG.DEFAULT_EDGE_WIDTH,
            this.cumulativeLayerScale
        );
    }
    
    /**
     * Get screen-space width (for rendering).
     * @param cameraScale - Renderer.scale
     */
    getScreenWidth(cameraScale: number): number {
        return this.edgeShape.getScreenSize(
            CONFIG.DEFAULT_EDGE_WIDTH,
            this.cumulativeLayerScale,
            cameraScale
        );
    }
}
```

**Note:** Added `getCumulativeScale()` getter for consistency with Entity (needed by edge label renderer).

---

### 7. Update GraphManager Hit Detection
**File:** `src/managers/GraphManager.ts`

**Update containsPoint() call with explicit coordinate system:**
```typescript
// In getWorldCoords() helper (line ~510)
const getWorldCoords = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    // SCREEN SPACE: Pixel coordinates on canvas
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    
    // Transform SCREEN → WORLD
    const worldX = (screenX - this.renderer.offsetX) / this.renderer.scale;
    const worldY = (screenY - this.renderer.offsetY) / this.renderer.scale;
    return { worldX, worldY };
};

// In getEntityAtPoint() function (line ~544)
const getEntityAtPoint = (worldX: number, worldY: number): Entity | null => {
    // COORDINATE SYSTEM: WORLD SPACE
    // worldX, worldY are already transformed from screen space
    
    for (const entity of this.getAllEntities()) {
        // ...visibility checks
        
        // OLD: entity.shapeObject.containsPoint(worldX, worldY, entity.x, entity.y)
        // NEW: Use entity.containsPoint() which handles worldSize internally
        if (!entity.containsPoint(worldX, worldY)) {  // All in world space!
            continue;
        }
        
        // ...distance sorting
    }
}
```

**Why this change:**
- **Explicit coordinate spaces**: screenX/worldX naming makes it clear
- **Single transformation**: Screen → World happens once, not per entity
- **Correct hit detection**: Entity.containsPoint() uses world-space size
- **Comment annotations**: Makes coordinate system obvious to future readers

---

### 8. Update GraphManager to Inject Scale Factors
**File:** `src/managers/GraphManager.ts`

**Replace shape recreation with scale injection:**
```typescript
export class GraphManager {
    buildGraph() {
        // ...existing code
        
        // OLD (line ~122): entity.recreateShapeAtScale(scaleFactor);
        // NEW: Inject cumulative scale instead of recreating shapes
        for (const entity of this.entities) {
            const cumulativeScale = this.getCumulativeScale(entity.layer);
            entity.setCumulativeScale(cumulativeScale);
            
            // Update label size (still needed for font scaling)
            entity.labelSize = CONFIG.LABEL_FONT_SIZE * scaleFactor;
        }
        
        // Inject cumulative scale into all connections
        for (const connection of this.connections) {
            const layer = connection.source[0]?.layer ?? 0;
            const cumulativeScale = this.getCumulativeScale(layer);
            connection.setCumulativeScale(cumulativeScale);
        }
        
        // ...rest of buildGraph
    }
    
    /**
     * Calculate cumulative scale factor for a layer.
     * Product of relativeScale from layer 0 to target layer.
     */
    private getCumulativeScale(layer: number): number {
        if (!this.layerDetailManager) return 1.0;
        
        let cumulative = 1.0;
        for (let i = 0; i <= layer; i++) {
            const metadata = this.layerDetailManager.getLayerMetadata(i);
            const relativeScale = metadata?.relativeScale ?? 1.0;
            cumulative *= relativeScale;
        }
        return cumulative;
    }
}
```

---

### 8. Update PhysicsEngine
**File:** `src/managers/PhysicsEngine.ts`

**Replace all `shapeObject.getDiameter()` calls with `entity.getWorldSize()`:**
```typescript
export class PhysicsEngine {
    // No constructor changes needed
    
    private applyRepulsionForces(node: Entity, other: Entity): void {
        // ...existing distance calculations
        
        // OLD: const aRadius = a.shapeObject.getDiameter() / 2;
        // NEW:
        const radius1 = node.getWorldSize() / 2;  // getWorldSize() returns diameter equivalent
        const radius2 = other.getWorldSize() / 2;
        const minDistance = (radius1 + radius2) * CONFIG.PHYSICS.minNodeDistanceMultiplier;
        
        // ...rest of force calculations using world sizes
    }
    
    // Find and replace ALL instances (lines ~311, 381, 403, 490-491):
    // - entity.shapeObject.getDiameter() → entity.getWorldSize()
    // - entity.shapeObject.getDiameter() / 2 → entity.getWorldSize() / 2
}
```

---

### 9. Update Renderer
**File:** `src/rendering/Renderer.ts`

**Replace size calculations with entity/connection methods:**
```typescript
export class Renderer {
    // No constructor changes needed
    
    private drawNode(node: Entity): void {
        // COORDINATE SYSTEM: Mixed (world position, screen size)
        
        // OLD (line ~192): const diameter = node.shapeObject.getDiameter();
        // NEW: Get SCREEN size from entity (for rendering)
        const screenSize = node.getScreenSize(this.scale);
        
        // Adjust texture resolution based on screen size
        const resolution = Math.max(1, Math.min(4, screenSize / 100));
        
        // Use shape's draw method with screen size
        const graphics = this.getNodeGraphics(node);
        graphics.clear();
        
        // Shape draws at SCREEN size (pixels on canvas)
        node.shapeObject.draw(graphics, screenSize);
        graphics.fill({ color: node.attributes.colour });
        
        // Position in WORLD coordinates (PixiJS container handles world → screen transform)
        graphics.position.set(node.x, node.y);  // World space
    }
    
    private drawConnection(connection: Connection): void {
        // COORDINATE SYSTEM: SCREEN SPACE (for stroke width)
        
        // OLD (line ~232): const width = connection.attributes.width ?? 2;
        // NEW: Get SCREEN width from connection (for rendering)
        const screenWidth = connection.getScreenWidth(this.scale);
        
        // Replace all hardcoded `width` with `screenWidth`:
        // Lines affected: ~253, 266, 280, 308, 313, 318
        graphics.stroke({ width: screenWidth * 1.5 });  // selected (screen pixels)
        graphics.stroke({ width: screenWidth });  // normal (screen pixels)
    }
}
```

**Key changes:**
- Entity.getScreenSize() delegates to Shape.getScreenSize()
- Shape.draw() handles geometry-specific rendering
- Renderer just orchestrates, doesn't know shape details

---

### 10. Update validation.ts
**File:** `src/utils/validation.ts`

**Use Shape's getWorldArea() method:**
```typescript
export function validateCompositeSize(composite: Entity, config: ValidationConfig = {}): boolean {
    // ...existing checks
    
    // OLD (lines ~27-30): Manual area calculation
    // const diameter = child.shapeObject.getDiameter();
    // const radius = diameter / 2;
    // const area = Math.PI * radius * radius;
    
    // NEW: Shape knows its own area!
    const childArea = child.getWorldArea();
    childrenTotalArea += childArea;
    
    // OLD (lines ~34-36): Manual composite area calculation
    // const compositeDiameter = composite.shapeObject.getDiameter();
    // const compositeRadius = compositeDiameter / 2;
    // const compositeArea = Math.PI * compositeRadius * compositeRadius;
    
    // NEW: Shape knows its own area!
    const compositeArea = composite.getWorldArea();
    
    // Compare areas
    if (compositeArea < childrenTotalArea * minAreaMultiplier) {
        console.warn('Composite too small');
        return false;
    }
    
    return true;
}
```

**Major improvement:** Shape handles geometry (circles use π×r², rectangles use w×h), validation just compares.

---

### 11. Update GraphManager.ts (Right-Click Handler)
**File:** `src/managers/GraphManager.ts`

**Replace getDiameter() in right-click hit detection:**
```typescript
export class GraphManager {
    private setupEventListeners(): void {
        // ...existing code
        
        this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
            // ...get world coordinates
            
            for (const composite of this.getAllComposites()) {
                const dist = Math.hypot(composite.x - worldX, composite.y - worldY);
                
                // OLD (line ~621): const diameter = composite.shapeObject.getDiameter();
                // NEW:
                const diameter = composite.getWorldSize();
                const radius = diameter / 2;
                if (dist < radius * 1.5 * 2) {
                    // collapse/expand logic
                }
            }
        });
    }
}
```

**Why world size?** Click coordinates from `getWorldCoords()` are in world space.

---

### 12. Update Config
**File:** `src/config.ts`

**Add:**
```typescript
export const CONFIG = {
    // ============ RENDERING ============
    
    // Base node size (pixels at layer 0, zoom 1.0)
    DEFAULT_NODE_RADIUS: 200,
    
    // Base edge width (pixels at layer 0, zoom 1.0)
    DEFAULT_EDGE_WIDTH: 2,
    
    // ...rest of config
};
```

**Note:** DEFAULT_EDGE_WIDTH set to 2 (current default in Renderer). User can adjust this constant to change all edge widths globally.

---

### 13. Future-Proof Edge Rendering (Optional Enhancement)
**File:** `src/rendering/EdgeRenderer.ts` (NEW FILE - future addition)

**Design for future curved edges and dynamic synthetic edge rendering:**

```typescript
import { Connection } from '../core/Connection';
import { Entity } from '../core/Entity';
import { Graphics } from 'pixi.js';

/**
 * Edge path specification for rendering.
 * Future-proofs for curved edges, bezier paths, etc.
 */
export interface EdgePath {
    type: 'straight' | 'curved' | 'bezier';
    points: { x: number; y: number }[];
    controlPoints?: { x: number; y: number }[];  // For bezier/curved edges
}

/**
 * Static utility class for edge rendering logic.
 * Isolates edge drawing from Renderer orchestration.
 * 
 * Design rationale:
 * - Centralizes edge drawing logic (straight, curved, synthetic branching)
 * - Makes it easy to add curved edges in future without modifying Renderer
 * - Separates path calculation from actual drawing
 * - Handles synthetic edge complexity (composite → children branching)
 */
export class EdgeRenderer {
    /**
     * Calculate edge path between two entities.
     * Currently returns straight line, but can be extended for curves.
     * 
     * @param source - Source entity
     * @param target - Target entity
     * @param curvature - Future: amount of curve (0 = straight, 1 = max curve)
     * @returns Edge path specification
     */
    static calculateEdgePath(
        source: Entity,
        target: Entity,
        curvature: number = 0
    ): EdgePath {
        const start = source.shapeObject.getBorderPoint(source.x, source.y, target.x, target.y);
        const end = target.shapeObject.getBorderPoint(target.x, target.y, source.x, source.y);
        
        // Future: if curvature > 0, calculate bezier control points
        if (curvature > 0) {
            // TODO: Calculate control points for curved edge
            // const midX = (start.x + end.x) / 2;
            // const midY = (start.y + end.y) / 2;
            // const perpX = -(end.y - start.y) * curvature;
            // const perpY = (end.x - start.x) * curvature;
            // return {
            //     type: 'bezier',
            //     points: [start, end],
            //     controlPoints: [{ x: midX + perpX, y: midY + perpY }]
            // };
        }
        
        // Default: straight line
        return {
            type: 'straight',
            points: [start, end]
        };
    }
    
    /**
     * Draw edge path on graphics context.
     * 
     * @param graphics - PixiJS Graphics object
     * @param path - Edge path specification
     * @param width - Screen-space width
     * @param colour - Edge colour (hex number)
     * @param alpha - Opacity (0-1)
     */
    static drawEdgePath(
        graphics: Graphics,
        path: EdgePath,
        width: number,
        colour: number,
        alpha: number = 1
    ): void {
        if (path.points.length < 2) return;
        
        const start = path.points[0];
        graphics.moveTo(start.x, start.y);
        
        if (path.type === 'bezier' && path.controlPoints && path.controlPoints.length > 0) {
            // Future: Draw bezier curve
            // const end = path.points[1];
            // const ctrl = path.controlPoints[0];
            // graphics.quadraticCurveTo(ctrl.x, ctrl.y, end.x, end.y);
        } else {
            // Straight line
            for (let i = 1; i < path.points.length; i++) {
                const point = path.points[i];
                graphics.lineTo(point.x, point.y);
            }
        }
        
        graphics.stroke({ color: colour, width, alpha });
    }
    
    /**
     * Draw synthetic edge with branching to child nodes.
     * Handles complex multi-segment rendering for composite connections.
     * 
     * @param graphics - PixiJS Graphics object
     * @param connection - Connection with synthetic attribute and subEdges
     * @param width - Base screen-space width
     * @param colour - Edge colour
     * @param getDetailState - Function to get child node detail state (for opacity)
     */
    static drawSyntheticEdge(
        graphics: Graphics,
        connection: Connection,
        width: number,
        colour: number,
        getDetailState: (entity: Entity) => { opacity: number }
    ): void {
        if (!connection.attributes.synthetic || connection.subEdges.length === 0) return;
        if (connection.sources.length === 0 || connection.targets.length === 0) return;
        
        const source = connection.sources[0];
        const target = connection.targets[0];
        
        // Collect unique child nodes from subEdges
        const sourceNodes = new Set<Entity>();
        const targetNodes = new Set<Entity>();
        for (const subEdge of connection.subEdges) {
            sourceNodes.add(subEdge.source);
            targetNodes.add(subEdge.target);
        }
        
        // Main edge between composites (thicker)
        const mainPath = EdgeRenderer.calculateEdgePath(source, target);
        EdgeRenderer.drawEdgePath(graphics, mainPath, width * 1.5, colour);
        
        // Branching edges from source composite to child nodes
        const sourceExit = source.shapeObject.getBorderPoint(source.x, source.y, target.x, target.y);
        for (const childNode of sourceNodes) {
            const childDetail = getDetailState(childNode);
            const childEdgePoint = childNode.shapeObject.getBorderPoint(
                childNode.x, childNode.y, target.x, target.y
            );
            
            const branchPath: EdgePath = {
                type: 'straight',
                points: [sourceExit, childEdgePoint]
            };
            EdgeRenderer.drawEdgePath(graphics, branchPath, width, colour, childDetail.opacity * 0.6);
        }
        
        // Branching edges from target composite to child nodes
        const targetEntry = target.shapeObject.getBorderPoint(target.x, target.y, source.x, source.y);
        for (const childNode of targetNodes) {
            const childDetail = getDetailState(childNode);
            const childEdgePoint = childNode.shapeObject.getBorderPoint(
                childNode.x, childNode.y, source.x, source.y
            );
            
            const branchPath: EdgePath = {
                type: 'straight',
                points: [targetEntry, childEdgePoint]
            };
            EdgeRenderer.drawEdgePath(graphics, branchPath, width, colour, childDetail.opacity * 0.6);
        }
    }
}
```

**Benefits:**
- **Future-proof**: EdgePath interface ready for curved edges (bezier, splines)
- **Separation of concerns**: Path calculation separate from drawing
- **Reusable**: drawEdgePath() works for any edge type (regular, synthetic, branching)
- **Maintainable**: All edge logic in one place, not scattered in Renderer
- **Easy to extend**: Add new edge types by extending EdgePath.type enum

**Current Implementation Note:**
For the initial refactor, you can skip creating this file. The current Renderer edge drawing code works fine. This is documented here for future reference when adding curved edges or more dynamic synthetic edge behaviour. When ready to implement:
1. Create EdgeRenderer.ts with calculateEdgePath() and drawEdgePath()
2. Refactor Renderer.drawConnection() to use EdgeRenderer static methods
3. Add curvature parameter to connection attributes
4. Implement bezier control point calculation

---

### 14. Create LabelRenderer Utility Class
**File:** `src/rendering/LabelRenderer.ts` (NEW FILE)

**Static utility for label positioning and sizing:**
```typescript
import { CONFIG } from '../config';
import type { DetailState } from '../managers/LayerDetailManager';

/**
 * Transform data for positioning and styling a label.
 * COORDINATE SYSTEM: WORLD SPACE (for PixiJS Text positioning)
 */
export interface LabelTransform {
    worldX: number;       // Label position X in world space
    worldY: number;       // Label position Y in world space
    rotation: number;     // Label rotation in radians
    fontSize: number;     // Computed font size in pixels
}

/**
 * Static utility class for calculating label transforms.
 * Handles label positioning, rotation, and font size scaling.
 * 
 * Design rationale:
 * - Static methods avoid boilerplate (no instance creation needed)
 * - Separates label concerns from Shape geometry
 * - Centralises font size scaling logic
 * - Makes coordinate system explicit (world space for PixiJS)
 */
export class LabelRenderer {
    /**
     * Calculate label transform for a node entity.
     * COORDINATE SYSTEM: WORLD SPACE (positions in physics coords)
     * 
     * @param worldX - Entity center X in world space
     * @param worldY - Entity center Y in world space
     * @param worldDiameter - Pre-computed world-space diameter from entity.getWorldSize()
     * @param cumulativeLayerScale - Product of layer relative scales
     * @param cameraScale - Renderer.scale (camera zoom)
     * @param detailState - Detail state from LayerDetailManager (controls inside/outside positioning)
     * @returns Label transform with position, rotation, and font size
     */
    static getNodeLabelTransform(
        worldX: number,
        worldY: number,
        worldDiameter: number,
        cumulativeLayerScale: number,
        cameraScale: number,
        detailState: DetailState | null
    ): LabelTransform {
        const labelOffset = 20; // pixels in world space (visual spacing)
        
        // Position: inside (center) or outside (above entity)
        // DetailState.labelInside = true when zoomed out (composite collapsed)
        const posX = worldX;
        const posY = detailState?.labelInside
            ? worldY  // Inside: centered on entity
            : worldY - worldDiameter / 2 - labelOffset;  // Outside: above entity
        
        // Font size: (base font size × layer base scale ÷ cumulative scale) ÷ camera scale
        // - Base scale (DEFAULT_NODE_RADIUS) keeps font size proportional to normalized entity size
        // - Divide by cumulativeScale to counteract layer scaling (deeper layers = smaller font)
        // - Divide by cameraScale to maintain readable size at all zoom levels
        const baseScale = CONFIG.DEFAULT_NODE_RADIUS;
        const fontSize = (CONFIG.LABEL_FONT_SIZE * baseScale / cumulativeLayerScale) / cameraScale;
        
        return {
            worldX: posX,
            worldY: posY,
            rotation: 0,  // Node labels don't rotate
            fontSize
        };
    }
    
    /**
     * Calculate label transform for an edge connection.
     * COORDINATE SYSTEM: WORLD SPACE
     * 
     * @param sourceWorldX - Source entity X in world space
     * @param sourceWorldY - Source entity Y in world space
     * @param targetWorldX - Target entity X in world space
     * @param targetWorldY - Target entity Y in world space
     * @param cumulativeLayerScale - Product of layer relative scales
     * @param cameraScale - Renderer.scale (camera zoom)
     * @returns Label transform with midpoint position, edge-aligned rotation, and font size
     */
    static getEdgeLabelTransform(
        sourceWorldX: number,
        sourceWorldY: number,
        targetWorldX: number,
        targetWorldY: number,
        cumulativeLayerScale: number,
        cameraScale: number
    ): LabelTransform {
        // Midpoint position (center of edge)
        const worldX = (sourceWorldX + targetWorldX) / 2;
        const worldY = (sourceWorldY + targetWorldY) / 2;
        
        // Calculate rotation aligned with edge direction
        const dx = targetWorldX - sourceWorldX;
        const dy = targetWorldY - sourceWorldY;
        let rotation = Math.atan2(dy, dx);
        
        // Keep text upright: flip 180° if text would be upside down
        // Threshold: rotation > 90° (π/2) or < -90° (-π/2)
        if (rotation > Math.PI / 2) {
            rotation -= Math.PI;
        } else if (rotation < -Math.PI / 2) {
            rotation += Math.PI;
        }
        
        // Font size calculation (same as nodes)
        const baseScale = CONFIG.DEFAULT_NODE_RADIUS;
        const fontSize = (CONFIG.LABEL_FONT_SIZE * baseScale / cumulativeLayerScale) / cameraScale;
        
        return {
            worldX,
            worldY,
            rotation,
            fontSize
        };
    }
}
```

---

### 15. Update Entity to Remove labelSize Property
**File:** `src/core/Entity.ts`

**Remove obsolete labelSize property and computation:**
```typescript
export class Entity {
    // ...existing properties
    
    // REMOVE these:
    // labelSize: number;  // Computed label font size (base size * layer scale)
    
    constructor(id: string, attributes: Record<string, any> = {}) {
        // ...existing code
        
        // REMOVE this line:
        // this.labelSize = CONFIG.LABEL_FONT_SIZE;
        
        // ...rest of constructor unchanged
    }
}
```

**Why remove:** Font size is now computed on-demand by `LabelRenderer.getNodeLabelTransform()`. Keeping `labelSize` creates duplicate logic and violates single source of truth.

---

### 16. Update GraphManager to Remove labelSize Assignment
**File:** `src/managers/GraphManager.ts`

**Remove manual label size scaling:**
```typescript
export class GraphManager {
    buildGraph() {
        // ...existing code
        
        // Inject cumulative scale instead of recreating shapes
        for (const entity of this.entities) {
            const cumulativeScale = this.getCumulativeScale(entity.layer);
            entity.setCumulativeScale(cumulativeScale);
            
            // REMOVE this line (labelSize no longer used):
            // entity.labelSize = CONFIG.LABEL_FONT_SIZE * scaleFactor;
        }
        
        // ...rest of buildGraph
    }
}
```

---

### 17. Update Renderer to Use LabelRenderer
**File:** `src/rendering/Renderer.ts`

**Replace manual label positioning with LabelRenderer:**
```typescript
import { LabelRenderer } from './LabelRenderer';

export class Renderer {
    // ...existing code
    
    private drawNode(node: Entity): void {
        // ...existing shape rendering code
        
        // Get label (create if doesn't exist)
        let label = this.nodeLabels.get(node);
        const targetRes = Math.max(4, this.scale * 4);
        
        // Calculate label transform
        const worldDiameter = node.getWorldSize();
        const cumulativeScale = node.getCumulativeScale(); // Cached in entity
        
        const labelTransform = LabelRenderer.getNodeLabelTransform(
            node.x,
            node.y,
            worldDiameter,
            cumulativeScale,
            this.scale,
            detailState
        );
        
        // Create or update label
        if (!label) {
            label = new Text({
                text: node.id,
                style: {
                    fontSize: labelTransform.fontSize,  // Use computed size
                    fill: 0x000000,
                    align: 'center',
                    fontFamily: 'Arial, sans-serif'
                },
                resolution: targetRes
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            this.nodeLabels.set(node, label);
        } else if (Math.abs(label.resolution - targetRes) > 2) {
            // Recreation for resolution change
            this.labelContainer.removeChild(label);
            label.destroy();
            label = new Text({
                text: node.id,
                style: {
                    fontSize: labelTransform.fontSize,
                    fill: 0x000000,
                    align: 'center',
                    fontFamily: 'Arial, sans-serif'
                },
                resolution: targetRes
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            this.nodeLabels.set(node, label);
        } else {
            // Just update font size if label exists
            label.style.fontSize = labelTransform.fontSize;
        }
        
        // OLD (REMOVE):
        // const labelOffset = 20;
        // if (detailState && detailState.labelInside) {
        //     label.position.set(node.x, node.y);
        // } else {
        //     const diameter = node.shapeObject.getDiameter();
        //     label.position.set(node.x, node.y - diameter / 2 - labelOffset);
        // }
        
        // NEW: Apply transform
        label.position.set(labelTransform.worldX, labelTransform.worldY);
        label.rotation = labelTransform.rotation;
        label.visible = true;
        label.alpha = (detailState?.opacity ?? 1.0) * node.alpha;
    }
    
    private drawEdgeLabel(connection: Connection): void {
        // Only if edge labels are enabled
        if (!this.renderConfig.showEdgeLabels) return;
        if (connection.sources.length === 0 || connection.targets.length === 0) return;
        
        const source = connection.sources[0];
        const target = connection.targets[0];
        
        // Calculate label transform
        const cumulativeScale = source.getCumulativeScale(); // Use source layer scale
        
        const labelTransform = LabelRenderer.getEdgeLabelTransform(
            source.x,
            source.y,
            target.x,
            target.y,
            cumulativeScale,
            this.scale
        );
        
        // Get or create edge label
        let label = this.edgeLabels.get(connection);
        const targetRes = Math.max(4, this.scale * 4);
        
        if (!label) {
            label = new Text({
                text: connection.id,
                style: {
                    fontSize: labelTransform.fontSize,
                    fill: 0x666666,
                    align: 'center',
                    fontFamily: 'Arial, sans-serif'
                },
                resolution: targetRes
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            this.edgeLabels.set(connection, label);
        } else {
            label.style.fontSize = labelTransform.fontSize;
        }
        
        // Apply transform (position + rotation)
        label.position.set(labelTransform.worldX, labelTransform.worldY);
        label.rotation = labelTransform.rotation;
        label.visible = true;
        label.alpha = connection.alpha;
    }
}
```

**Key changes:**
- Remove manual label positioning logic
- Call `LabelRenderer.getNodeLabelTransform()` directly (no Entity delegation)
- Apply rotation for edge labels (aligned with edge angle)
- Font size computed on-demand (no cached `entity.labelSize`)

---

### 18. Add getCumulativeScale() to Entity
**File:** `src/core/Entity.ts`

**Add getter for cached cumulative scale:**
```typescript
export class Entity {
    // ...existing properties
    private cumulativeLayerScale: number = 1.0;
    
    /**
     * Inject cumulative layer scale from GraphManager.
     */
    setCumulativeScale(cumulativeLayerScale: number): void {
        this.cumulativeLayerScale = cumulativeLayerScale;
    }
    
    /**
     * Get cached cumulative layer scale (for rendering/physics).
     */
    getCumulativeScale(): number {
        return this.cumulativeLayerScale;
    }
    
    // ...rest of entity methods
}
```

---

### 19. test.html
**File:** `test.html`

**Replace absolute pixel sizes with normalized coordinates:**

```javascript
// OLD:
const mRNA = new Entity(`mRNA_${geneName}`, { 
    layer: 0,
    colour: '#3498db',
    radius: 200  // absolute pixels - BAD
});

// NEW:
const mRNA = new Entity(`mRNA_${geneName}`, { 
    layer: 0,
    colour: '#3498db',
    radius: 1.0  // normalized coordinate (× 200px base scale = 200px world size)
});

// For larger entity:
const protein = new Entity(`Protein_${geneName}`, { 
    layer: 0,
    colour: '#e74c3c',
    radius: 1.25  // 1.25 units in coordinate space
});

// Rectangles use normalized width/height:
const geneA = new Entity('Gene_A', {
    children: [pairA.mRNA, pairA.protein],
    layer: 1,
    colour: '#d5f4e6',
    width: 1.2,   // coordinate space
    height: 0.8,  // coordinate space
    shape: 'rectangle'
});

// Connections:
new Connection('translation_A', [pairA.mRNA], [pairA.protein], {
    colour: '#95a5a6',
    width: 0.5  // thinner in coordinate space
})
```

---

## Migration Strategy

### Phase 1: Shape Infrastructure (Foundation)
1. **Update Shape base class** (section 1):
   - Add `getArea()` abstract method
   - Add `getWorldSize()`, `getWorldArea()`, `getScreenSize()` methods
   - Keep existing `getBorderPoint()`, `isInside()` methods
   - Update `draw()` signature to take screenSize parameter

2. **Update CircleShape** (section 2):
   - Implement `getArea()` → `π × radius²`
   - Update `draw()` to use screenSize parameter

3. **Update RectangleShape** (section 3):
   - Implement `getArea()` → `width × height`
   - Update `draw()` to scale width/height from screenSize

4. **Create EdgeShape** (section 5):
   - New file for connection geometry
   - Implements Shape interface

### Phase 2: Entity/Connection Delegation
5. **Update Entity** (section 4):
   - Add `setCumulativeScale()` method
   - Add `getWorldSize()` → delegates to `shapeObject.getWorldSize()`
   - Add `getWorldArea()` → delegates to `shapeObject.getWorldArea()`
   - Add `getScreenSize()` → delegates to `shapeObject.getScreenSize()`

6. **Update Connection** (section 6):
   - Add EdgeShape member
   - Add `setCumulativeScale()` method
   - Add `getWorldWidth()`, `getScreenWidth()` → delegate to EdgeShape

### Phase 3: Update Consumers

7. **Update GraphManager** (sections 8, 11, 16):
   - Replace `recreateShapeAtScale()` with `setCumulativeScale()` (line ~122)
   - Update right-click handler to use `getWorldSize()` (line ~621)
   - Remove `entity.labelSize` assignment (no longer needed)

8. **Update PhysicsEngine** (section 9):
   - Replace ALL `shapeObject.getDiameter()` → `entity.getWorldSize()`
   - Lines: 311, 381, 403, 490, 491, 535, 536

9. **Update Renderer** (sections 10, 17):
   - Replace `node.shapeObject.getDiameter()` → `node.getScreenSize(this.scale)`
   - Add comment: `// COORDINATE SYSTEM: SCREEN SPACE (rendering)`
   - Use `shape.draw(graphics, screenSize)` for rendering
   - Replace `connection.attributes.width` → `connection.getScreenWidth(this.scale)`
   - Note: Entity positions remain in world space, PixiJS container handles transform
   - Lines: 192, 232, 253, 266, 280, 308, 313, 318
   - **Add LabelRenderer integration** for node and edge labels

10. **Update validation.ts** (section 11):
    - Replace manual area calculations → `entity.getWorldArea()`
    - Add comment: `// COORDINATE SYSTEM: WORLD SPACE (comparing physics sizes)`
    - Lines: 27-30, 34-36

### Phase 4: Label System Integration

11. **Create LabelRenderer** (section 14):
    - New file: `src/rendering/LabelRenderer.ts`
    - Static utility class with `getNodeLabelTransform()` and `getEdgeLabelTransform()`
    - Handles label positioning, rotation, and font size scaling
    - No Entity/Connection delegation needed (direct calls from Renderer)

12. **Update Entity** (sections 15, 18):
    - Remove `labelSize` property (obsolete)
    - Add `getCumulativeScale()` getter method
    - Keep `setCumulativeScale()` for GraphManager injection

13. **Update Renderer to use LabelRenderer** (section 17):
    - Import and call `LabelRenderer.getNodeLabelTransform()` directly
    - Remove manual label positioning logic
    - Apply label rotation for edges (aligned with edge angle)
    - Update font size dynamically (no cached labelSize)

### Phase 5: Config and Demo

14. **Update Config** (section 12):
    - Add `DEFAULT_NODE_RADIUS: 200`
    - Add `DEFAULT_EDGE_WIDTH: 2`

15. **Update test.html** (section 19):
    - Change from `radius: 200` → `radius: 1.0` (normalized)
    - Change from `width: 4` → `width: 2.0` (normalized)

16. **Remove deprecated code**:
    - `Entity.recreateShapeAtScale()` no longer needed
    - `Entity.labelSize` property removed

### Phase 6: Future Enhancements (Optional)

17. **Create EdgeRenderer utility** (section 13):
    - New file: `src/rendering/EdgeRenderer.ts`
    - Static utility for edge path calculation and drawing
    - Supports curved edges (bezier, splines) via EdgePath interface
    - Handles synthetic edge branching complexity
    - **Note:** Can be implemented later when adding curved edges

---

## Testing Checklist

### Core Size System
- [ ] 3-layer network renders without texture errors
- [ ] Physics behaves stably with world sizes (check all force calculations)
- [ ] Entities maintain visual consistency across zoom levels
- [ ] Screen sizes prevent WebGPU texture limit errors
- [ ] Normalized coordinates work correctly (1.5 = 50% larger)
- [ ] Edge widths scale appropriately with zoom (no hardcoded pixel values)
- [ ] Shapes still render correctly (shapeObject still used for geometry, not sizing)

### Label System
- [ ] Node labels position correctly (inside when zoomed out, outside at optimal zoom)
- [ ] Label inside/outside switching works with DetailState.labelInside
- [ ] Font sizes scale correctly across layers (deeper = smaller base size)
- [ ] Font sizes remain readable at all zoom levels (camera scale compensation)
- [ ] Edge labels position at midpoint of connections
- [ ] Edge labels rotate to align with edge angle
- [ ] Edge labels stay upright (flip 180° when upside down)
- [ ] Label opacity fades with DetailState.opacity
- [ ] No cached labelSize property remains (removed from Entity)

### Code Migration Completeness
- [ ] All PhysicsEngine getDiameter() calls replaced (7 locations: 311, 381, 403, 490, 491, 535, 536)
- [ ] All Renderer width/size calculations updated (9 locations: 192, 232, 253, 266, 280, 308, 313, 318)
- [ ] validation.ts getDiameter() calls replaced (2 locations: 27, 34)
- [ ] GraphManager right-click getDiameter() replaced (1 location: 621)
- [ ] GraphManager labelSize assignment removed (section 16)
- [ ] Entity.labelSize property removed (section 15)
- [ ] Renderer uses LabelRenderer utility class (section 17)
- [ ] LabelRenderer.ts created with static methods (section 14)
- [ ] Connection.getCumulativeScale() getter added (section 6)

---

## Benefits

### Size System
1. **Shape-centric geometry**: Shape knows its area, diameter, border points - no manual calculations
2. **Memory safe**: Screen sizes prevent texture blow-up (8192×8192 limit)
3. **Scalable**: Works with arbitrary layer depths (world size inversely scales with cumulative scale)
4. **Clean separation**:
   - Shape = geometry + scaling logic
   - Entity/Connection = business logic (delegates to Shape)
   - Renderer = PixiJS orchestration (uses Shape.draw())
5. **User-friendly**: Normalized coordinates (radius: 1.0) instead of pixels (radius: 200)
6. **Extensible**: Easy to add new shapes (TriangleShape, HexagonShape, etc.)
7. **DRY principle**: Area calculation in Shape, not scattered across validation/physics/rendering
8. **Coordinate-system agnostic**: Base scales in CONFIG, shapes in abstract space

### Label System
1. **Single source of truth**: Font size computed on-demand (no cached `entity.labelSize` to keep in sync)
2. **Static utility pattern**: No boilerplate delegation methods, Renderer calls `LabelRenderer` directly
3. **Separation of concerns**: Label logic isolated from Shape geometry and Entity business logic
4. **Edge label rotation**: Labels align with edge angle, automatically flip to stay upright
5. **Explicit coordinate system**: All positions in world space (clear intent, matches PixiJS usage)
6. **DetailState integration preserved**: Respects existing label inside/outside switching behaviour
7. **Consistent scaling**: Font size uses same layer scale logic as entity sizes
8. **Maintainable**: Label positioning logic in one place (`LabelRenderer`), not scattered across codebase
