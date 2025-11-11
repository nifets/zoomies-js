import { Entity } from './Entity';
import { CONFIG } from '../config';

/**
 * Metadata about a sub-edge within a merged connection.
 * Tracks whether this sub-edge is user-supplied or synthetically generated.
 */
export interface SubEdge {
    type: 'user' | 'synthetic';
    source: Entity;
    target: Entity;
}

/**
 * Unified connection type supporting arbitrary source/target counts.
 * Replaces both Edge (1-to-1) and HyperEdge (many-to-many).
 * Can represent:
 * - Simple edges: 1 source → 1 target
 * - Reactions: N sources → M targets
 * - Any graph connection pattern
 * 
 * When multiple edges connect the same node pair, they're merged into one
 * Connection with multiple subEdges (one per actual edge).
 */
export class Connection {
    id: string;
    sources: Entity[]; // Can be 0+ entities (parent-level endpoints)
    targets: Entity[]; // Can be 0+ entities (parent-level endpoints)
    attributes: Record<string, any>;
    hidden: boolean;
    highlighted: boolean;
    alpha: number;
    detailConnections?: Connection[]; // Lower-level connections this summarizes
    subEdges: SubEdge[]; // Metadata about user vs synthetic edges that make up this connection
    normalizedWidth: number; // Width in normalized coordinates
    cumulativeScale: number; // Cumulative layer scale factor (injected by GraphManager)

    constructor(
        id: string,
        sources: Entity[] | Entity,
        targets: Entity[] | Entity,
        attributes: Record<string, any> = {}
    ) {
        this.id = id;
        // Normalize single entities to arrays
        this.sources = Array.isArray(sources) ? sources : [sources];
        this.targets = Array.isArray(targets) ? targets : [targets];
        this.attributes = attributes;
        this.hidden = false;
        this.highlighted = false;
        this.alpha = 1;
        this.detailConnections = attributes.detailConnections;
        this.subEdges = [];
        this.normalizedWidth = attributes.width ?? 1.0;
        this.cumulativeScale = 1.0;

        // Filter out implicit entities
        this.sources = this.sources.filter(e => !e.implicit);
        this.targets = this.targets.filter(e => !e.implicit);
        
        // Initialize with a single user-supplied sub-edge
        if (this.sources.length > 0 && this.targets.length > 0) {
            this.subEdges.push({
                type: 'user',
                source: this.sources[0],
                target: this.targets[0]
            });
        }
    }
    
    /**
     * Add a sub-edge to this connection (for edge merging).
     */
    addSubEdge(type: 'user' | 'synthetic', source: Entity, target: Entity): void {
        this.subEdges.push({ type, source, target });
    }

    /**
     * Get visibility at a zoom level.
     * Connection is visible if all sources AND all targets are visible.
     */
    getVisibility(zoomLevel: number): number {
        if (this.sources.length === 0 || this.targets.length === 0) {
            return 0;
        }
        const sourceVis = Math.max(...this.sources.map(e => e.getVisibility(zoomLevel)));
        const targetVis = Math.max(...this.targets.map(e => e.getVisibility(zoomLevel)));
        return Math.min(sourceVis, targetVis);
    }

    /**
     * Set opacity for rendering.
     */
    setOpacity(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    /**
     * Highlight the connection.
     */
    highlight(): void {
        this.highlighted = true;
    }

    /**
     * Remove highlight.
     */
    unhighlight(): void {
        this.highlighted = false;
    }

    /**
     * Inject cumulative layer scale from GraphManager.
     */
    setCumulativeScale(scale: number): void {
        this.cumulativeScale = scale;
    }

    /**
     * Get cached cumulative layer scale (for label rendering).
     */
    getCumulativeScale(): number {
        return this.cumulativeScale;
    }

    /**
     * Get the world-space width (for physics and rendering).
     * Edges scale the same way as nodes: (normalizedWidth × BASE_UNIT_TO_PIXELS × EDGE_WIDTH_SCALE) * cumulativeScale
     */
    getWorldWidth(): number {
        return (this.normalizedWidth * CONFIG.BASE_UNIT_TO_PIXELS * CONFIG.EDGE_WIDTH_SCALE) * this.cumulativeScale;
    }

    /**
     * Get simplified representation for serialization.
     */
    toJSON(): Record<string, any> {
        return {
            id: this.id,
            sources: this.sources.map(e => e.id),
            targets: this.targets.map(e => e.id),
            attributes: this.attributes,
            hidden: this.hidden
        };
    }
}
