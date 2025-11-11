/**
 * Global configuration constants for rendering and physics.
 * Centralised place for tweaking appearance and behaviour.
 */

export const CONFIG = {
    // ============ RENDERING ============
    
    // Base scale: converts normalized units (1.0 = standard shape) to pixels
    // A shape with normalized size 1.0 renders as this many pixels (before layer/camera scaling)
    BASE_UNIT_TO_PIXELS: 120,
    
    // Edge width scaling factor (multiplier applied to edge widths)
    // Reduce this if edges appear too thick relative to nodes
    EDGE_WIDTH_SCALE: 0.05,
    
    // Detail state styling
    DETAIL_BACKGROUND_OPACITY_EXPANDED: 0.2,    // Expanded nodes: transparent background
    DETAIL_BACKGROUND_OPACITY_COLLAPSED: 1.0,   // Collapsed nodes: opaque background
    
    // Label font size (base, before layer scaling)
    LABEL_FONT_SIZE: 28,
    
    // Edge label font size scaling (multiplier relative to node labels)
    EDGE_LABEL_FONT_SCALE: 0.5,
    
    // Edge label offset perpendicular to edge (in normalized units)
    EDGE_LABEL_OFFSET: -12,
    
    // Label texture resolution (higher = crisper text, but more memory)
    LABEL_TEXTURE_RESOLUTION: 4.0,
    
    // Node border stroke width (in pixels)
    NODE_BORDER_WIDTH: 6,
    
    // Node border stroke width when selected (in pixels)
    NODE_BORDER_WIDTH_SELECTED: 8,
    
    // ============ ZOOM & SCALE ============
    
    // Scale bar buffer: prevents boundary layer entities from becoming invisible
    // Must be > fadeDistance * 2
    SCALE_BAR_BUFFER_MULTIPLIER: 2.5,  // Multiplied by fadeDistance
    
    // Default layer scale factor (L1 is 3× L0, L2 is 3× L1, etc.)
    DEFAULT_LAYER_SCALE_FACTOR: 3,
    
    // Default layer metadata (entity appearance)
    DEFAULT_LAYER_METADATA: {
        entityShape: 'circle',
        entityColour: '#3498db',
        edgeColour: '#95a5a6',
        relativeScale: 3
    },
    ZOOM_SCROLL_SENSITIVITY: 0.03,
    
    // ============ PHYSICS ============
    
    BASE_REPULSION_STRENGTH: 700000.0,
    TARGET_LINK_DISTANCE: 60,
    VELOCITY_DAMPING: 0.01,
    PHYSICS_SUBSTEPS: 3,
    MIN_NODE_DISTANCE_MULTIPLIER: 2,
    OVERLAP_REPULSION_STRENGTH_MULTIPLIER: 100.0,
    MODERATE_DISTANCE_THRESHOLD_MULTIPLIER: 3,
    CENTER_ATTRACTION_STRENGTH: 0.1,
    EDGE_ATTRACTION_STRENGTH: 0.1,
    BRANCHING_EDGE_ATTRACTION_STRENGTH: 0.0,
    BOUNDARY_MARGIN: 0.99,
    BOUNDARY_REPULSION_STRENGTH: 10000000.0,  // Soft repulsion when child approaches parent boundary
    MIN_VELOCITY_THRESHOLD: 0.05,
    MAX_VELOCITY_CAP: 3,
    INITIAL_POSITION_RANGE: 400,
    INITIAL_VELOCITY_RANGE: 1,
    REFERENCE_RADIUS: 15,
    
    // ============ DEBUG ============
    
    DEBUG: false
};
