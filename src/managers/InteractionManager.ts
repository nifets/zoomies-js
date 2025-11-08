import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';

/**
 * Manages user interactions with the graph.
 * Handles selection, hover, and drag events.
 */
export class InteractionManager {
    selectedNodes: Entity[];
    hoveredNode: Entity | null;
    hoveredConnection: Connection | null;
    eventCallbacks: Map<string, Function[]>;

    constructor() {
        this.selectedNodes = [];
        this.hoveredNode = null;
        this.hoveredConnection = null;
        this.eventCallbacks = new Map();
    }

    selectNode(node: Entity, multi: boolean = false): void {
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

    deselectNode(node: Entity): void {
        node.deselect();
        this.selectedNodes = this.selectedNodes.filter(n => n !== node);
        this.emit('nodeDeselected', node);
    }

    clearSelection(): void {
        this.selectedNodes.forEach(n => n.deselect());
        this.selectedNodes = [];
    }

    hoverNode(node: Entity | null): void {
        if (this.hoveredNode) {
            this.hoveredNode.unhighlight();
        }
        this.hoveredNode = node;
        if (node) {
            node.highlight();
            this.emit('nodeHover', node);
        }
    }

    hoverConnection(connection: Connection | null): void {
        if (this.hoveredConnection) {
            this.hoveredConnection.unhighlight();
        }
        this.hoveredConnection = connection;
        if (connection) {
            connection.highlight();
            this.emit('connectionHover', connection);
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
