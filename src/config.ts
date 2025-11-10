/**
 * Global configuration constants for rendering and physics.
 * Centralised place for tweaking appearance and behaviour.
 */

export const CONFIG = {
    // ============ RENDERING ============
    
    // Base scale: converts normalized units (1.0 = standard shape) to pixels
    // A shape with normalized size 1.0 renders as this many pixels (before layer/camera scaling)
    BASE_UNIT_TO_PIXELS: 50,
    
    // Edge width scaling factor (multiplier applied to edge widths)
    // Reduce this if edges appear too thick relative to nodes
    EDGE_WIDTH_SCALE: 0.2,
    
    // Detail state styling
    DETAIL_BACKGROUND_OPACITY_TRANSPARENT: 0.15, // At optimal zoom
    DETAIL_BACKGROUND_OPACITY_OPAQUE: 1.0,       // When zoomed out
    DETAIL_LABEL_INSIDE_THRESHOLD: 0.5,           // Show label inside when detail > this
    DETAIL_SHOW_BORDER_THRESHOLD: 0.3,            // Show border when detail > this
    
    // Label font size (base, before layer scaling)
    LABEL_FONT_SIZE: 70,
    
    // Label texture resolution (higher = crisper text, but more memory)
    LABEL_TEXTURE_RESOLUTION: 4.0,
    
    // Node border stroke width (in pixels)
    NODE_BORDER_WIDTH: 12,
    
    // Node border stroke width when selected (in pixels)
    NODE_BORDER_WIDTH_SELECTED: 16,
    
    // ============ ZOOM & SCALE ============
    
    // Scale bar buffer: prevents boundary layer entities from becoming invisible
    // Must be > fadeDistance * 2
    SCALE_BAR_BUFFER_MULTIPLIER: 2.5,  // Multiplied by fadeDistance
    
    // Default layer scale factor (L1 is 3× L0, L2 is 3× L1, etc.)
    DEFAULT_LAYER_SCALE_FACTOR: 3,
    
    // Zoom sensitivity (deltaY delta per scroll event)
    ZOOM_SCROLL_SENSITIVITY: 0.1,
    
    // ============ PHYSICS ============
    
    PHYSICS: {
        baseRepulsionStrength: 50,
        targetLinkDistance: 60,
        velocityDamping: 0.01,
        substeps: 3,
        minNodeDistanceMultiplier: 2,
        overlapRepulsionStrengthMultiplier: 8.0,
        moderateDistanceRepulsionStrengthMultiplier: 1.0,
        moderateDistanceThresholdMultiplier: 2,
        centerAttractionStrength: 0.1,
        edgeAttractionStrength: 0.1,
        branchingEdgeAttractionStrength: 0.0,
        boundaryMargin: 0.9,
        minVelocityThreshold: 0.05,
        maxVelocityCap: 3,
        initialPositionRange: 400,
        initialVelocityRange: 1,
        // Reference radius for physics calculations (for scaling forces by size)
        REFERENCE_RADIUS: 15
    },
    
    // ============ DEBUG ============
    
    DEBUG: false
};
