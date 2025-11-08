import { Entity } from '../core/Entity';

/**
 * Manages zoom level and layer-based visibility.
 * Handles smooth transitions and dynamic composite expansion.
 */
export class ZoomManager {
    zoomLevel: number;
    minZoom: number;
    maxZoom: number;
    animationDuration: number;
    isAnimating: boolean;
    onZoomChange: Function | null;
    targetZoom: number;
    startZoom: number;
    prevZoom: number;
    focusPoint: { x: number; y: number } | null;

    constructor(
        initialZoom: number = 0,
        minZoom: number = -3,
        maxZoom: number = 3
    ) {
        this.zoomLevel = initialZoom;
        this.targetZoom = initialZoom;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.animationDuration = 2;
        this.isAnimating = false;
        this.onZoomChange = null;
        this.startZoom = initialZoom;
        this.prevZoom = initialZoom;
        this.focusPoint = null;
    }

    setZoom(level: number, animate: boolean = true, focusPoint?: { x: number; y: number }): void {
        const clampedLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.targetZoom = clampedLevel;
        this.focusPoint = focusPoint || null;

        if (!animate) {
            this.zoomLevel = clampedLevel;
            this.isAnimating = false;
            if (this.onZoomChange) {
                this.onZoomChange(this.zoomLevel);
            }
        } else {
            this.startZoom = this.zoomLevel;
            this.animateToTargetZoom();
        }
    }

    private animateToTargetZoom(): void {
        if (this.isAnimating && Math.abs(this.zoomLevel - this.targetZoom) < 0.01) {
            this.isAnimating = false;
            this.zoomLevel = this.targetZoom;
            return;
        }

        this.isAnimating = true;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / this.animationDuration, 1);

            // Gentle ease-in-out-quad: subtle acceleration and deceleration
            let eased: number;
            if (progress < 0.5) {
                eased = 2 * progress * progress;
            } else {
                eased = -1 + (4 - 2 * progress) * progress;
            }
            
            this.prevZoom = this.zoomLevel;
            this.zoomLevel = this.startZoom + (this.targetZoom - this.startZoom) * eased;

            if (this.onZoomChange) {
                this.onZoomChange(this.zoomLevel);
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.zoomLevel = this.targetZoom;
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * Get visibility (opacity) for a node at current zoom level.
     */
    getNodeVisibility(node: Entity): number {
        return node.getVisibility(this.zoomLevel);
    }

    /**
     * Get all nodes that should be visible at current zoom level.
     */
    getVisibleNodes(nodes: Entity[]): Entity[] {
        return nodes.filter(node => {
            if (node.implicit) return false;
            return this.getNodeVisibility(node) > 0.05;
        });
    }

    /**
     * Determine if a composite should expand/collapse based on zoom.
     */
    shouldAutoExpand(composite: Entity, threshold: number = 0.3): boolean {
        const vis = this.getNodeVisibility(composite);
        return vis > threshold;
    }

    /**
     * Get composite collapse state (0 = fully expanded with children visible, 1 = fully collapsed).
     * Used for zoom-based animations of children opacity and composite styling.
     */
    getCompositeCollapseState(collapseZoomStart: number = 0.3, collapseZoomEnd: number = 0.1): number {
        // Clamp zoom level between start and end
        if (this.zoomLevel > collapseZoomStart) {
            return 0; // Fully expanded
        }
        if (this.zoomLevel < collapseZoomEnd) {
            return 1; // Fully collapsed
        }
        // Interpolate between start and end
        const range = collapseZoomStart - collapseZoomEnd;
        return (collapseZoomStart - this.zoomLevel) / range;
    }

    interpolateOpacity(node: Entity, startAlpha: number, endAlpha: number, t: number): number {
        return startAlpha + (endAlpha - startAlpha) * t;
    }
}
