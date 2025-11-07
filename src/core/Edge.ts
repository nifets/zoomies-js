import { Node } from './Node';

/**
 * Represents an edge between nodes.
 */
export class Edge {
    id: string;
    source: Node;
    target: Node;
    attributes: Record<string, any>;
    hidden: boolean;
    alpha: number;
    detailEdges?: Edge[]; // Lower-level edges this summarizes
    sourceModule?: any; // Module containing source (for hierarchical edges)
    targetModule?: any; // Module containing target (for hierarchical edges)

    constructor(
        id: string,
        source: Node,
        target: Node,
        attributes: Record<string, any> = {}
    ) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.attributes = attributes;
        this.hidden = false;
        this.alpha = 1;
        this.detailEdges = [];
    }

    highlight(): void {
        this.attributes.highlighted = true;
    }

    unhighlight(): void {
        this.attributes.highlighted = false;
    }

    setOpacity(alpha: number): void {
        this.alpha = Math.max(0, Math.min(1, alpha));
    }

    updateAttribute(key: string, value: any): void {
        this.attributes[key] = value;
    }

    getVisibility(zoomLevel: number): number {
        // Keep edges visible if at least one node is visible
        const sourceVis = this.source.getVisibility(zoomLevel);
        const targetVis = this.target.getVisibility(zoomLevel);
        return Math.max(sourceVis, targetVis) * 0.7; // Slightly dimmer than nodes
    }
}
