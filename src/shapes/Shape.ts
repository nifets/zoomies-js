/**
 * Abstract base class for node shapes.
 * Encapsulates geometry calculations for different shape types.
 */
export abstract class Shape {
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
