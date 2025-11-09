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
 */
export class ScaleBar {
    /** Layer index → optimal zoom position */
    layerPositions: Map<number, number>;

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
            previousSpacing = spacing;
        }

        // Fade distance: half the spacing between layers
        this.fadeDistance = previousSpacing > 0 ? previousSpacing * 0.5 : Math.log2(defaultLayerScaleFactor) * 0.5;

        // Set zoom range with buffer
        // minZoom (most negative) = where highest layer is (most zoomed out)
        // maxZoom (most positive) = where L0 is (most zoomed in)
        // Buffer must be > fadeDistance * 2 to ensure L0 stays visible at boundaries
        const buffer = this.fadeDistance * CONFIG.SCALE_BAR_BUFFER_MULTIPLIER;
        this.minZoom = currentZoom - buffer; // currentZoom is negative for high layers
        this.maxZoom = buffer; // L0 at 0, add positive buffer
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
     * At extreme zoom: includes all layers to keep physics/interactions active.
     */
    getVisibleLayers(zoomLevel: number): number[] {
        const visibleLayers: number[] = [];
        const allLayers = Array.from(this.layerPositions.keys());
        const minLayer = Math.min(...allLayers);
        const maxLayer = Math.max(...allLayers);

        for (const layer of allLayers) {
            const distance = this.getDistanceFromOptimal(layer, zoomLevel);
            const absDistance = Math.abs(distance);
            
            // Include if within normal fade range
            if (absDistance <= this.fadeDistance * 2) {
                visibleLayers.push(layer);
            }
            // At extreme zoom in (distance < 0): keep minLayer visible
            else if (layer === minLayer && distance < 0) {
                visibleLayers.push(layer);
            }
            // At extreme zoom out (distance > 0): keep maxLayer visible
            else if (layer === maxLayer && distance > 0) {
                visibleLayers.push(layer);
            }
        }

        return visibleLayers.sort((a, b) => a - b);
    }

    /**
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
     * At extreme zoom: boundary layers stay visible to keep physics active.
     */
    isLayerVisible(layer: number, zoomLevel: number): boolean {
        const distance = this.getDistanceFromOptimal(layer, zoomLevel);
        const absDistance = Math.abs(distance);
        const allLayers = Array.from(this.layerPositions.keys());
        const minLayer = Math.min(...allLayers);
        const maxLayer = Math.max(...allLayers);
        
        // Normal visibility check
        if (absDistance <= this.fadeDistance * 2) {
            return true;
        }
        
        // At extreme zoom in (distance < 0): minLayer stays visible
        if (layer === minLayer && distance < 0) {
            return true;
        }
        
        // At extreme zoom out (distance > 0): maxLayer stays visible
        if (layer === maxLayer && distance > 0) {
            return true;
        }
        
        return false;
    }

    /**
     * Get normalised fade parameter (0 = fully in view, 1 = at window edge).
     * Used for opacity interpolation.
     */
    getNormalisedFadeParameter(layer: number, zoomLevel: number): number {
        const distance = Math.abs(this.getDistanceFromOptimal(layer, zoomLevel));
        const fadeStart = this.fadeDistance;
        const fadeEnd = this.fadeDistance * 2;

        if (distance <= fadeStart) {
            return 0; // Fully visible
        } else if (distance >= fadeEnd) {
            return 1; // Fully faded
        } else {
            // Interpolate between fadeStart and fadeEnd
            return (distance - fadeStart) / (fadeEnd - fadeStart);
        }
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
