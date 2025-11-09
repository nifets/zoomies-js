import { Shape } from './Shape';

/**
 * Circular shape geometry.
 */
export class CircleShape extends Shape {
    constructor(public radius: number) {
        super();
    }

    getType(): string {
        return 'circle';
    }

    getDiameter(): number {
        return this.radius * 2;
    }

    getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number } {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * this.radius * 0.7;
        return {
            x: centerX + Math.cos(angle) * dist,
            y: centerY + Math.sin(angle) * dist
        };
    }

    getBorderPoint(centerX: number, centerY: number, targetX: number, targetY: number): { x: number; y: number } {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return { x: centerX, y: centerY };
        
        const ratio = this.radius / dist;
        return {
            x: centerX + dx * ratio,
            y: centerY + dy * ratio
        };
    }

    isInside(pointX: number, pointY: number, centerX: number, centerY: number): boolean {
        const dx = pointX - centerX;
        const dy = pointY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.radius * 0.95;
    }

    containsPoint(pointX: number, pointY: number, centerX: number, centerY: number): boolean {
        const dx = pointX - centerX;
        const dy = pointY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.radius * 1.1;
    }

    draw(graphics: any, x: number, y: number, colour: number, bgOpacity: number): void {
        graphics.circle(x, y, this.radius);
        graphics.fill({ color: colour, alpha: bgOpacity });
    }

    drawStroke(graphics: any, x: number, y: number, colour: number, isSelected: boolean, isHighlighted: boolean): void {
        graphics.circle(x, y, this.radius);
        const strokeColour = isSelected ? 0xf39c12 : (isHighlighted ? 0xe74c3c : colour);
        const strokeWidth = isSelected ? 3 : 2;
        graphics.stroke({ color: strokeColour, width: strokeWidth });
    }
}
