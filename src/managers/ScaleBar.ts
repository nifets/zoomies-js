import { LayerMetadata } from './LayerDetailManager';
import { CONFIG } from '../config';

/**
 * Explicit scale bar representation for zoom-to-layer mapping.
 *
 * The scale bar is a horizontal axis where each layer has an optimal viewing position.
 * Positions are calculated using logarithmic spacing based on relative scales:
 *   - L0-optimal: zoom = 0 (reference point)
 *   - L1-optimal: zoom = log₂(relativeScale[0])
 *   - L2-optimal: zoom = log₂(relativeScale[0]) + log₂(relativeScale[1])
 *   etc.
 *
 * This ensures visual scale invariance: zooming out by log₂(k) units shows objects
 * that are k× bigger at the same on-screen size.
 *
 * ZOOM DIRECTION REFERENCE:
 * - Positive zoom = zoomed in (higher numbers, further right on scale bar)
 * - Negative zoom = zoomed out (lower numbers, further left on scale bar)
 * - Higher zoom → larger camera scale → objects appear smaller
 * - Lower zoom → smaller camera scale → objects appear larger
 *
 * ASYMMETRICAL FADE REGIONS WITH OVERLAP:
 * Each layer has a fade region [bottomZoom, topZoom] where it's visible/fading.
 * The region extends asymmetrically with overlap for smooth crossfading:
 * - topZoom = layer's optimal zoom (fully visible here)
 * - bottomZoom = next higher layer's optimal - fadeDistance (creates overlap zone)
 *
 * Example with 3 layers (L0 at 0, L1 at -2.32, L2 at -4.64, fadeDistance=0.6):
 * - L0 fade region: [-1.72, 0]      (visible from -1.72 down to optimal at 0)
 * - L1 fade region: [-4.04, -2.32]  (visible from -4.04 down to optimal at -2.32)
 * - L2 fade region: [-∞, -4.64]     (visible from optimal downward)
 *
 * This creates overlap zones for smooth crossfading:
 * - At zoom=0: only L0 visible (at optimal)
 * - At zoom=-1: only L0 visible (before L0's fadeDistance boundary)
 * - At zoom=-1.72: L0 starts fading, L1 starts appearing
 * - At zoom=-2.32: L0 opaque, L1 transparent (both fully visible for layer switch)
 * - At zoom=-3: L0 fading out, L1 visible
 * - At zoom=-4.04: L1 starts fading, L2 starts appearing
 * - At zoom=-4.64: L1 opaque, L2 transparent (both fully visible)
 * - Asymmetrical: each layer only visible at its optimal and below (towards higher layers)
 */
export class ScaleBar {
    /** Layer index → optimal zoom position */
    layerPositions: Map<number, number>;

    /** Layer index → spacing to next layer (for fade calculations) */
    layerSpacings: Map<number, number>;

    /** Minimum zoom level (fully zoomed out) */
    minZoom: number;

    /** Maximum zoom level (fully zoomed in) */
    maxZoom: number;

    /** Fade distance around each optimal point (half the layer spacing) */
    fadeDistance: number;

    constructor(
        minLayer: number,
        maxLayer: number,
        layerMetadata: Map<number, LayerMetadata> | undefined,
        defaultLayerScaleFactor: number = 3
    ) {
        this.layerPositions = new Map();
        this.layerSpacings = new Map();
        this.fadeDistance = 0;

        // Build scale bar mapping from zoom coordinates to scale coordinates
        // Zoom coordinates: camera scale = 2^zoom
        // Scale coordinates: L0 (left) → L1 → L2 (right), increasing abstraction
        //
        // If L1 entities are 3× bigger than L0, to see them at same screen size:
        // camera scale must be 1/3 of L0's camera scale
        // If L0 at zoom=0 (scale=1), then L1 at zoom where 2^zoom = 1/3
        // zoom = log₂(1/3) = -log₂(3)
        //
        // L0 at zoom = 0 (reference, camera scale = 1)
        // L1 at zoom = -log₂(relativeScale) (camera scale = 1/relativeScale)
        // L2 at zoom = -log₂(scale1) - log₂(scale2) (camera scale = 1/(scale1×scale2))
        
        let currentZoom = 0;
        this.layerPositions.set(0, currentZoom);

        let previousSpacing = 0;
        for (let layer = 1; layer <= maxLayer; layer++) {
            const relativeScale = this.getLayerScale(layer - 1, layerMetadata, defaultLayerScaleFactor);
            const spacing = Math.log2(relativeScale);
            currentZoom -= spacing; // Subtract to zoom out (lower camera scale)
            this.layerPositions.set(layer, currentZoom);
            this.layerSpacings.set(layer - 1, spacing); // Store spacing for layer transition
            previousSpacing = spacing;
        }

        // Fade distance: based on default layer scale factor (consistent regardless of actual layers)
        const defaultSpacing = Math.log2(defaultLayerScaleFactor);
        this.fadeDistance = defaultSpacing * 0.5;

        // Set zoom range with buffer
        // Buffer must scale with total depth to keep minZoom fixed regardless of number of layers
        const totalDepth = Math.abs(currentZoom);
        const baseBuffer = this.fadeDistance * CONFIG.SCALE_BAR_BUFFER_MULTIPLIER;
        const buffer = totalDepth + baseBuffer;
        this.minZoom = -buffer; // Scaled minimum zoom
        this.maxZoom = baseBuffer; // Maximum zoom buffer (L0 at 0)
    }

    /**
     * Get the optimal zoom position for a layer.
     * Returns 0 if layer doesn't exist on scale bar.
     */
    getOptimalZoomForLayer(layer: number): number {
        return this.layerPositions.get(layer) ?? 0;
    }

    /**
     * Determine which layer is most prominent (closest to optimal) at given zoom.
     */
    getPrimaryLayerAtZoom(zoomLevel: number): number {
        let closestLayer = 0;
        let closestDistance = Infinity;

        for (const [layer, optimalZoom] of this.layerPositions.entries()) {
            const distance = Math.abs(zoomLevel - optimalZoom);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestLayer = layer;
            }
        }

        return closestLayer;
    }

        /**
     * Get all layers that are at least partially visible at given zoom.
     * Uses asymmetrical fading via getLayerWindow().
     */
    getVisibleLayers(zoomLevel: number): number[] {
        const visibleLayers: number[] = [];
        const allLayers = Array.from(this.layerPositions.keys());

        for (const layer of allLayers) {
            if (this.isLayerVisible(layer, zoomLevel)) {
                visibleLayers.push(layer);
            }
        }
        
        return visibleLayers.sort((a, b) => a - b);
    }

    /**
     * Get the fade distance for a specific layer (half the spacing to next layer).
     * Uses actual per-layer spacing if available, otherwise default.
     */
    getFadeDistanceForLayer(layer: number): number {
        // Try to use actual spacing for this layer
        const actualSpacing = this.layerSpacings.get(layer);
        if (actualSpacing !== undefined) {
            return actualSpacing * 0.5 * CONFIG.FADE_RANGE_MULTIPLIER;
        }
        // Fallback to default
        return this.fadeDistance * CONFIG.FADE_RANGE_MULTIPLIER;
    }

    /**
     * Get the normalized position of a zoom level on the scale bar (0 = left/max zoom out, 1 = right/max zoom in).
     * This converts zoom coordinates to a visual position for easier reasoning.
     */
    private getScaleBarPosition(zoomLevel: number): number {
        const range = this.maxZoom - this.minZoom;
        if (range <= 0) return 0.5; // Fallback if range is invalid
        return (this.maxZoom - zoomLevel) / range; // Higher zoom = lower position (left = 0, right = 1)
    }

    /**
     * Get the visibility window for a layer in SCALE COORDINATES (cumulative scale factor).
     * Scale = 2^(-zoom), so:
     * - Scale 1 = L0 optimal (zoom=0)
     * - Scale 3 = L1 optimal (zoom=-log₂(3))
     * - Scale 6 = L2 optimal (zoom=-log₂(3) - log₂(2))
     *
     * Returns { minScale, maxScale } defining the visible range.
     */
    getLayerWindow(layer: number): { minScale: number; maxScale: number } {
        const allLayers = Array.from(this.layerPositions.keys());
        const minLayer = Math.min(...allLayers);
        const maxLayer = Math.max(...allLayers);
        const optimalZoom = this.getOptimalZoomForLayer(layer);
        
        let minZoom: number;
        let maxZoom_val: number;
        
        // minZoom: extend slightly left from optimal
        if (layer === minLayer) {
            // L0 only extends left slightly, not to maxZoom
            const nextLayer = layer + 1;
            if (allLayers.includes(nextLayer)) {
                const nextOptimal = this.getOptimalZoomForLayer(nextLayer);
                const spacingToNext = nextOptimal - optimalZoom;
                minZoom = optimalZoom + spacingToNext * 0.25;
            } else {
                minZoom = optimalZoom - this.fadeDistance;
            }
        } else {
            // Non-L0: extend 25% towards previous layer
            const prevLayer = layer - 1;
            const prevOptimal = this.getOptimalZoomForLayer(prevLayer);
            const spacingToPrev = prevOptimal - optimalZoom;
            minZoom = optimalZoom + spacingToPrev * 0.25;
        }
        
        // maxZoom: extend well to the right (towards next layer)
        if (layer === maxLayer) {
            // Max layer only extends right slightly, not to minZoom
            const prevLayer = layer - 1;
            const prevOptimal = this.getOptimalZoomForLayer(prevLayer);
            const spacingToPrev = prevOptimal - optimalZoom;
            maxZoom_val = optimalZoom + spacingToPrev * 0.75;
        } else {
            const nextLayer = layer + 1;
            const nextOptimal = this.getOptimalZoomForLayer(nextLayer);
            // Extend 75% of the way towards next layer
            const spacingToNext = nextOptimal - optimalZoom;
            maxZoom_val = optimalZoom + spacingToNext * 0.75;
        }
        
        const minScale = Math.pow(2, -minZoom);
        const maxScale = Math.pow(2, -maxZoom_val);
        
        return { minScale, maxScale };
    }    /**
     * Calculate distance from optimal for a layer at given zoom.
     * Negative distance = before optimal (zoomed in too much)
     * Zero distance = at optimal
     * Positive distance = after optimal (zoomed out too much)
     */
    getDistanceFromOptimal(layer: number, zoomLevel: number): number {
        const optimalZoom = this.getOptimalZoomForLayer(layer);
        return zoomLevel - optimalZoom;
    }

    /**
     * Determine if a layer is visible at given zoom.
     * Single source of truth - all visibility checks go through here.
     */
    isLayerVisible(layer: number, zoomLevel: number): boolean {
        const { minScale, maxScale } = this.getLayerWindow(layer);
        const currentScale = Math.pow(2, -zoomLevel);
        const isVisible = currentScale >= minScale && currentScale <= maxScale;
        
        if (CONFIG.DEBUG) {
            const optimalZoom = this.getOptimalZoomForLayer(layer);
            console.log(`[ScaleBar] Layer ${layer}: optimal-scale=${Math.pow(2, -optimalZoom).toFixed(2)}, window=[${minScale.toFixed(2)}, ${maxScale === Infinity ? '∞' : maxScale.toFixed(2)}], current-scale=${currentScale.toFixed(2)} → ${isVisible ? 'visible' : 'skip'}`);
        }
        
        return isVisible;
    }

    /**
     * Get normalised fade parameter (0 = fully visible, 1 = fully faded).
     * Used for opacity interpolation.
     * Min layer never fades. Other layers fade at edges (10% of window width each side).
     */
    getNormalisedFadeParameter(layer: number, zoomLevel: number): number {
        const { minScale, maxScale } = this.getLayerWindow(layer);
        const currentScale = Math.pow(2, -zoomLevel);
        const allLayers = Array.from(this.layerPositions.keys());
        const minLayer = Math.min(...allLayers);
        
        // Min layer (L0) never fades - always visible
        if (layer === minLayer) {
            return currentScale >= minScale ? 0 : 1;
        }
        
        // Outside window on left (zoomed in too much)
        if (currentScale < minScale) {
            return 1;
        }
        
        // Outside window on right (zoomed out too much)
        if (!isFinite(maxScale) && currentScale > maxScale) {
            return 1;
        }
        
        // For infinite maxScale (max layer), fade at minScale edge only
        if (!isFinite(maxScale)) {
            const globalMaxScale = Math.pow(2, -this.minZoom);
            const fadeMargin = (globalMaxScale - minScale) * 0.1;
            
            // Fade at minScale edge (left)
            if (currentScale < minScale + fadeMargin && fadeMargin > 0) {
                const distFromEdge = (minScale + fadeMargin) - currentScale;
                return Math.min(1, distFromEdge / fadeMargin);
            }
            return 0;
        }
        
        const windowWidth = maxScale - minScale;
        if (windowWidth <= 0) {
            return 0; // Invalid window, stay visible
        }
        
        const fadeMargin = windowWidth * 0.1; // 10% of window width for fade at each edge
        
        // Min layer never fades
        if (layer === minLayer) {
            return 0;
        }
        
        // Fade at minScale edge (left side)
        if (currentScale < minScale + fadeMargin) {
            const distFromEdge = (minScale + fadeMargin) - currentScale;
            return Math.min(1, distFromEdge / fadeMargin);
        }
        
        // Fade at maxScale edge (right side)
        if (currentScale > maxScale - fadeMargin) {
            const distFromEdge = currentScale - (maxScale - fadeMargin);
            return Math.min(1, distFromEdge / fadeMargin);
        }
        
        // Inside main window: fully visible
        return 0;
    }

    /**
     * Get the zoom level where labels switch from outside to inside for a layer.
     * Labels switch at 25% of the way through the window (75% from minScale).
     * This is SEPARATE from window bounds - it's just cosmetic label positioning.
     */
    getLabelSwitchZoom(layer: number): number {
        const { minScale, maxScale } = this.getLayerWindow(layer);
        
        if (maxScale === Infinity) {
            // For infinite windows, switch at 75% of fade distance
            const fadeDistance = this.getFadeDistanceForLayer(layer);
            const optimalZoom = this.getOptimalZoomForLayer(layer);
            return optimalZoom - fadeDistance * 0.75;
        }
        
        // Label switch at 25% of the way across the window (from minScale towards maxScale)
        const switchScale = minScale + (maxScale - minScale) * 0.25;
        
        // Convert back to zoom coordinates
        return -Math.log2(switchScale);
    }

    /**
     * Get the zoom level where fading starts at the minScale edge.
     * Fade checkpoint at 10% of the window from minScale (in log/zoom space).
     */
    getMinFadeCheckpoint(layer: number): number {
        const { minScale, maxScale } = this.getLayerWindow(layer);
        
        // In log space: multiply by 10% factor
        // If minScale and maxScale represent 2^(-zoom), then in zoom space:
        // minZoom = -log2(maxScale), maxZoom = -log2(minScale)
        // 10% into window from minScale (in log space)
        const minZoom = -Math.log2(maxScale);
        const maxZoom = minScale <= Number.EPSILON ? this.maxZoom : -Math.log2(minScale);
        const fadeZoom = maxZoom - (maxZoom - minZoom) * 0.1; // 10% from maxZoom towards minZoom
        return fadeZoom;
    }

    /**
     * Get the zoom level where fading starts at the maxScale edge.
     * Fade checkpoint at 10% of the window from maxScale (in log/zoom space).
     */
    getMaxFadeCheckpoint(layer: number): number {
        const { minScale, maxScale } = this.getLayerWindow(layer);
        
        // In log space: multiply by 10% factor from the other end
        // 10% into window from maxScale (in log space, towards minScale)
        const minZoom = -Math.log2(maxScale === Infinity ? Math.pow(2, -this.minZoom) : maxScale);
        const maxZoom = minScale <= Number.EPSILON ? this.maxZoom : -Math.log2(minScale);
        const fadeZoom = minZoom + (maxZoom - minZoom) * 0.1; // 10% from minZoom towards maxZoom
        return fadeZoom;
    }

    /**
     * Helper: get relative scale for a layer from metadata or default.
     */
    private getLayerScale(layer: number, layerMetadata: Map<number, LayerMetadata> | undefined, defaultScale: number): number {
        if (layerMetadata) {
            const meta = layerMetadata.get(layer);
            if (meta?.relativeScale !== undefined) {
                return meta.relativeScale;
            }
        }
        return defaultScale;
    }
}
