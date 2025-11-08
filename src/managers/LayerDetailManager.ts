import { Entity } from '../core/Entity';

/**
 * Configuration for layer detail management.
 */
export interface LayerDetailConfig {
    layerScaleFactor?: number;
    zoomRangeMin?: number;
    zoomRangeMax?: number;
    fadeStartRatio?: number;
    labelInsideThreshold?: number;
    maxLayerMinOpacity?: number;
    zoomBuffer?: number;
    showBorderThreshold?: number;
    detailedBgOpacity?: number;
    collapsedBgOpacity?: number;
    showChildrenThreshold?: number;
}

/**
 * Default layer detail configuration.
 */
const DEFAULT_LAYER_DETAIL_CONFIG: Required<LayerDetailConfig> = {
    layerScaleFactor: 5,
    zoomRangeMin: -3,
    zoomRangeMax: 3,
    fadeStartRatio: 0.7,
    labelInsideThreshold: 0.4,
    maxLayerMinOpacity: 0.3,
    zoomBuffer: 2,
    showBorderThreshold: 0.7,
    detailedBgOpacity: 0.15,
    collapsedBgOpacity: 1.0,
    showChildrenThreshold: 0.5,
};

/**
 * Manages layer-based detail levels in the visualization.
 * 
 * Concept:
 * - Each layer has a relative scale (layer 0 = 1x, layer 1 = 5x diameter, etc.)
 * - Zoom level maps to layer-space using logarithmic scaling
 * - A "zoom window" defines how many layers are visible at once
 * - Within the window, opacity and detail interpolate smoothly based on distance from center
 * - Only entities within the visible layer range are simulated/rendered (performance optimization)
 */
export class LayerDetailManager {
    config: Required<LayerDetailConfig>;
    minLayer: number;
    maxLayer: number;
    layerOffset: number;
    
    constructor(config: LayerDetailConfig = {}) {
        // Merge user config with defaults
        this.config = { ...DEFAULT_LAYER_DETAIL_CONFIG, ...config };
        
        this.minLayer = 0;
        this.maxLayer = 10; // Default, will be updated by setHierarchyLayers()
        this.layerOffset = 0; // Will be calculated based on zoom range and layer range
        this.updateLayerOffset();
    }

    /**
     * Get zoom units per layer (auto-computed from layerScaleFactor).
     * Zoom uses base 2, so if nodes are layerScaleFactor times larger per layer,
     * we need log₂(layerScaleFactor) zoom units to traverse one layer.
     */
    private getZoomPerLayer(): number {
        return Math.log2(this.config.layerScaleFactor);
    }

    /**
     * Get the zoom window size (auto-computed from layerScaleFactor).
     * Window size proportional to layer scale: how many layers visible at once.
     */
    private getZoomWindowSize(): number {
        return Math.log2(this.config.layerScaleFactor) * 3;
    }

    /**
     * Calculate layer offset to map zoom range to layer range.
     * 
     * Key insight: Camera zoom is base 2, but layers scale at a different rate.
     * If nodes are layerScaleFactor times larger per layer, then:
     * - Moving between layers requires changing camera scale by layerScaleFactor
     * - In zoom-space (base 2): log₂(layerScaleFactor) zoom units per layer
     * 
     * Mapping equation (inverted so higher zoom = lower layers):
     *   layer = layerOffset - (zoomLevel / log₂(layerScaleFactor))
     * 
     * We solve for layerOffset so that at zoomRangeMax, layer = minLayer:
     *   minLayer = layerOffset - (zoomRangeMax / log₂(layerScaleFactor))
     *   layerOffset = minLayer + (zoomRangeMax / log₂(layerScaleFactor))
     * 
     * And verify at zoomRangeMin, layer = maxLayer:
     *   maxLayer = layerOffset - (zoomRangeMin / log₂(layerScaleFactor))  ✓
     */
    private updateLayerOffset(): void {
        const log2LayerScale = Math.log2(this.config.layerScaleFactor);
        
        // Offset ensures that at zoomRangeMax (zoomed in), we see minLayer (detailed)
        this.layerOffset = this.minLayer + (this.config.zoomRangeMax / log2LayerScale);
    }

    /**
     * Set the hierarchy layers so offset can be calculated correctly.
     * Automatically calculates required zoom range to fit all layers.
     */
    setHierarchyLayers(minLayer: number, maxLayer: number): void {
        this.minLayer = minLayer;
        this.maxLayer = maxLayer;
        
        // Calculate required zoom range to fit all layers
        // With a buffer on both sides so you can zoom past the extremes
        const log2LayerScale = Math.log2(this.config.layerScaleFactor);
        const zoomUnitsNeeded = (maxLayer - minLayer) * log2LayerScale / this.getZoomPerLayer();
        
        // Start zoom at 1.0 (fixed)
        const initialZoom = 1.0;
        
        // Calculate min/max based on layer range
        this.config.zoomRangeMin = initialZoom - (zoomUnitsNeeded / 2) - this.config.zoomBuffer;
        this.config.zoomRangeMax = initialZoom + (zoomUnitsNeeded / 2) + this.config.zoomBuffer;
        
        this.updateLayerOffset();
    }

    /**
     * Get the optimal zoom level for a given layer (center of its zoom window).
     * Higher zoom = lower (more detailed) layers.
     * Mapping: layer = layerOffset - (zoomLevel / log₂(layerScaleFactor))
     * Solving for zoomLevel: zoomLevel = (layerOffset - layer) * log₂(layerScaleFactor)
     */
    getOptimalZoomForLayer(layer: number): number {
        const log2LayerScale = Math.log2(this.config.layerScaleFactor);
        return (this.layerOffset - layer) * log2LayerScale;
    }

    /**
     * Determine which layer is most prominent at the given zoom level.
     * Higher zoom = lower layers (more detail).
     * Mapping: layer = layerOffset - (zoomLevel / log₂(layerScaleFactor))
     */
    getPrimaryLayerAtZoom(zoomLevel: number): number {
        const log2LayerScale = Math.log2(this.config.layerScaleFactor);
        const layer = this.layerOffset - (zoomLevel / log2LayerScale);
        return Math.round(layer);
    }

    /**
     * Get the range of layers that are visible at the given zoom level.
     * Returns min and max layer indices to process.
     * Clamped so that maxLayer is always visible (at minimum opacity at window edge).
     */
    getVisibleLayerRange(zoomLevel: number): { min: number; max: number } {
        const centerLayer = this.getPrimaryLayerAtZoom(zoomLevel);
        const windowRadius = this.getZoomWindowSize() / 2;
        let min = Math.floor(centerLayer - windowRadius);
        let max = Math.ceil(centerLayer + windowRadius);
        
        // Clamp so maxLayer is always in range (even if barely visible at window edge)
        if (max < this.maxLayer) {
            max = this.maxLayer;
        }
        
        return { min, max };
    }

    /**
     * Filter entities to only those within the visible layer range.
     * This optimizes performance by only simulating/rendering relevant layers.
     */
    getVisibleEntities(allEntities: Entity[], zoomLevel: number): Entity[] {
        const range = this.getVisibleLayerRange(zoomLevel);
        return allEntities.filter(e => e.layer >= range.min && e.layer <= range.max);
    }

    /**
     * Get the detail state for an entity at a given zoom level.
     * Includes visibility, opacity, rendering style, and detail interpolation.
     */
    getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
        const optimalZoom = this.getOptimalZoomForLayer(entity.layer);
        
        // Distance from window center in zoom-space
        const distanceFromCenter = Math.abs(zoomLevel - optimalZoom);
        
        // Window radius in zoom-space (layer-space window size converted to zoom-space)
        const log2LayerScale = Math.log2(this.config.layerScaleFactor);
        const windowRadiusZoom = (this.getZoomWindowSize() / 2) * log2LayerScale;
        
        // Is this entity within the visible window?
        const isVisible = distanceFromCenter <= windowRadiusZoom;
        
        // Opacity: keep full opacity for most of the window, drop sharply at edges
        // Only fade in the outer (1 - fadeStartRatio) portion of the window distance
        const fadeStartDistance = windowRadiusZoom * this.config.fadeStartRatio;
        const normalizedFadeDistance = Math.max(0, Math.min(1, (distanceFromCenter - fadeStartDistance) / (windowRadiusZoom - fadeStartDistance)));
        
        // Smoothstep in the fade region: stays high in the main region, drops sharply at edge
        const smoothstep = 1 - (normalizedFadeDistance * normalizedFadeDistance * (3 - 2 * normalizedFadeDistance));
        let opacity = Math.max(0, smoothstep);
        
        // Ensure maxLayer always has at least minimum opacity (never fully fades out)
        if (entity.layer === this.maxLayer) {
            opacity = Math.max(this.config.maxLayerMinOpacity, opacity);
        }
        
        // Detail level: based on normalized distance from center (independent of opacity fade)
        // Normalized from 0 (at center) to 1 (at window edge)
        const normalizedDetailDistance = Math.min(1, distanceFromCenter / windowRadiusZoom);
        const detailLevel = 1 - normalizedDetailDistance;
        
        return {
            visible: isVisible,
            opacity: opacity,
            showBorder: detailLevel > this.config.showBorderThreshold,
            backgroundOpacity: this.config.detailedBgOpacity + (1 - detailLevel) * (this.config.collapsedBgOpacity - this.config.detailedBgOpacity),
            labelInside: detailLevel < this.config.labelInsideThreshold,
            showChildren: detailLevel > this.config.showChildrenThreshold,
            collapseState: 1 - detailLevel
        };
    }

    /**
     * Calculate the actual radius for a node based on its layer and relative size.
     * User specifies relative size (default 1), we scale by layer factor.
     */
    getNodeRadiusAtLayer(relativeRadius: number, layer: number): number {
        // Each layer scales by layerScaleFactor (exponential)
        const layerScale = Math.pow(this.config.layerScaleFactor, layer);
        return relativeRadius * layerScale;
    }

    /**
     * Get all unique layers in the entity hierarchy.
     */
    getLayersInHierarchy(entities: Entity[]): number[] {
        const layers = new Set<number>();
        
        const collectLayers = (entity: Entity) => {
            layers.add(entity.layer);
            if (entity.isComposite?.()) {
                entity.children.forEach(child => collectLayers(child));
            }
        };
        
        entities.forEach(e => collectLayers(e));
        return Array.from(layers).sort((a, b) => a - b);
    }
}

/**
 * Detail state for rendering an entity at a specific zoom level.
 */
export interface DetailState {
    visible: boolean; // Entity is within visible layer range
    opacity: number; // 0 to 1, interpolated based on distance from window center
    showBorder: boolean; // Draw border (true when detailed)
    backgroundOpacity: number; // 0.15 (transparent) to 1.0 (opaque)
    labelInside: boolean; // Label inside node vs above it
    showChildren: boolean; // Render child entities
    collapseState: number; // 0 (fully detailed) to 1 (fully collapsed)
}
