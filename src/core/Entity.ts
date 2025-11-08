import { Shape } from '../shapes/Shape';
import { ShapeFactory } from '../shapes/ShapeFactory';
import { Connection } from './Connection';

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
    radius: number;
    shape?: string; // Optional shape type identifier (e.g., 'circle', 'rectangle', or custom types). Can be overridden by layer metadata.
    width?: number; // For shapes that use width (e.g., rectangles)
    height?: number; // For shapes that use height (e.g., rectangles)
    shapeObject: Shape; // Internal shape for geometric calculations (always initialized)
    attributes: Record<string, any>;
    selected: boolean;
    alpha: number;
    parent: Entity | null; // Parent entity (if this entity is a child of another)
    
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
        
        // Apply layer-based scaling to size (default layerScaleFactor = 5)
        const layerScaleFactor = attributes.layerScaleFactor ?? 5;
        const layerScale = Math.pow(layerScaleFactor, this.layer);
        
        this.radius = (attributes.radius ?? 15) * layerScale;
        this.attributes = attributes;
        this.selected = false;
        this.alpha = 1;
        this.parent = null;

        // Determine shape type (optional - can be overridden by layer metadata)
        this.shape = attributes.shape;
        this.width = (attributes.width ?? (this.radius * 2)) * layerScale;
        this.height = (attributes.height ?? (this.radius * 2)) * layerScale;
        
        // Initialize shape object using factory
        // Defaults to 'circle' if entity shape not explicitly set
        const shapeType = this.shape ?? 'circle';
        this.shapeObject = ShapeFactory.createShape(
            shapeType,
            this.radius,
            this.width,
            this.height,
            attributes.cornerRadius ?? 0
        );
        
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
     * Update the shapeObject to match the resolved shape type (from entity or layer metadata).
     * Uses ShapeFactory to create appropriate shape instance.
     * This should be called when rendering if layer metadata might override the shape.
     * 
     * @param shapeType - Shape type identifier (e.g., 'circle', 'rectangle', or custom types)
     */
    updateShapeObject(shapeType: string): void {
        this.shapeObject = ShapeFactory.createShape(shapeType, this.radius, this.width, this.height, this.attributes.cornerRadius);
    }

    /**
     * Get the resolved shape type for this entity.
     * Prioritises entity-level shape over layer metadata defaults.
     * If no explicit shape is set, returns 'circle' as default.
     * Note: Caller should use this result to call updateShapeObject() if rendering with layer metadata.
     * 
     * @returns Shape type identifier as string (e.g., 'circle', 'rectangle')
     */
    getResolvedShapeType(): string {
        return this.shape ?? 'circle';
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
     * Collapse this entity: hide internal children/connections.
     */
    collapse(): void {
        this.collapsed = true;
        this.children.forEach(child => {
            child.visible = false;
        });
        this.connections.forEach(conn => {
            conn.hidden = true;
        });
    }

    /**
     * Expand this entity: show internal children/connections.
     */
    expand(): void {
        this.collapsed = false;
        this.children.forEach(child => {
            child.visible = true;
        });
        this.connections.forEach(conn => {
            conn.hidden = false;
        });
    }

    /**
     * Update summary connections when state changes.
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
        this.attributes.highlighted = true;
    }

    unhighlight(): void {
        this.attributes.highlighted = false;
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
