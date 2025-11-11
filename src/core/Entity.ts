import { Shape } from '../shapes/Shape';
import { ShapeFactory } from '../shapes/ShapeFactory';
import { ShapeComparison } from '../shapes/ShapeComparison';
import { Connection } from './Connection';
import { CONFIG } from '../config';

/**
 * Entity - unified representation of any node in the graph.
 * Can be atomic (no children) or composite (with children).
 * All nodes in the hierarchy are the same type - no subclassing needed.
 * 
 * NOTE: connections are cached by GraphManager.buildGraph() based on the flat
 * Connection[] list, not stored by the user at construction time.
 */
export class Entity {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    implicit: boolean;
    visible: boolean;
    layer: number;
    colour: string;
    shape?: string; // Optional shape type identifier (e.g., 'circle', 'rectangle', or custom types). Can be overridden by layer metadata.
    shapeObject: Shape; // Internal shape for geometric calculations (always initialized)
    attributes: Record<string, any>;
    selected: boolean;
    highlighted: boolean;
    alpha: number;
    parent: Entity | null; // Parent entity (if this entity is a child of another)
    cumulativeScale: number; // Cumulative layer scale factor (injected by GraphManager)
    
    // Optional - only present if this entity contains children
    children: Entity[];
    collapsed: boolean;
    
    // Cached by GraphManager.buildGraph() - connections involving this entity
    connections: Connection[];
    // Cached by GraphManager.buildGraph() - connections between this entity's children
    internalConnections: Connection[];
    summaryConnections: Connection[];

    constructor(
        id: string,
        attributes: Record<string, any> = {}
    ) {
        this.id = id;
        this.x = attributes.x ?? (Math.random() * 400 - 200);
        this.y = attributes.y ?? (Math.random() * 400 - 200);
        this.vx = attributes.vx ?? 0;
        this.vy = attributes.vy ?? 0;
        this.implicit = attributes.implicit ?? false;
        this.visible = attributes.visible ?? true;
        this.layer = attributes.layer ?? 0;
        this.colour = attributes.colour ?? '#3498db';
        
        this.attributes = attributes;
        this.selected = false;
        this.highlighted = false;
        this.alpha = 1;
        this.parent = null;
        this.cumulativeScale = 1;

        // Determine shape type (optional - can be overridden by layer metadata)
        this.shape = attributes.shape ?? 'circle';
        
        // Create shape: factory extracts shape-specific parameters from attributes
        // At construction, sceneScale = 1 (will be scaled by GraphManager for other layers)
        this.shapeObject = ShapeFactory.createShape(this.shape as string, attributes, 1);
        
        // Container properties - only initialized if this is a composite
        this.children = attributes.nodes ?? attributes.children ?? [];
        this.collapsed = false;
        
        // Caches populated by GraphManager.buildGraph()
        this.connections = [];
        this.internalConnections = [];
        this.summaryConnections = [];
        
        // Automatically set parent references on children
        for (const child of this.children) {
            child.parent = this;
        }
    }

    /**
     * Set position of this entity.
     */
    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    /**
     * Set the cumulative scale factor for this entity (layer scaling).
     */
    setCumulativeScale(scale: number): void {
        this.cumulativeScale = scale;
    }

    /**
     * Get the cumulative scale factor.
     */
    getCumulativeScale(): number {
        return this.cumulativeScale;
    }

        /**
     * Get the world-space size (diameter).
     */
    getWorldSize(): number {
        return this.shapeObject.getWorldSize(this.cumulativeScale);
    }

    /**
     * Get the world-space area (for validation and physics).
     */
    getWorldArea(): number {
        return this.shapeObject.getWorldArea(this.cumulativeScale);
    }

    /**
     * Check if a point is inside this entity's hitbox (for click detection).
     * COORDINATE SYSTEM: WORLD SPACE
     */
    containsPoint(worldPointX: number, worldPointY: number): boolean {
        const worldSize = this.getWorldSize();
        return this.shapeObject.containsPoint(worldPointX, worldPointY, this.x, this.y, worldSize);
    }

    /**
     * Check if this entity is completely inside another entity.
     */
    isInside(other: Entity): boolean {
        return ShapeComparison.isShapeInside(
            this.shapeObject,
            this.x,
            this.y,
            this.getWorldSize(),
            other.shapeObject,
            other.x,
            other.y,
            other.getWorldSize()
        );
    }

    /**
     * Check if this entity intersects/overlaps with another entity.
     */
    intersects(other: Entity): boolean {
        return ShapeComparison.shapesIntersect(
            this.shapeObject,
            this.x,
            this.y,
            this.getWorldSize(),
            other.shapeObject,
            other.x,
            other.y,
            other.getWorldSize()
        );
    }

    /**
     * Updates the shape type (typically when layer metadata overrides it).
     * Recreates the shape with the new type.
     */
    updateShapeType(newShapeType: string): void {
        this.shape = newShapeType;
        this.shapeObject = ShapeFactory.createShape(newShapeType, this.attributes, 1);
    }

    /**
     * Check if this entity has children (is a container).
     */
    isComposite(): boolean {
        return this.children.length > 0;
    }

    /**
     * Get all child entities recursively.
     */
    getAllChildren(): Entity[] {
        const all: Entity[] = [];
        for (const child of this.children) {
            all.push(child);
            all.push(...child.getAllChildren());
        }
        return all;
    }

    /**
     * Get visible children recursively (accounting for collapsed state).
     */
    getVisibleChildren(): Entity[] {
        if (this.collapsed) return [];
        
        const visible: Entity[] = [];
        for (const child of this.children) {
            if (child.implicit) continue;
            
            if (child.isComposite()) {
                if (!child.collapsed) {
                    visible.push(...child.getVisibleChildren());
                } else {
                    visible.push(child);
                }
            } else {
                visible.push(child);
            }
        }
        return visible;
    }

    /**
     * Get leaf entities recursively (excluding implicit).
     */
    getLeafEntities(): Entity[] {
        const leaves: Entity[] = [];
        for (const child of this.children) {
            if (child.implicit) continue;
            if (child.isComposite()) {
                leaves.push(...child.getLeafEntities());
            } else {
                leaves.push(child);
            }
        }
        if (this.children.length === 0 && !this.implicit) {
            leaves.push(this);
        }
        return leaves;
    }

    /**
     * Update summary connections when state changes.
     * Note: collapsed state is now managed by LayerDetailManager.
     */
    updateSummaryEdges(): void {
        if (!this.collapsed) return;
        // When collapsed, summary connections represent connections from/to internal entities
    }

    /**
     * Set layer for this entity and all children.
     */
    setLayer(level: number): void {
        this.layer = level;
        this.children.forEach(child => {
            if (child.children.length === 0) {
                child.layer = level;
            }
        });
    }

    /**
     * Get visibility opacity based on zoom level (default: always visible).
     */
    getVisibility(zoomLevel: number): number {
        // Base layer (layer 0) entities always stay visible
        if (this.layer === 0) {
            return 1;
        }
        // Other layers fade based on distance from zoom level
        const layerDiff = Math.abs(this.layer - zoomLevel);
        return Math.max(0.3, 1 - layerDiff * 0.3); // Minimum 30% opacity
    }

    /**
     * Highlight/select methods for interactivity.
     */
    highlight(): void {
        this.highlighted = true;
    }

    unhighlight(): void {
        this.highlighted = false;
    }

    select(): void {
        this.selected = true;
    }

    deselect(): void {
        this.selected = false;
    }

    setOpacity(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    updateAttribute(key: string, value: any): void {
        this.attributes[key] = value;
    }
}
