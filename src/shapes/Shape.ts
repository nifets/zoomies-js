import { CONFIG } from '../config';

/**
 * Abstract base class for node shapes.
 * Encapsulates geometry calculations for different shape types.
 * Subclasses store all shape-specific parameters internally in normalized coordinates.
 * Shape is responsible for converting normalized → world space using CONFIG.BASE_UNIT_TO_PIXELS.
 */
export abstract class Shape {
    /**
     * Get normalized diameter/bounding size (in abstract coordinate space).
     */
    abstract getDiameter(): number;

    /**
     * Get the normalized area of this shape (in abstract coordinate space).
     */
    abstract getArea(): number;
    /**
     * Get the normalized area of this shape (in abstract coordinate space).
     * For circles: π × r². For rectangles: w × h.

    /**
     * Get the world-space size (for physics simulation).
     * Shape computes this from its normalized dimensions and cumulative scale.
     * @param cumulativeScale - Cumulative layer scale factor
     */
    getWorldSize(cumulativeScale: number): number {
        return (this.getDiameter() * CONFIG.BASE_UNIT_TO_PIXELS) / cumulativeScale;
    }

    /**
     * Get world-space area (for validation, composite sizing).
     * Area scales with size squared.
     * @param cumulativeScale - Cumulative layer scale factor
     */
    getWorldArea(cumulativeScale: number): number {
        const normalizedArea = this.getArea();
        const scaleFactor = CONFIG.BASE_UNIT_TO_PIXELS / cumulativeScale;
        return normalizedArea * scaleFactor * scaleFactor;
    }

    /**
     * Draw this shape on a graphics context (for rendering).
     * Subclasses implement shape-specific drawing logic.
     * @param screenSize - The screen-space size for rendering
     */
    abstract draw(graphics: any, x: number, y: number, colour: number, bgOpacity: number, screenSize: number): void;

    /**
     * Draw border/stroke for this shape.
     * Subclasses implement shape-specific stroke logic.
     * @param screenSize - The screen-space size for rendering borders
     */
    abstract drawStroke(graphics: any, x: number, y: number, colour: number, isSelected: boolean, isHighlighted: boolean, screenSize: number): void;

    /**
     * Get a random point inside the shape.
     */
    abstract getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number };

    /**
     * Get the border intersection point when drawing a line from center toward target.
     * All coordinates are in world space.
     * @param worldSize The world-space size (diameter) of the shape
     */
    abstract getBorderPoint(
        centerX: number,
        centerY: number,
        targetX: number,
        targetY: number,
        worldSize: number
    ): { x: number; y: number };

    /**
     * Check if a point is inside the shape (world-space coordinates).
     * COORDINATE SYSTEM: WORLD SPACE
     * @param worldSize The size (diameter) of the shape in world coordinates
     */
    abstract isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean;

    /**
     * Check if a point is within the interactive hitbox of the shape (for clicking).
     * COORDINATE SYSTEM: WORLD SPACE
     * Can be larger than visual bounds for better UX (10% larger).
     * @param worldSize The size (diameter) of the shape in world coordinates
     */
    containsPoint(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        const expandedWorldSize = worldSize * 1.1;
        return this.isInside(worldPointX, worldPointY, worldCenterX, worldCenterY, expandedWorldSize);
    }

    /**
     * Enforce boundary constraint - teleport point back inside if outside.
     * COORDINATE SYSTEM: WORLD SPACE
     * @param worldSize The size (diameter) of the boundary shape in world coordinates
     */
    enforceConstraint(
        worldPointX: number,
        worldPointY: number,
        vx: number,
        vy: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number,
        margin: number = 0.9
    ): { x: number; y: number; vx: number; vy: number } | null {
        if (this.isInside(worldPointX, worldPointY, worldCenterX, worldCenterY, worldSize)) {
            return null; // No correction needed
        }

        // Get border point in this direction
        const border = this.getBorderPoint(worldCenterX, worldCenterY, worldPointX, worldPointY, worldSize);
        
        // Apply margin (slightly inside border)
        const dx = border.x - worldCenterX;
        const dy = border.y - worldCenterY;
        
        return {
            x: worldCenterX + dx * margin,
            y: worldCenterY + dy * margin,
            vx: vx * -0.5, // Reflect and dampen velocity
            vy: vy * -0.5
        };
    }
}
