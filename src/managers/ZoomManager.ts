import { Node } from '../core/Node';

/**
 * Manages zoom level and layer-based visibility.
 * Handles smooth transitions and dynamic module expansion.
 */
export class ZoomManager {
    zoomLevel: number;
    minZoom: number;
    maxZoom: number;
    layerMap: Map<Node, number>;
    animationDuration: number;
    isAnimating: boolean;
    onZoomChange: Function | null;
    targetZoom: number;
    zoomVelocity: number;

    constructor(
        initialZoom: number = 0,
        minZoom: number = -3,
        maxZoom: number = 3
    ) {
        this.zoomLevel = initialZoom;
        this.targetZoom = initialZoom;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.layerMap = new Map();
        this.animationDuration = 150;
        this.isAnimating = false;
        this.onZoomChange = null;
        this.zoomVelocity = 0;
    }

    setZoom(level: number, animate: boolean = true): void {
        const clampedLevel = Math.max(this.minZoom, Math.min(this.maxZoom, level));
        this.targetZoom = clampedLevel;

        if (!animate) {
            this.zoomLevel = clampedLevel;
            this.isAnimating = false;
            if (this.onZoomChange) {
                this.onZoomChange(this.zoomLevel);
            }
        } else {
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

            // Smooth easing
            const eased = 1 - Math.pow(1 - progress, 3);
            this.zoomLevel = this.zoomLevel + (this.targetZoom - this.zoomLevel) * eased;

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
    getNodeVisibility(node: Node): number {
        return node.getVisibility(this.zoomLevel);
    }

    /**
     * Get all nodes that should be visible at current zoom level.
     */
    getVisibleNodes(nodes: Node[]): Node[] {
        return nodes.filter(node => {
            if (node.implicit) return false;
            return this.getNodeVisibility(node) > 0.05;
        });
    }

    /**
     * Determine if a module should expand/collapse based on zoom.
     */
    shouldAutoExpand(module: any, threshold: number = 0.3): boolean {
        const vis = this.getNodeVisibility(module);
        return vis > threshold;
    }

    interpolateOpacity(node: Node, startAlpha: number, endAlpha: number, t: number): number {
        return startAlpha + (endAlpha - startAlpha) * t;
    }
}
