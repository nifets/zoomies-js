import { Shape } from './Shape';

export class RectangleShape extends Shape {
    constructor(
        public width: number,
        public height: number,
        public cornerRadius: number = 0
    ) {
        super();
    }

    getRandomInteriorPoint(centerX: number, centerY: number): { x: number; y: number } {
        const hw = this.width / 2;
        const hh = this.height / 2;
        const x = centerX + (Math.random() - 0.5) * hw * 1.4;
        const y = centerY + (Math.random() - 0.5) * hh * 1.4;
        return { x, y };
    }

    getBorderPoint(centerX: number, centerY: number, targetX: number, targetY: number): { x: number; y: number } {
        const dx = targetX - centerX;
        const dy = targetY - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { x: centerX, y: centerY };

        const ndx = dx / dist;
        const ndy = dy / dist;
        const hw = this.width / 2;
        const hh = this.height / 2;
        const r = this.cornerRadius;

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

    isInside(pointX: number, pointY: number, centerX: number, centerY: number): boolean {
        const hw = this.width / 2;
        const hh = this.height / 2;
        return Math.abs(pointX - centerX) <= hw && Math.abs(pointY - centerY) <= hh;
    }

    containsPoint(pointX: number, pointY: number, centerX: number, centerY: number): boolean {
        const hw = this.width / 2 * 1.15;
        const hh = this.height / 2 * 1.15;
        return Math.abs(pointX - centerX) <= hw && Math.abs(pointY - centerY) <= hh;
    }
}
