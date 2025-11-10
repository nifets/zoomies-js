import { Shape } from './Shape';
import { CONFIG } from '../config';

/**
 * Circular shape geometry.
 * Stores normalized radius in abstract coordinate space.
 */
export class CircleShape extends Shape {
    constructor(private normalizedRadius: number) {
        super();
    }

    getType(): string {
        return 'circle';
    }

    getArea(): number {
        return Math.PI * this.normalizedRadius * this.normalizedRadius;
    }

    getDiameter(): number {
        return this.normalizedRadius * 2;
    }

    getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number } {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.normalizedRadius * 0.7;
        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist
        };
    }

    getBorderPoint(centerX: number, centerY: number, targetX: number, targetY: number, worldSize: number): { x: number; y: number } {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return { x: centerX, y: centerY };
        
        const worldRadius = worldSize / 2;
        const ratio = worldRadius / dist;
        return {
            x: centerX + dx * ratio,
            y: centerY + dy * ratio
        };
    }

    /**
     * Check if a point is inside the circle.
     * COORDINATE SYSTEM: WORLD SPACE
     */
    isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        const dx = worldPointX - worldCenterX;
        const dy = worldPointY - worldCenterY;
        const distanceSquared = dx * dx + dy * dy;
        
        const worldRadius = worldSize / 2;
        return distanceSquared <= worldRadius * worldRadius;
    }

    draw(graphics: any, x: number, y: number, colour: number, bgOpacity: number, screenSize: number): void {
        const screenRadius = screenSize / 2;
        graphics.circle(x, y, screenRadius);
        graphics.fill({ color: colour, alpha: bgOpacity });
    }

    drawStroke(graphics: any, x: number, y: number, colour: number, isSelected: boolean, isHighlighted: boolean, screenSize: number): void {
        const screenRadius = screenSize / 2;
        graphics.circle(x, y, screenRadius);
        const strokeColour = isSelected ? 0xf39c12 : (isHighlighted ? 0xe74c3c : colour);
        const strokeWidth = isSelected ? CONFIG.NODE_BORDER_WIDTH_SELECTED : CONFIG.NODE_BORDER_WIDTH;
        graphics.stroke({ color: strokeColour, width: strokeWidth });
    }
}
