import { Entity } from '../core/Entity';
import { ScaleBar } from './ScaleBar';
import { CONFIG } from '../config';

/**
 * Per-layer metadata for customisation of entity shape, colour, and scaling.
 * All fields are optional; missing fields fall back to defaults.
 */
export interface LayerMetadata {
    entityShape?: string; // Shape type identifier (e.g., 'circle', 'rectangle', or custom types)
    entityColour?: string;
    edgeColour?: string;
    relativeScale?: number; // Scale relative to the layer below (default: layerScaleFactor)
}

/**
 * Configuration for layer detail management.
 */
export interface LayerDetailConfig {
    layerScaleFactor?: number; // Default scale factor for layers without explicit relativeScale
    layerMetadata?: Map<number, LayerMetadata>; // Per-layer customisation
}

/**
 * Detail state for rendering an entity at a specific zoom level.
 */
export interface DetailState {
    visible: boolean; // Entity is within visible layer range
    opacity: number; // 0 to 1, interpolated based on distance from optimal
    showBorder: boolean; // Draw border (true when detailed)
    backgroundOpacity: number; // 0.15 (transparent) to 1.0 (opaque)
    labelInside: boolean; // Label inside node vs above it
    showChildren: boolean; // Render child entities
    collapseState: number; // 0 (fully detailed) to 1 (fully collapsed)
}

/**
 * Manages layer-based detail levels using explicit scale bar positioning.
 *
 * Concept:
 * - Each layer has a relative scale and explicit optimal zoom position
 * - Scale bar is built once from layer metadata (no auto-computation)
 * - Detail state depends on distance from optimal position (interpolation via smoothstep)
 * - Visibility, opacity, background, label position, and children rendering all interpolate smoothly
 * - Only entities within visible layers are simulated/rendered (performance optimization)
 */
export class LayerDetailManager {
    config: { layerScaleFactor: number };
    scaleBar: ScaleBar | null;
    layerMetadata: Map<number, LayerMetadata>;

    constructor(config: LayerDetailConfig = {}) {
        const { layerMetadata, ...rest } = config;
        this.config = {
            layerScaleFactor: rest.layerScaleFactor ?? 3
        };

        this.layerMetadata = layerMetadata ?? new Map();
        this.scaleBar = null;
    }

    /**
     * Build and set the scale bar from layer hierarchy.
     * Must be called after determining all layers in the graph.
     */
    buildScaleBar(minLayer: number, maxLayer: number): void {
        this.scaleBar = new ScaleBar(minLayer, maxLayer, this.layerMetadata, this.config.layerScaleFactor);
    }

    /**
     * Get the optimal zoom level for a given layer from the scale bar.
     */
    getOptimalZoomForLayer(layer: number): number {
        if (!this.scaleBar) return 0;
        return this.scaleBar.getOptimalZoomForLayer(layer);
    }

    /**
     * Determine the primary (closest) layer at given zoom level.
     */
    getPrimaryLayerAtZoom(zoomLevel: number): number {
        if (!this.scaleBar) return 0;
        return this.scaleBar.getPrimaryLayerAtZoom(zoomLevel);
    }

    /**
     * Get all layers that are at least partially visible at the given zoom level.
     */
    getVisibleLayers(zoomLevel: number): number[] {
        if (!this.scaleBar) return [];
        return this.scaleBar.getVisibleLayers(zoomLevel);
    }

    /**
     * Filter entities to only those with visible layers at current zoom.
     * Performance optimization: only simulate/render visible layers.
     */
    getVisibleEntities(allEntities: Entity[], zoomLevel: number): Entity[] {
        if (!this.scaleBar) return allEntities;
        const visibleLayers = this.getVisibleLayers(zoomLevel);
        const visibleSet = new Set(visibleLayers);
        const result = allEntities.filter(e => visibleSet.has(e.layer));
        if (CONFIG.DEBUG) {
            console.log(`[LayerDetailManager] Zoom: ${zoomLevel.toFixed(2)}, Visible layers: [${Array.from(visibleLayers).join(', ')}], Visible entities: ${result.map(e => e.id).join(', ')}`);
        }
        return result;
    }

    /**
     * Get the detail state for an entity at a given zoom level.
     * Computes visibility, opacity, rendering style based on distance from optimal.
     */
    getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
        if (!this.scaleBar) {
            return {
                visible: true,
                opacity: 1.0,
                showBorder: true,
                backgroundOpacity: 0.15,
                labelInside: false,
                showChildren: true,
                collapseState: 0
            };
        }

        // Check visibility using ScaleBar
        const isVisible = this.scaleBar.isLayerVisible(entity.layer, zoomLevel);

        if (!isVisible) {
            return {
                visible: false,
                opacity: 0,
                showBorder: false,
                backgroundOpacity: 0,
                labelInside: false,
                showChildren: false,
                collapseState: 1
            };
        }

        // Get fade parameter using ScaleBar
        const fadedParam = this.scaleBar.getNormalisedFadeParameter(entity.layer, zoomLevel);

        // Smoothstep for smooth interpolation
        const smoothstep = fadedParam * fadedParam * (3 - 2 * fadedParam);

        // Opacity: fully visible at optimal, fades out towards edges
        const opacity = Math.max(0, 1 - smoothstep);

        // Detail level: 1 = fully detailed, 0 = fully collapsed
        const detailLevel = 1 - smoothstep;

        // Get label switch zoom for this layer
        const labelSwitchZoom = this.scaleBar.getLabelSwitchZoom(entity.layer);
        const labelInside = zoomLevel <= labelSwitchZoom; // Labels inside when zoomed out past switch point

        // Determine rendering state based on fade parameter
        const isOptimal = fadedParam === 0; // At optimal
        const zoomedOut = fadedParam > 0.5; // Moving towards zoomed-out state

        if (CONFIG.DEBUG && entity.layer === 0) {
            console.log(`[LayerDetailManager] ${entity.id} L${entity.layer}: fadedParam=${fadedParam.toFixed(3)}, labelSwitchZoom=${labelSwitchZoom.toFixed(3)}, labelInside=${labelInside}`);
        }

        // At optimal: transparent background, label outside, children visible
        // Zoomed out: opaque background, label inside, children hidden (collapsing to parent)
        const backgroundOpacity = isOptimal ? CONFIG.DETAIL_BACKGROUND_OPACITY_TRANSPARENT : (zoomedOut ? CONFIG.DETAIL_BACKGROUND_OPACITY_OPAQUE * detailLevel : CONFIG.DETAIL_BACKGROUND_OPACITY_TRANSPARENT);
        const showChildren = isOptimal;
        const showBorder = detailLevel > CONFIG.DETAIL_SHOW_BORDER_THRESHOLD;

        return {
            visible: true,
            opacity: opacity,
            showBorder: showBorder,
            backgroundOpacity: backgroundOpacity,
            labelInside: labelInside,
            showChildren: showChildren,
            collapseState: 1 - detailLevel
        };
    }

    /**
     * Calculate the actual radius for a node based on its layer and relative size.
     * Scales cumulatively: radius = relativeRadius × scale[0] × ... × scale[layer]
     */
    getNodeRadiusAtLayer(relativeRadius: number, layer: number): number {
        let cumulativeScale = 1;
        for (let i = 0; i < layer; i++) {
            cumulativeScale *= this.getLayerScale(i);
        }
        return relativeRadius * cumulativeScale;
    }

    /**
     * Get entity shape for a layer, falling back to default.
     */
    getLayerEntityShape(layer: number): string {
        return this.layerMetadata.get(layer)?.entityShape ?? 'circle';
    }

    /**
     * Get entity colour for a layer, falling back to default.
     */
    getLayerEntityColour(layer: number): string {
        return this.layerMetadata.get(layer)?.entityColour ?? '#3498db';
    }

    /**
     * Get edge colour for a layer, falling back to default.
     */
    getLayerEdgeColour(layer: number): string {
        return this.layerMetadata.get(layer)?.edgeColour ?? '#95a5a6';
    }

    /**
     * Get relative scale factor for a layer.
     * Uses metadata if available, otherwise defaults to global layerScaleFactor.
     */
    private getLayerScale(layer: number): number {
        const metadata = this.layerMetadata.get(layer);
        if (metadata?.relativeScale !== undefined) {
            return metadata.relativeScale;
        }
        return this.config.layerScaleFactor;
    }

    /**
     * Get all unique layers in the entity hierarchy (recursively).
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
