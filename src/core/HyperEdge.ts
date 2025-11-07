import { Node } from './Node';

/**
 * Represents a hyperedge connecting multiple sources to multiple targets.
 * Implicit nodes (e.g., catalysts) are excluded from rendering and hyperedge calculations.
 */
export class HyperEdge {
    id: string;
    sources: Node[];
    targets: Node[];
    attributes: Record<string, any>;
    hidden: boolean;
    alpha: number;

    constructor(
        id: string,
        sources: Node[],
        targets: Node[],
        attributes: Record<string, any> = {}
    ) {
        this.id = id;
        // Filter out implicit nodes from visible hyperedges
        this.sources = sources.filter(n => !n.implicit);
        this.targets = targets.filter(n => !n.implicit);
        this.attributes = attributes;
        this.hidden = false;
        this.alpha = 1;
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

    /**
     * Summarize hyperedge with new sources and targets (used when modules collapse).
     */
    summarize(newSources: Node[], newTargets: Node[]): void {
        this.sources = newSources.filter(n => !n.implicit);
        this.targets = newTargets.filter(n => !n.implicit);
    }

    getVisibility(zoomLevel: number): number {
        if (this.sources.length === 0 || this.targets.length === 0) {
            return 0;
        }
        const sourceVis = Math.max(...this.sources.map(n => n.getVisibility(zoomLevel)));
        const targetVis = Math.max(...this.targets.map(n => n.getVisibility(zoomLevel)));
        return Math.min(sourceVis, targetVis);
    }
}
