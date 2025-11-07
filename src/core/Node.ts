import { Shape } from '../shapes/Shape';
import { CircleShape } from '../shapes/CircleShape';
import { RectangleShape } from '../shapes/RectangleShape';

/**
 * Represents a node in the graph.
 * Fully generic: all domain semantics live in `attributes`.
 */
export class Node {
    id: string;
    layer: number;
    attributes: Record<string, any>;
    selected: boolean;
    visible: boolean;
    implicit: boolean; // If true, node is not rendered or considered in hyperedges
    x: number;
    y: number;
    vx: number; // velocity x
    vy: number; // velocity y
    alpha: number; // opacity
    radius: number;
    shape: 'circle' | 'rectangle';
    width?: number; // for rectangles
    height?: number; // for rectangles
    shapeObject: Shape;

    constructor(
        id: string,
        attributes: Record<string, any> = {}
    ) {
        this.id = id;
        this.layer = attributes.layer ?? 0;
        this.attributes = attributes;
        this.selected = false;
        this.visible = true;
        this.implicit = attributes.implicit ?? false;
        this.x = Math.random() * 400 - 200;
        this.y = Math.random() * 400 - 200;
        this.vx = 0;
        this.vy = 0;
        this.alpha = 1;
        this.radius = attributes.radius ?? 10;
        this.shape = attributes.shape ?? 'circle';
        this.width = attributes.width ?? (this.radius * 2);
        this.height = attributes.height ?? (this.radius * 2);
        
        if (this.shape === 'rectangle') {
            this.shapeObject = new RectangleShape(
                this.width!,
                this.height!,
                attributes.cornerRadius ?? 0
            );
        } else {
            this.shapeObject = new CircleShape(this.radius);
        }
    }

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

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    setOpacity(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    updateAttribute(key: string, value: any): void {
        this.attributes[key] = value;
    }

    getVisibility(zoomLevel: number): number {
        // Base layer (layer 0) nodes always stay visible
        if (this.layer === 0) {
            return 1;
        }
        // Other layers fade based on distance from zoom level
        const layerDiff = Math.abs(this.layer - zoomLevel);
        return Math.max(0.3, 1 - layerDiff * 0.3); // Minimum 30% opacity
    }
}
