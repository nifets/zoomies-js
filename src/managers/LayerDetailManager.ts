import { Entity } from '../core/Entity';
import { ScaleBar } from './ScaleBar';
import { CONFIG } from '../config';

/**
 * 6 presentation modes representing entity visibility state at current zoom level.
 * Ordered from zoomed-in to zoomed-out (left to right on scale bar).
 *
 * SEMANTIC MEANINGS:
 * - INVISIBLE: Entity is far beyond visibility range (scale distance too large)
 * - FADING_IN: Approaching optimal zoom from left, opacity increases 0→1
 * - EXPANDED: At/near optimal zoom, shows full detail with thin border & external label
 * - COLLAPSING: Transitioning past optimal zoom towards next layer (background opacity interpolates 0.2→1.0, label moves inside)
 * - COLLAPSED: Beyond EXPANDED, summarised view with full background opacity, label inside
 * - FADING_OUT: Far beyond, opacity decreases 1→0, approaching invisibility
 *
 * Visual progression as zoom increases (left to right):
 *   [far] → FADING_IN → EXPANDED (peak detail) → COLLAPSING → COLLAPSED → FADING_OUT → [beyond]
 */
export enum PresentationMode {
    INVISIBLE = 'INVISIBLE',
    FADING_IN = 'FADING_IN',
    EXPANDED = 'EXPANDED',
    COLLAPSING = 'COLLAPSING',
    COLLAPSED = 'COLLAPSED',
    FADING_OUT = 'FADING_OUT'
}

/**
 * Configuration for each presentation mode controlling visual rendering.
 *
 * OPACITY SYSTEM:
 * - `backgroundOpacity`: Fill transparency (0.2=semi-transparent for EXPANDED detail,
 *    1.0=opaque for COLLAPSED summary). Multiplied with node alpha: bgOpacity = backgroundOpacity * opacity
 * - `borderOpacity`: Border/outline line alpha (0.0 hidden, 1.0 fully visible)
 * - `opacity`: Node alpha, fades during FADING_IN (0→1) and FADING_OUT (1→0)
 *
 * BORDER STYLING:
 * - `showBorder`: Whether to render the border line
 * - `borderWidth`: Thickness multiplier (1.0x base, 2.0x thicker, 2.5x thickest for EXPANDED)
 *
 * LABEL POSITIONING:
 * - `labelInside`: true=label inside node, false=label outside above node
 */
interface ModeConfig {
    showBorder: boolean;
    borderOpacity: number;
    borderWidth: number;
    backgroundOpacity: number;
    labelInside: boolean;
}

/**
 * MODE_CONFIG: Complete rendering configuration for each presentation mode.
 *
 * EXPANDED (peak detail, near optimal zoom):
 *   - Semi-transparent background (0.2) shows children underneath
 *   - Full-opacity thickest border (2.5x) emphasizes boundaries
 *   - Label positioned outside above node for readability
 *
 * COLLAPSING (transitioning out of EXPANDED):
 *   - Background opacity interpolates 0.2→1.0 (blends detail→summary)
 *   - Medium-opacity thicker border (2.0x) maintains definition
 *   - Label starts moving inside node
 *
 * COLLAPSED (summary view):
 *   - Full-opacity background (1.0) provides clean summary appearance
 *   - Medium-opacity medium border (2.0x) maintains subtle definition
 *   - Label inside node to save space
 *
 * FADING_IN/FADING_OUT (edge modes):
 *   - No borders visible (opacity=0, showBorder=false)
 *   - Node opacity fades 0→1 (IN) or 1→0 (OUT)
 *   - Label positioning constant (outside for IN, inside for OUT)
 *
 * INVISIBLE (far beyond visibility):
 *   - Opacity=0, not visible
 *   - showBorder=false, backgroundOpacity=0
 */
const MODE_CONFIG: Record<PresentationMode, ModeConfig> = {
    [PresentationMode.INVISIBLE]: {
        showBorder: false,
        borderOpacity: 0,
        borderWidth: 1,
        backgroundOpacity: 0,
        labelInside: false
    },
    [PresentationMode.FADING_IN]: {
        showBorder: false,
        borderOpacity: 0,
        borderWidth: 1,
        backgroundOpacity: CONFIG.DETAIL_BACKGROUND_OPACITY_EXPANDED,
        labelInside: false
    },
    [PresentationMode.EXPANDED]: {
        showBorder: true,
        borderOpacity: 1.0,
        borderWidth: 4.0,
        backgroundOpacity: CONFIG.DETAIL_BACKGROUND_OPACITY_EXPANDED,
        labelInside: false
    },
    [PresentationMode.COLLAPSING]: {
        showBorder: true,
        borderOpacity: 1.0,
        borderWidth: 3.0,
        backgroundOpacity: CONFIG.DETAIL_BACKGROUND_OPACITY_COLLAPSED,
        labelInside: true
    },
    [PresentationMode.COLLAPSED]: {
        showBorder: true,
        borderOpacity: 1.0,
        borderWidth: 2.0,
        backgroundOpacity: CONFIG.DETAIL_BACKGROUND_OPACITY_COLLAPSED,
        labelInside: true
    },
    [PresentationMode.FADING_OUT]: {
        showBorder: false,
        borderOpacity: 0,
        borderWidth: 1,
        backgroundOpacity: CONFIG.DETAIL_BACKGROUND_OPACITY_COLLAPSED,
        labelInside: true
    }
};

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
 * Default values for layer metadata properties.
 */
const LAYER_METADATA_DEFAULTS = CONFIG.DEFAULT_LAYER_METADATA;

/**
 * Configuration for layer detail management.
 */
export interface LayerDetailConfig {
    layerScaleFactor?: number; // Default scale factor for layers without explicit relativeScale
    layerMetadata?: Map<number, LayerMetadata>; // Per-layer customisation
}

/**
 * DETAIL STATE: Complete visual configuration for rendering an entity at current zoom.
 *
 * This interface bundles all rendering properties derived from presentation mode and zoom distance.
 * Computed by `getDetailStateAtZoom()` and consumed by `Renderer.drawNode()`.
 *
 * OPACITY MECHANICS:
 * - `opacity`: Node alpha, fades 0→1 during FADING_IN and 1→0 during FADING_OUT
 *             Always 1.0 during EXPANDED/COLLAPSING/COLLAPSED
 * - `backgroundOpacity`: Fill transparency, interpolated during COLLAPSING (0.2→1.0)
 *                       Always 0.2 (EXPANDED) or 1.0 (COLLAPSED) outside COLLAPSING
 * - Final rendered background opacity: backgroundOpacity × opacity
 *   Example: EXPANDED (bgOp=0.2) + FADING_IN (opacity=0.5) → 0.1 visible transparency
 * - `borderOpacity`: Border/outline line alpha, controlled by MODE_CONFIG
 *                   0 when invisible/fading, 1.0 when visible
 * - `borderWidth`: Border thickness multiplier (1.0, 2.0, 2.5)
 *                 EXPANDED uses 2.5 for emphasis, others use 2.0
 *
 * VISIBILITY:
 * - `visible`: true if layer is in visible range at current zoom
 *             Renderer skips drawing if false
 *             Updated by `getVisibleLayers(zoom)`
 *
 * LABEL POSITIONING:
 * - `labelInside`: Label placement strategy (inside node vs outside above)
 *                 true: inside (COLLAPSED, COLLAPSING) for space efficiency
 *                 false: outside (EXPANDED, FADING_IN) for clarity
 *
 * BORDER RENDERING:
 * - `showBorder`: Whether to render the border line at all
 *                true: EXPANDED, COLLAPSING, COLLAPSED (visible detail)
 *                false: INVISIBLE, FADING_IN, FADING_OUT (no emphasis)
 *
 * DATA FLOW:
 *   Entity + zoom → determinePresentationMode() → MODE_CONFIG → DetailState
 *   DetailState → Renderer.drawNode() → [apply opacity, colors, borders]
 */
export interface DetailState {
    visible: boolean;           // Entity within visible layer range
    opacity: number;            // 0-1, node alpha (fades during FADING_IN/OUT)
    showBorder: boolean;        // Whether to draw border
    borderOpacity: number;      // 0-1, border line alpha
    borderWidth: number;        // Thickness multiplier (1.0, 2.0, 2.5)
    backgroundOpacity: number;  // 0.2 (transparent detail) or 1.0 (opaque summary)
    labelInside: boolean;       // Label inside vs outside above
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
    scaleBar: ScaleBar | null;
    layerMetadata: Map<number, LayerMetadata>;
    maxLayer: number;

    constructor(config: LayerDetailConfig = {}) {
        const { layerMetadata } = config;
        this.layerMetadata = layerMetadata ?? new Map();
        this.scaleBar = null;
        this.maxLayer = 0;
    }

    /**
     * Build and set the scale bar from layer hierarchy.
     * Must be called after determining all layers in the graph.
     */
    buildScaleBar(minLayer: number, maxLayer: number): void {
        this.maxLayer = maxLayer;
        this.scaleBar = new ScaleBar(maxLayer, this.layerMetadata);
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
        
        const scale = Math.pow(2, -zoomLevel);
        const visibleLayers: number[] = [];
        
        for (let layer = 0; layer <= this.maxLayer; layer++) {
            const segments = this.scaleBar.layerWindowSegments.get(layer);
            if (!segments) continue;
            
            // Handle NaN boundaries for first/last layers
            const fadingInMin = isNaN(segments.fadingInMin) ? 0 : segments.fadingInMin;
            const fadingOutMax = isNaN(segments.fadingOutMax) ? Infinity : segments.fadingOutMax;
            
            // Layer is visible if scale falls within fadingInMin to fadingOutMax range
            if (scale >= fadingInMin && scale <= fadingOutMax) {
                visibleLayers.push(layer);
            }
        }
        
        return visibleLayers;
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
     * Determine presentation mode based on current zoom and segment boundaries.
     * Segments are in SCALE coordinates, so we convert current zoom to scale for comparison.
     * Handles edge cases: NaN (first/last layer boundaries) and Infinity (far edges).
     */
    determinePresentationMode(zoomLevel: number, segments: any): PresentationMode {
        const currentScale = Math.pow(2, -zoomLevel);

        // Handle NaN for first layer's fadingInMin: treat as "no fading in" (always EXPANDED or beyond)
        const fadingInMin = isNaN(segments.fadingInMin) ? segments.expandedMin : segments.fadingInMin;
        
        // Handle NaN for last layer's fadingOutMax: treat as "no fading out" (always COLLAPSED or before)
        const fadingOutMax = isNaN(segments.fadingOutMax) ? segments.collapsedMax : segments.fadingOutMax;

        // Compare scale against segment boundaries (scale increases left-to-right)
        // Order: fadingInMin < expandedMin < expandedMax < collapsedMin < collapsedMax < fadingOutMax
        if (currentScale < fadingInMin) {
            return PresentationMode.INVISIBLE;
        }
        if (currentScale < segments.expandedMin) {
            return PresentationMode.FADING_IN;
        }
        if (currentScale < segments.expandedMax) {
            return PresentationMode.EXPANDED;
        }
        if (currentScale < segments.collapsedMin) {
            return PresentationMode.COLLAPSING;
        }
        if (currentScale < segments.collapsedMax) {
            return PresentationMode.COLLAPSED;
        }
        if (currentScale < fadingOutMax) {
            return PresentationMode.FADING_OUT;
        }
        return PresentationMode.INVISIBLE;
    }

    /**
     * Get node opacity (alpha) for a presentation mode.
     * Only FADING_IN and FADING_OUT interpolate opacity. COLLAPSING/EXPANDED/COLLAPSED stay at 1.0.
     * INVISIBLE is 0. Segments are in scale coordinates.
     * Handles NaN boundaries for first/last layers.
     */
    getOpacityForMode(mode: PresentationMode, zoomLevel: number, segments: any): number {
        const currentScale = Math.pow(2, -zoomLevel);

        switch (mode) {
            case PresentationMode.INVISIBLE:
                return 0;
            case PresentationMode.FADING_IN: {
                // Interpolate from 0 (at fadingInMin) to 1 (at expandedMin)
                // For first layer (NaN fadingInMin), skip fading in
                if (isNaN(segments.fadingInMin)) return 1.0;
                const progress = (currentScale - segments.fadingInMin) / (segments.expandedMin - segments.fadingInMin);
                return Math.max(0, Math.min(1, progress));
            }
            case PresentationMode.EXPANDED:
                return 1.0;
            case PresentationMode.COLLAPSING:
                // Stay fully opaque during transition. Background fill changes via MODE_CONFIG.
                return 1.0;
            case PresentationMode.COLLAPSED:
                return 1.0;
            case PresentationMode.FADING_OUT: {
                // Interpolate from 1 (at collapsedMax) to 0 (at fadingOutMax)
                // For last layer (NaN fadingOutMax), skip fading out
                if (isNaN(segments.fadingOutMax)) return 1.0;
                const progress = (currentScale - segments.collapsedMax) / (segments.fadingOutMax - segments.collapsedMax);
                return Math.max(0, Math.min(1, 1 - progress));
            }
        }
    }

    /**
     * Get background opacity for COLLAPSING mode (interpolates from expanded to collapsed).
     */
    private getCollapsingBackgroundOpacity(zoomLevel: number, segments: any): number {
        const currentScale = Math.pow(2, -zoomLevel);
        const progress = (currentScale - segments.expandedMax) / (segments.collapsedMin - segments.expandedMax);
        const clamped = Math.max(0, Math.min(1, progress));
        return CONFIG.DETAIL_BACKGROUND_OPACITY_EXPANDED + 
            (CONFIG.DETAIL_BACKGROUND_OPACITY_COLLAPSED - CONFIG.DETAIL_BACKGROUND_OPACITY_EXPANDED) * clamped;
    }

    /**
     * Get the detail state for an entity at a given zoom level.
     * Computes visibility, opacity, rendering style based on presentation mode.
     */
    getDetailStateAtZoom(entity: Entity, zoomLevel: number): DetailState {
        if (!this.scaleBar) {
            throw new Error('ScaleBar not initialized. Call buildScaleBar() first.');
        }

        const segments = this.scaleBar.layerWindowSegments.get(entity.layer);
        const mode = this.determinePresentationMode(zoomLevel, segments);
        
        // For COLLAPSING, interpolate background opacity; use MODE_CONFIG for other modes
        const modeConfig = mode === PresentationMode.COLLAPSING
            ? {
                showBorder: MODE_CONFIG[mode].showBorder,
                borderOpacity: MODE_CONFIG[mode].borderOpacity,
                borderWidth: MODE_CONFIG[mode].borderWidth,
                backgroundOpacity: this.getCollapsingBackgroundOpacity(zoomLevel, segments),
                labelInside: MODE_CONFIG[mode].labelInside
            }
            : MODE_CONFIG[mode];

        return {
            visible: mode !== PresentationMode.INVISIBLE,
            opacity: this.getOpacityForMode(mode, zoomLevel, segments),
            ...modeConfig
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
     * Get a metadata property for a layer with fallback to default.
     */
    private getLayerMetadataProperty<K extends keyof LayerMetadata>(
        layer: number,
        key: K
    ): NonNullable<LayerMetadata[K]> {
        const value = this.layerMetadata.get(layer)?.[key];
        return value ?? (LAYER_METADATA_DEFAULTS[key as keyof typeof LAYER_METADATA_DEFAULTS] as NonNullable<LayerMetadata[K]>);
    }

    /**
     * Get entity shape for a layer, falling back to default.
     */
    getLayerEntityShape(layer: number): string {
        return this.getLayerMetadataProperty(layer, 'entityShape');
    }

    /**
     * Get entity colour for a layer, falling back to default.
     */
    getLayerEntityColour(layer: number): string {
        return this.getLayerMetadataProperty(layer, 'entityColour');
    }

    /**
     * Get edge colour for a layer, falling back to default.
     */
    getLayerEdgeColour(layer: number): string {
        return this.getLayerMetadataProperty(layer, 'edgeColour');
    }

    /**
     * Get relative scale factor for a layer.
     * Uses metadata if available, otherwise defaults to global DEFAULT_LAYER_SCALE_FACTOR.
     */
    private getLayerScale(layer: number): number {
        const metadata = this.layerMetadata.get(layer);
        if (metadata?.relativeScale !== undefined) {
            return metadata.relativeScale;
        }
        return CONFIG.DEFAULT_LAYER_SCALE_FACTOR;
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
