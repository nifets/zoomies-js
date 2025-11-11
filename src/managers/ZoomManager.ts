/**
 * Manages zoom level and layer-based visibility.
 * Handles smooth zoom animations with easing.
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
}
