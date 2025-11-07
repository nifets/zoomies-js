import { Node } from '../core/Node';
import { Edge } from '../core/Edge';
import { HyperEdge } from '../core/HyperEdge';
import { Module } from '../core/Module';

/**
 * Manages user interactions with the graph.
 * Handles selection, hover, and drag events.
 */
export class InteractionManager {
    selectedNodes: Node[];
    selectedModules: Module[];
    hoveredNode: Node | null;
    hoveredEdge: Edge | null;
    hoveredHyperEdge: HyperEdge | null;
    eventCallbacks: Map<string, Function[]>;

    constructor() {
        this.selectedNodes = [];
        this.selectedModules = [];
        this.hoveredNode = null;
        this.hoveredEdge = null;
        this.hoveredHyperEdge = null;
        this.eventCallbacks = new Map();
    }

    selectNode(node: Node, multi: boolean = false): void {
        if (!multi) {
            this.selectedNodes.forEach(n => n.deselect());
            this.selectedNodes = [];
        }
        if (!this.selectedNodes.includes(node)) {
            node.select();
            this.selectedNodes.push(node);
            this.emit('nodeSelected', node);
        }
    }

    deselectNode(node: Node): void {
        node.deselect();
        this.selectedNodes = this.selectedNodes.filter(n => n !== node);
        this.emit('nodeDeselected', node);
    }

    selectModule(module: Module, multi: boolean = false): void {
        if (!multi) {
            this.selectedModules.forEach(m => m.deselect());
            this.selectedModules = [];
        }
        if (!this.selectedModules.includes(module)) {
            module.select();
            this.selectedModules.push(module);
            this.emit('moduleSelected', module);
        }
    }

    deselectModule(module: Module): void {
        module.deselect();
        this.selectedModules = this.selectedModules.filter(m => m !== module);
        this.emit('moduleDeselected', module);
    }

    clearSelection(): void {
        this.selectedNodes.forEach(n => n.deselect());
        this.selectedModules.forEach(m => m.deselect());
        this.selectedNodes = [];
        this.selectedModules = [];
    }

    hoverNode(node: Node | null): void {
        if (this.hoveredNode) {
            this.hoveredNode.unhighlight();
        }
        this.hoveredNode = node;
        if (node) {
            node.highlight();
            this.emit('nodeHover', node);
        }
    }

    hoverEdge(edge: Edge | null): void {
        if (this.hoveredEdge) {
            this.hoveredEdge.unhighlight();
        }
        this.hoveredEdge = edge;
        if (edge) {
            edge.highlight();
            this.emit('edgeHover', edge);
        }
    }

    hoverHyperEdge(hyperEdge: HyperEdge | null): void {
        if (this.hoveredHyperEdge) {
            this.hoveredHyperEdge.unhighlight();
        }
        this.hoveredHyperEdge = hyperEdge;
        if (hyperEdge) {
            hyperEdge.highlight();
            this.emit('hyperEdgeHover', hyperEdge);
        }
    }

    on(event: string, callback: Function): void {
        if (!this.eventCallbacks.has(event)) {
            this.eventCallbacks.set(event, []);
        }
        this.eventCallbacks.get(event)!.push(callback);
    }

    off(event: string, callback: Function): void {
        if (this.eventCallbacks.has(event)) {
            const callbacks = this.eventCallbacks.get(event)!;
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event: string, ...args: any[]): void {
        if (this.eventCallbacks.has(event)) {
            this.eventCallbacks.get(event)!.forEach(cb => cb(...args));
        }
    }
}
