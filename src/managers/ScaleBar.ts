import { LayerMetadata } from './LayerDetailManager';
import { CONFIG } from '../config';

/**
 * LAYER WINDOW SEGMENTS: Presentation mode boundaries for a single layer in SCALE COORDINATES.
 *
 * COORDINATE SYSTEM:
 * - scale = 2^(-zoom), monotonically increasing as zoom becomes more negative
 * - scale = 0.5 → zoom = 1 (zoomed in)
 * - scale = 1.0 → zoom = 0 (reference)
 * - scale = 2.0 → zoom = -1 (zoomed out)
 * - scale = ∞ → zoom = -∞ (far zoomed out)
 *
 * ORDERING (left to right visually, low scale → high scale):
 *   [0] fadingInMin [0] expandedMin [0] expandedMax [0] collapsedMin [0] collapsedMax [0] fadingOutMax
 *    ← zoomed in (higher zoom, more detail)    zoomed out (lower zoom, less detail) →
 *
 * 6 REGIONS (ordered by scale):
 *   1. INVISIBLE        [0, fadingInMin)           - Too zoomed in, entity not visible
 *   2. FADING_IN        [fadingInMin, expandedMin) - Approaching optimal, alpha increases 0→1
 *   3. EXPANDED         [expandedMin, expandedMax) - At optimal zoom, peak detail visible
 *   4. COLLAPSING       [expandedMax, collapsedMin)- Transitioning to summary, details fade
 *   5. COLLAPSED        [collapsedMin, collapsedMax)- Summary view, opaque background
 *   6. FADING_OUT       [collapsedMax, fadingOutMax)- Zooming out beyond, alpha decreases 1→0
 *   7. INVISIBLE (right) [fadingOutMax, ∞)        - Too zoomed out, entity invisible
 *
 * SPECIAL CASES (EDGE LAYERS):
 * - Layer 0 (first/most detailed):  fadingInMin = NaN (no region to the left, can't zoom in further)
 *                                   collapsedMin/Max = next layer's expandedMin/Max
 * - Layer N (last/most abstract):   fadingOutMax = NaN (no region to the right, can't zoom out further)
 *                                   collapsedMin/Max = previous layer's expandedMin/Max (extended)
 *
 * NaN SEMANTICS:
 * - NaN fadingInMin for L0: "No FADING_IN region, EXPANDED starts immediately"
 *   → Handled downstream: determinePresentationMode() treats NaN as "skip region"
 * - NaN fadingOutMax for LN: "No FADING_OUT region, FADING_OUT extends to infinity"
 *   → Handled downstream: getVisibleLayers() treats NaN as ±∞ boundary
 *
 * CONSTRUCTION:
 * - Built by ScaleBar.computeAllLayerWindows() in 4 passes:
 *   1. expandedMin/Max: Around optimal zoom (±25% log-spacing)
 *   2. collapsedMin/Max: Next layer's expanded or extended for last layer
 *   3. fadingInMin: Previous layer's expandedMax or NaN for first layer
 *   4. fadingOutMax: Next layer's collapsedMin or NaN for last layer
 */
export interface LayerWindowSegments {
    fadingInMin: number;        // Start of FADING_IN (scale), NaN for L0
    expandedMin: number;        // Start of EXPANDED (optimal zoom scale)
    expandedMax: number;        // End of EXPANDED (start COLLAPSING)
    collapsedMin: number;       // Start of COLLAPSED (end COLLAPSING)
    collapsedMax: number;       // End of COLLAPSED (start FADING_OUT)
    fadingOutMax: number;       // End of FADING_OUT (scale), NaN for last layer
}

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
 * ZOOM DIRECTION REFERENCE (where scale = 2^(-zoom)):
 * - Higher/more positive zoom = lower scale = zoomed IN (LEFT on scale bar, see less)
 * - Lower/more negative zoom = higher scale = zoomed OUT (RIGHT on scale bar, see more)
 * - L0 optimal: zoom=0, scale=1 (mid-position)
 * - L1 optimal: zoom=-log₂(3)≈-1.585, scale=3 (right of L0, more abstract)
 * - L2 optimal: zoom≈-3.17, scale≈9 (further right, even more abstract)
 *
 * LAYER VISIBILITY WINDOWS:
 * Each layer has a window [minScale, maxScale] where it's visible with fading at edges.
 * Window extends asymmetrically around optimal zoom:
 * - minZoom (left/zoomed-in): extends 25% towards previous layer (or maxZoom for L0)
 * - maxZoom (right/zoomed-out): extends 75% towards next layer (or minZoom for max layer)
 *
 * Example with 3 layers (L0 at 0, L1 at -1.585, L2 at -3.17):
 * - L0 window: extends left slightly, right 75% towards L1 at -1.585
 * - L1 window: extends left 25% towards L0, right 75% towards L2
 * - L2 window: extends left 25% towards L1, right to minZoom (far right)
 *
 * Fading:
 * - L0 never fades (always fully opaque when in window)
 * - Other layers: fade at window edges (checkpoints at 10% into window from edges)
 * - Creates smooth crossfading: L0 visible most of L1's window, L1 visible most of L2's window
 */
export class ScaleBar {
    /** Layer index → optimal zoom position */
    layerPositions: Map<number, number>;

    /** Layer index → spacing to next layer (for fade calculations) */
    layerSpacings: Map<number, number>;

    /** Layer index → pre-computed window segments (6 boundaries in zoom space) */
    layerWindowSegments: Map<number, LayerWindowSegments>;

    /** Minimum zoom level (fully zoomed out) */
    minZoom: number;

    /** Maximum zoom level (fully zoomed in) */
    maxZoom: number;

    /** Fade distance around each optimal point (half the layer spacing) */
    fadeDistance: number;

    constructor(
        maxLayer: number,
        layerMetadata: Map<number, LayerMetadata> | undefined
    ) {
        this.layerPositions = new Map();
        this.layerSpacings = new Map();
        this.layerWindowSegments = new Map();
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
            const relativeScale = this.getLayerScale(layer - 1, layerMetadata, CONFIG.DEFAULT_LAYER_SCALE_FACTOR);
            const spacing = Math.log2(relativeScale);
            currentZoom -= spacing; // Subtract to zoom out (lower camera scale)
            this.layerPositions.set(layer, currentZoom);
            this.layerSpacings.set(layer - 1, spacing); // Store spacing for layer transition
            previousSpacing = spacing;
        }

        // Fade distance: based on default layer scale factor (consistent regardless of actual layers)
        const defaultSpacing = Math.log2(CONFIG.DEFAULT_LAYER_SCALE_FACTOR);
        this.fadeDistance = defaultSpacing * 0.5;

        // Set zoom range with buffer
        // Buffer must scale with total depth to keep minZoom fixed regardless of number of layers
        const totalDepth = Math.abs(currentZoom);
        const baseBuffer = this.fadeDistance * CONFIG.SCALE_BAR_BUFFER_MULTIPLIER;
        const buffer = totalDepth + baseBuffer;
        this.minZoom = -buffer; // Scaled minimum zoom
        this.maxZoom = baseBuffer; // Maximum zoom buffer (L0 at 0)

        // Compute all layer window segments globally
        this.computeAllLayerWindows();
    }

        /**
     * Compute layer window segments with constraint solving.
     * Works in SCALE SPACE using geometric progression:
     * - Uses actual layer spacings from layerSpacings map
     * - Each layer has a distinct zone size based on spacing to next layer
     * - CONSTRAINT: L(n).fadingOutMax == L(n+1).collapsedMin (adjacent layers connect)
     */
    private computeAllLayerWindows(): void {
        const allLayers = Array.from(this.layerPositions.keys()).sort((a, b) => a - b);
        if (allLayers.length === 0) return;

        const OFFSET = -1.0
        const SCALING = 0.3

        // Special case: single layer
        if (allLayers.length === 1) {
            const layer = allLayers[0];
            const optimalZoom = this.getOptimalZoomForLayer(layer);
            const optimalScale = Math.pow(2, -optimalZoom);
            const logSpacing = this.layerSpacings.get(layer) ?? Math.log2(CONFIG.DEFAULT_LAYER_SCALE_FACTOR);
            
            const expandRadiusLog = logSpacing * SCALING;
            const expandedMaxLog = Math.log(optimalScale) + expandRadiusLog + OFFSET;
            
            this.layerWindowSegments.set(layer, {
                fadingInMin: NaN,
                expandedMin: 0,
                expandedMax: Math.exp(expandedMaxLog),
                collapsedMin: Math.exp(expandedMaxLog),
                collapsedMax: Infinity,
                fadingOutMax: NaN
            });


            return;
        }

        // Pass 1: Compute EXPANDED bounds for all layers
        const expandedBounds = new Map<number, { minScale: number; maxScale: number }>();
        
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            const optimalZoom = this.getOptimalZoomForLayer(layer);
            const optimalScale = Math.pow(2, -optimalZoom);
            const logSpacing = this.layerSpacings.get(layer) ?? Math.log2(CONFIG.DEFAULT_LAYER_SCALE_FACTOR);
            
            const expandRadiusLog = logSpacing * SCALING;
            const expandedMinLog = Math.log(optimalScale) - expandRadiusLog + OFFSET;
            const expandedMaxLog = Math.log(optimalScale) + expandRadiusLog + OFFSET;
            
            // First layer's EXPANDED starts at scale=0 (zoom=∞, fully zoomed in)
            const isFirstLayer = i === 0;
            const minScale = isFirstLayer ? 0 : Math.exp(expandedMinLog);
            
            expandedBounds.set(layer, {
                minScale,
                maxScale: Math.exp(expandedMaxLog)
            });
        }

        // Pass 2: Compute COLLAPSED bounds for all layers
        const collapsedBounds = new Map<number, { minScale: number; maxScale: number }>();
        
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            const isLastLayer = i === allLayers.length - 1;
            
            if (isLastLayer) {
                // Last layer: extend collapsed bounds beyond expanded using log spacing
                const curExpanded = expandedBounds.get(layer)!;
                const logSpacing = this.layerSpacings.get(layer) ?? Math.log2(CONFIG.DEFAULT_LAYER_SCALE_FACTOR);
                
                // Extend collapsed min by log spacing from expanded max
                const collapsedMinScale = curExpanded.maxScale * Math.pow(2, logSpacing * 0.5);
                
                collapsedBounds.set(layer, { minScale: collapsedMinScale, maxScale: Infinity });
            } else {
                // COLLAPSED = next layer's EXPANDED
                const nextExpanded = expandedBounds.get(allLayers[i + 1])!;
                collapsedBounds.set(layer, {
                    minScale: nextExpanded.minScale,
                    maxScale: nextExpanded.maxScale
                });
            }
        }

        // Pass 3: Compute FADING_IN bounds for all layers
        const fadingInMin = new Map<number, number>();
        
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            const isFirstLayer = i === 0;
            
            if (isFirstLayer) {
                // First layer: placeholder NaN, will be set at end
                fadingInMin.set(layer, NaN);
            } else {
                // FADING_IN = previous layer's EXPANDED max
                const prevExpanded = expandedBounds.get(allLayers[i - 1])!;
                fadingInMin.set(layer, prevExpanded.maxScale);
            }
        }

        // Pass 4: Compute FADING_OUT bounds for all layers
        const fadingOutMax = new Map<number, number>();
        
        for (let i = 0; i < allLayers.length; i++) {
            const layer = allLayers[i];
            const isLastLayer = i === allLayers.length - 1;
            
            if (isLastLayer) {
                // Last layer: placeholder NaN, will be set at end
                fadingOutMax.set(layer, NaN);
            } else {
                // FADING_OUT = next layer's COLLAPSED min
                const nextCollapsed = collapsedBounds.get(allLayers[i + 1])!;
                fadingOutMax.set(layer, nextCollapsed.minScale);
            }
        }

        // Assemble all segments
        for (const layer of allLayers) {
            const expanded = expandedBounds.get(layer)!;
            const collapsed = collapsedBounds.get(layer)!;
            
            // Segments are stored with boundaries in scale order (monotonically increasing)
            this.layerWindowSegments.set(layer, {
                fadingInMin: fadingInMin.get(layer)!,
                expandedMin: expanded.minScale,
                expandedMax: expanded.maxScale,
                collapsedMin: collapsed.minScale,
                collapsedMax: collapsed.maxScale,
                fadingOutMax: fadingOutMax.get(layer)!
            });
        }
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
