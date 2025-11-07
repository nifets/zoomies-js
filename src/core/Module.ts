import { Node } from './Node';
import { Edge } from './Edge';
import { HyperEdge } from './HyperEdge';
import { RectangleShape } from '../shapes/RectangleShape';
import { CircleShape } from '../shapes/CircleShape';

/**
 * Represents a hierarchical module of nodes and edges.
 * Extends Node so it can be nested within other modules.
 * Treats the recursive hierarchy as first-class: children are nodes (which can be modules).
 */
export class Module extends Node {
    children: Node[]; // Children can be Nodes or Modules (recursive)
    edges: Edge[];
    hyperEdges: HyperEdge[];
    summaryEdges: Edge[];
    summaryHyperEdges: HyperEdge[];
    collapsed: boolean;

    constructor(
        id: string,
        attributes: Record<string, any> = {}
    ) {
        super(id, attributes);
        // Children (can be Nodes or Modules recursively)
        this.children = attributes.nodes ?? attributes.children ?? [];
        this.edges = attributes.edges ?? [];
        this.hyperEdges = attributes.hyperEdges ?? [];
        this.summaryEdges = attributes.summaryEdges ?? [];
        this.summaryHyperEdges = [];
        this.collapsed = false;
    }

    /**
     * Get all leaf nodes recursively (excluding implicit).
     */
    getLeafNodes(): Node[] {
        const leaves: Node[] = [];
        for (const child of this.children) {
            if (child.implicit) continue;
            if (child instanceof Module) {
                leaves.push(...child.getLeafNodes());
            } else {
                leaves.push(child);
            }
        }
        return leaves;
    }

    /**
     * Get all modules recursively (including self).
     */
    getAllModules(): Module[] {
        const modules: Module[] = [this];
        for (const child of this.children) {
            if (child instanceof Module) {
                modules.push(...child.getAllModules());
            }
        }
        return modules;
    }

    /**
     * Collapse the module: hide internal nodes/edges, show summary edges.
     */
    collapse(): void {
        this.collapsed = true;
        this.children.forEach(child => {
            child.visible = false;
        });
        this.edges.forEach(edge => {
            edge.hidden = true;
        });
        this.hyperEdges.forEach(he => {
            he.hidden = true;
        });
    }

    /**
     * Expand the module: show internal nodes/edges, hide summary edges.
     */
    expand(): void {
        this.collapsed = false;
        this.children.forEach(child => {
            child.visible = true;
        });
        this.edges.forEach(edge => {
            edge.hidden = false;
        });
        this.hyperEdges.forEach(he => {
            he.hidden = false;
        });
    }

    /**
     * Update summary edges when module state changes.
     * Used for connecting collapsed modules to external nodes.
     */
    updateSummaryEdges(): void {
        if (!this.collapsed) return;
        // When collapsed, summary edges represent connections from/to internal nodes
    }

    setLayer(level: number): void {
        this.layer = level;
        this.children.forEach(child => {
            if (!(child instanceof Module)) {
                child.layer = level;
            }
        });
    }

    /**
     * Get visible children (recursive, accounting for collapsed state).
     */
    getVisibleChildren(): Node[] {
        if (this.collapsed) return [];
        
        const visible: Node[] = [];
        for (const child of this.children) {
            if (child.implicit) continue;
            if (child instanceof Module) {
                if (!child.collapsed) {
                    visible.push(...child.getVisibleChildren());
                } else {
                    visible.push(child);
                }
            } else {
                visible.push(child);
            }
        }
        return visible;
    }
}
