/**
 * Abstract base class for node shapes.
 * Encapsulates geometry calculations for different shape types.
 * Subclasses should store all shape-specific parameters internally.
 * All dimensions are in scene/world scale.
 */
export abstract class Shape {
    /**
     * Get the diameter (bounding size) of this shape.
     * Used for physics, spacing, and label positioning.
     * For circles: 2 * radius. For rectangles: diagonal distance from center to corner.
     */
    abstract getDiameter(): number;

    /**
     * Draw this shape on a graphics context (for rendering).
     * Subclasses implement shape-specific drawing logic.
     */
    abstract draw(graphics: any, x: number, y: number, colour: number, bgOpacity: number): void;

    /**
     * Draw border/stroke for this shape.
     * Subclasses implement shape-specific stroke logic.
     */
    abstract drawStroke(graphics: any, x: number, y: number, colour: number, isSelected: boolean, isHighlighted: boolean): void;

    /**
     * Get a random point inside the shape.
     */
    abstract getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number };

    /**
     * Get the border intersection point when drawing a line from center toward target.
     */
    abstract getBorderPoint(
        centerX: number,
        centerY: number,
        targetX: number,
        targetY: number
    ): { x: number; y: number };

    /**
     * Check if a point is inside the shape (for boundary enforcement).
     */
    abstract isInside(
        pointX: number,
        pointY: number,
        centerX: number,
        centerY: number
    ): boolean;

    /**
     * Check if a point is within the interactive hitbox of the shape (for clicking).
     * Can be larger than visual bounds for better UX. Defaults to isInside.
     */
    containsPoint(
        pointX: number,
        pointY: number,
        centerX: number,
        centerY: number
    ): boolean {
        return this.isInside(pointX, pointY, centerX, centerY);
    }

    /**
     * Enforce boundary constraint - teleport point back inside if outside.
     */
    enforceConstraint(
        pointX: number,
        pointY: number,
        vx: number,
        vy: number,
        centerX: number,
        centerY: number,
        margin: number = 0.9
    ): { x: number; y: number; vx: number; vy: number } | null {
        if (this.isInside(pointX, pointY, centerX, centerY)) {
            return null; // No correction needed
        }

        // Get border point in this direction
        const border = this.getBorderPoint(centerX, centerY, pointX, pointY);
        
        // Apply margin (slightly inside border)
        const dx = border.x - centerX;
        const dy = border.y - centerY;
        
        return {
            x: centerX + dx * margin,
            y: centerY + dy * margin,
            vx: vx * -0.5, // Reflect and dampen velocity
            vy: vy * -0.5
        };
    }
}
