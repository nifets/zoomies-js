import { Shape } from './Shape';
import { CONFIG } from '../config';

export class RectangleShape extends Shape {
    constructor(
        private normalizedWidth: number,
        private normalizedHeight: number,
        private normalizedCornerRadius: number = 0
    ) {
        super();
    }

    getType(): string {
        return 'rectangle';
    }

    getCornerRadius(): number {
        return this.normalizedCornerRadius;
    }

    getWidth(): number {
        return this.normalizedWidth;
    }

    getHeight(): number {
        return this.normalizedHeight;
    }

    getArea(): number {
        return this.normalizedWidth * this.normalizedHeight;
    }

    getDiameter(): number {
        // Bounding circle diameter
        return Math.sqrt(this.normalizedWidth ** 2 + this.normalizedHeight ** 2);
    }

    getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number } {
        const hw = this.normalizedWidth / 2;
        const hh = this.normalizedHeight / 2;
        const x = centerX + (Math.random() - 0.5) * hw * 1.4;
        const y = centerY + (Math.random() - 0.5) * hh * 1.4;
        return { x, y };
    }

    getBorderPoint(centerX: number, centerY: number, targetX: number, targetY: number, worldSize: number): { x: number; y: number } {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { x: centerX, y: centerY };

        // Scale normalized dimensions to world space
        const normalizedDiameter = this.getDiameter();
        const scale = worldSize / normalizedDiameter;
        const worldWidth = this.normalizedWidth * scale;
        const worldHeight = this.normalizedHeight * scale;
        const worldCornerRadius = this.normalizedCornerRadius * scale;

        const ndx = dx / dist;
        const ndy = dy / dist;
        const hw = worldWidth / 2;
        const hh = worldHeight / 2;
        const r = worldCornerRadius;

        // Calculate intersection with rectangle (ignoring rounded corners first)
        const tx = hw / Math.abs(ndx);
        const ty = hh / Math.abs(ndy);
        const t = Math.min(tx, ty);

        let px = centerX + ndx * t;
        let py = centerY + ndy * t;

        // If no corner radius, return simple intersection
        if (r === 0) {
            return { x: px, y: py };
        }

        // Check if intersection is in corner region
        const relX = px - centerX;
        const relY = py - centerY;
        
        // Determine which corner region (if any)
        const inCornerX = Math.abs(Math.abs(relX) - hw) < r;
        const inCornerY = Math.abs(Math.abs(relY) - hh) < r;

        if (inCornerX && inCornerY) {
            // In corner region - calculate intersection with circular arc
            const cornerCenterX = centerX + Math.sign(relX) * (hw - r);
            const cornerCenterY = centerY + Math.sign(relY) * (hh - r);
            
            // Vector from corner center to target
            const cdx = targetX - cornerCenterX;
            const cdy = targetY - cornerCenterY;
            const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
            
            if (cdist > 0) {
                // Point on the circular arc
                px = cornerCenterX + (cdx / cdist) * r;
                py = cornerCenterY + (cdy / cdist) * r;
            }
        }

        return { x: px, y: py };
    }

    isInside(
        worldPointX: number,
        worldPointY: number,
        worldCenterX: number,
        worldCenterY: number,
        worldSize: number
    ): boolean {
        // worldSize is the diameter - scale normalized dimensions proportionally
        const normalizedDiameter = this.getDiameter();
        const scale = worldSize / normalizedDiameter;
        const worldWidth = this.normalizedWidth * scale;
        const worldHeight = this.normalizedHeight * scale;
        
        const worldDx = worldPointX - worldCenterX;
        const worldDy = worldPointY - worldCenterY;
        
        return Math.abs(worldDx) <= worldWidth / 2 && Math.abs(worldDy) <= worldHeight / 2;
    }

    draw(graphics: any, x: number, y: number, colour: number, bgOpacity: number, screenSize: number): void {
        const aspectRatio = this.normalizedWidth / this.normalizedHeight;
        const screenHeight = screenSize / Math.sqrt(1 + aspectRatio * aspectRatio);
        const screenWidth = screenHeight * aspectRatio;
        const screenCornerRadius = this.normalizedCornerRadius * (screenWidth / this.normalizedWidth);
        
        graphics.roundRect(x - screenWidth / 2, y - screenHeight / 2, screenWidth, screenHeight, screenCornerRadius);
        graphics.fill({ color: colour, alpha: bgOpacity });
    }

    drawStroke(graphics: any, x: number, y: number, colour: number, isSelected: boolean, isHighlighted: boolean, screenSize: number): void {
        const aspectRatio = this.normalizedWidth / this.normalizedHeight;
        const screenHeight = screenSize / Math.sqrt(1 + aspectRatio * aspectRatio);
        const screenWidth = screenHeight * aspectRatio;
        const screenCornerRadius = this.normalizedCornerRadius * (screenWidth / this.normalizedWidth);
        
        graphics.roundRect(x - screenWidth / 2, y - screenHeight / 2, screenWidth, screenHeight, screenCornerRadius);
        const strokeColour = isSelected ? 0xf39c12 : (isHighlighted ? 0xe74c3c : colour);
        const strokeWidth = isSelected ? CONFIG.NODE_BORDER_WIDTH_SELECTED : CONFIG.NODE_BORDER_WIDTH;
        graphics.stroke({ color: strokeColour, width: strokeWidth });
    }
}
