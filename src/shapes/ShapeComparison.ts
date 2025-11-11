import { Shape } from './Shape';
import { CircleShape } from './CircleShape';
import { RectangleShape } from './RectangleShape';

/**
 * Shape comparison utilities for spatial relationships between shapes.
 * Optimised direct geometry checks for circle and rectangle combinations.
 * TODO: Refine logic for rounded corner rectangles.
 */
export class ShapeComparison {
    /**
     * Check if a shape is completely inside another shape.
     * Efficient checks based on shape types: circle-in-rect, rect-in-rect, rect-in-circle.
     * @param innerShape The shape to test
     * @param innerX Inner shape world X coordinate
     * @param innerY Inner shape world Y coordinate
     * @param innerWorldSize Inner shape world size (diameter)
     * @param outerShape The containing shape
     * @param outerX Outer shape world X coordinate
     * @param outerY Outer shape world Y coordinate
     * @param outerWorldSize Outer shape world size (diameter)
     * @param margin Safety margin (0-1, typically 0.9 to keep slightly inside)
     */
    static isShapeInside(
        innerShape: Shape,
        innerX: number,
        innerY: number,
        innerWorldSize: number,
        outerShape: Shape,
        outerX: number,
        outerY: number,
        outerWorldSize: number,
        margin: number = 1.0
    ): boolean {
        const innerRadius = innerWorldSize / 2;
        const outerRadius = outerWorldSize / 2;
        const scaledOuterRadius = outerRadius * margin;

        // Circle inside circle
        if (innerShape instanceof CircleShape && outerShape instanceof CircleShape) {
            const dx = innerX - outerX;
            const dy = innerY - outerY;
            const distSq = dx * dx + dy * dy;
            const maxDistSq = (scaledOuterRadius - innerRadius) * (scaledOuterRadius - innerRadius);
            return distSq <= maxDistSq;
        }

        // Circle inside rectangle
        if (innerShape instanceof CircleShape && outerShape instanceof RectangleShape) {
            return this.circleInRectangle(
                innerX, innerY, innerRadius,
                outerX, outerY, outerShape as RectangleShape, outerWorldSize, margin
            );
        }

        // Rectangle inside rectangle
        if (innerShape instanceof RectangleShape && outerShape instanceof RectangleShape) {
            return this.rectangleInRectangle(
                innerX, innerY, innerShape as RectangleShape, innerWorldSize,
                outerX, outerY, outerShape as RectangleShape, outerWorldSize, margin
            );
        }

        // Rectangle inside circle
        if (innerShape instanceof RectangleShape && outerShape instanceof CircleShape) {
            return this.rectangleInCircle(
                innerX, innerY, innerShape as RectangleShape, innerWorldSize,
                outerX, outerY, scaledOuterRadius
            );
        }

        // Fallback to generic logic
        return outerShape.isInside(innerX, innerY, outerX, outerY, outerWorldSize);
    }

    /**
     * Check if circle is inside rectangle bounds.
     * Circle must fit: cx+r < xmax, cx-r > xmin, cy+r < ymax, cy-r > ymin
     */
    private static circleInRectangle(
        cx: number, cy: number, radius: number,
        rectX: number, rectY: number, rect: RectangleShape, rectWorldSize: number, margin: number
    ): boolean {
        const scale = rectWorldSize / rect.getDiameter();
        const halfWidth = (rect.getWidth() * scale) / 2;
        const halfHeight = (rect.getHeight() * scale) / 2;

        const scaledHalfWidth = halfWidth * margin;
        const scaledHalfHeight = halfHeight * margin;

        const dx = Math.abs(cx - rectX);
        const dy = Math.abs(cy - rectY);

        return (dx + radius <= scaledHalfWidth) && (dy + radius <= scaledHalfHeight);
    }

    /**
     * Check if rectangle is inside another rectangle.
     * All edges of inner must be inside outer.
     */
    private static rectangleInRectangle(
        innerX: number, innerY: number, innerRect: RectangleShape, innerWorldSize: number,
        outerX: number, outerY: number, outerRect: RectangleShape, outerWorldSize: number, margin: number
    ): boolean {
        const innerScale = innerWorldSize / innerRect.getDiameter();
        const outerScale = outerWorldSize / outerRect.getDiameter();

        const innerHalfW = (innerRect.getWidth() * innerScale) / 2;
        const innerHalfH = (innerRect.getHeight() * innerScale) / 2;
        const outerHalfW = (outerRect.getWidth() * outerScale) / 2;
        const outerHalfH = (outerRect.getHeight() * outerScale) / 2;

        const scaledOuterHalfW = outerHalfW * margin;
        const scaledOuterHalfH = outerHalfH * margin;

        const dx = Math.abs(innerX - outerX);
        const dy = Math.abs(innerY - outerY);

        return (dx + innerHalfW <= scaledOuterHalfW) && (dy + innerHalfH <= scaledOuterHalfH);
    }

    /**
     * Check if rectangle is inside circle.
     * All four corners of rectangle must be within circle radius.
     * Uses squared distances to avoid sqrt.
     */
    private static rectangleInCircle(
        rectX: number, rectY: number, rect: RectangleShape, rectWorldSize: number,
        circleX: number, circleY: number, circleRadius: number
    ): boolean {
        const scale = rectWorldSize / rect.getDiameter();
        const halfWidth = (rect.getWidth() * scale) / 2;
        const halfHeight = (rect.getHeight() * scale) / 2;
        const radiusSq = circleRadius * circleRadius;

        // Check all four corners
        const corners = [
            { x: rectX + halfWidth, y: rectY + halfHeight },
            { x: rectX - halfWidth, y: rectY + halfHeight },
            { x: rectX + halfWidth, y: rectY - halfHeight },
            { x: rectX - halfWidth, y: rectY - halfHeight }
        ];

        for (const corner of corners) {
            const dx = corner.x - circleX;
            const dy = corner.y - circleY;
            const distSq = dx * dx + dy * dy;
            if (distSq > radiusSq) return false;
        }

        return true;
    }

    /**
     * Get the escape direction and distance when a shape is outside another.
     * Simply uses the difference between centres - efficient and works for all combinations.
     * Returns null if the shape is completely inside.
     */
    static getEscapeVector(
        innerX: number,
        innerY: number,
        innerWorldSize: number,
        outerShape: Shape,
        outerX: number,
        outerY: number,
        outerWorldSize: number
    ): { escapeX: number; escapeY: number; distance: number } | null {
        // Escape vector is simply the direction from outer centre to inner centre
        const escapeX = innerX - outerX;
        const escapeY = innerY - outerY;
        const distance = Math.sqrt(escapeX * escapeX + escapeY * escapeY);

        if (distance < 0.001) return null; // Essentially at same point

        return { escapeX, escapeY, distance };
    }

    /**
     * Check if two shapes intersect/overlap (neither is completely inside the other, but they touch).
     * Handles all combinations: circle-circle, circle-rect, rect-rect, rect-circle.
     */
    static shapesIntersect(
        shape1: Shape,
        x1: number,
        y1: number,
        size1: number,
        shape2: Shape,
        x2: number,
        y2: number,
        size2: number
    ): boolean {
        const radius1 = size1 / 2;
        const radius2 = size2 / 2;

        // Circle-circle intersection
        if (shape1 instanceof CircleShape && shape2 instanceof CircleShape) {
            return this.circleCircleIntersect(x1, y1, radius1, x2, y2, radius2);
        }

        // Circle-rectangle intersection
        if (shape1 instanceof CircleShape && shape2 instanceof RectangleShape) {
            return this.circleRectangleIntersect(
                x1, y1, radius1,
                x2, y2, shape2 as RectangleShape, size2
            );
        }

        // Rectangle-circle intersection (swap order)
        if (shape1 instanceof RectangleShape && shape2 instanceof CircleShape) {
            return this.circleRectangleIntersect(
                x2, y2, radius2,
                x1, y1, shape1 as RectangleShape, size1
            );
        }

        // Rectangle-rectangle intersection
        if (shape1 instanceof RectangleShape && shape2 instanceof RectangleShape) {
            return this.rectangleRectangleIntersect(
                x1, y1, shape1 as RectangleShape, size1,
                x2, y2, shape2 as RectangleShape, size2
            );
        }

        return false;
    }

    /**
     * Circle-circle intersection: centres closer than sum of radii.
     */
    private static circleCircleIntersect(
        x1: number, y1: number, r1: number,
        x2: number, y2: number, r2: number
    ): boolean {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distSq = dx * dx + dy * dy;
        const minDistSq = (r1 + r2) * (r1 + r2);
        return distSq < minDistSq;
    }

    /**
     * Circle-rectangle intersection: circle centre is within rectangle + radius distance,
     * OR any rectangle edge/corner is within circle radius.
     */
    private static circleRectangleIntersect(
        cx: number, cy: number, cRadius: number,
        rectX: number, rectY: number, rect: RectangleShape, rectWorldSize: number
    ): boolean {
        const scale = rectWorldSize / rect.getDiameter();
        const halfWidth = (rect.getWidth() * scale) / 2;
        const halfHeight = (rect.getHeight() * scale) / 2;

        // Find closest point on rectangle to circle centre
        const closestX = Math.max(rectX - halfWidth, Math.min(cx, rectX + halfWidth));
        const closestY = Math.max(rectY - halfHeight, Math.min(cy, rectY + halfHeight));

        const dx = cx - closestX;
        const dy = cy - closestY;
        const distSq = dx * dx + dy * dy;
        const radiusSq = cRadius * cRadius;

        return distSq < radiusSq;
    }

    /**
     * Rectangle-rectangle intersection: axis-aligned bounding box check.
     * Rectangles intersect if they overlap on both axes.
     */
    private static rectangleRectangleIntersect(
        x1: number, y1: number, rect1: RectangleShape, size1: number,
        x2: number, y2: number, rect2: RectangleShape, size2: number
    ): boolean {
        const scale1 = size1 / rect1.getDiameter();
        const scale2 = size2 / rect2.getDiameter();

        const halfW1 = (rect1.getWidth() * scale1) / 2;
        const halfH1 = (rect1.getHeight() * scale1) / 2;
        const halfW2 = (rect2.getWidth() * scale2) / 2;
        const halfH2 = (rect2.getHeight() * scale2) / 2;

        // AABB collision: rectangles don't overlap if separated on either axis
        const separatedX = Math.abs(x1 - x2) > halfW1 + halfW2;
        const separatedY = Math.abs(y1 - y2) > halfH1 + halfH2;

        return !separatedX && !separatedY;
    }
}
