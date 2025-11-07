/**
 * Main entry point for Zoomies.js library.
 */
export { Node } from './core/Node';
export { Edge } from './core/Edge';
export { HyperEdge } from './core/HyperEdge';
export { Module } from './core/Module';
export { Renderer } from './rendering/Renderer';
export { InteractionManager } from './managers/InteractionManager';
export { ZoomManager } from './managers/ZoomManager';
export { PhysicsEngine } from './managers/PhysicsEngine';
export { GraphManager } from './managers/GraphManager';

// Create a convenience class for quick initialization
import { GraphManager } from './managers/GraphManager';
import { Node } from './core/Node';
import { Edge } from './core/Edge';
import { HyperEdge } from './core/HyperEdge';
import { Module } from './core/Module';

export class Zoomies {
    manager: GraphManager;

    constructor(
        selector: string,
        options: {
            nodes?: Node[];
            edges?: Edge[];
            hyperEdges?: HyperEdge[];
            modules?: Module[];
            enablePhysics?: boolean;
        } = {}
    ) {
        const canvas = document.querySelector(selector) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas element not found: ${selector}`);
        }

        this.manager = new GraphManager(canvas);
        
        // Initialize asynchronously
        this.init(options).catch(err => {
            console.error('Failed to initialize Zoomies:', err);
        });
    }

    private async init(options: {
        nodes?: Node[];
        edges?: Edge[];
        hyperEdges?: HyperEdge[];
        modules?: Module[];
        enablePhysics?: boolean;
    }): Promise<void> {
        await this.manager.init();

        // Add initial nodes, edges, hyperedges
        if (options.nodes) {
            options.nodes.forEach(node => this.manager.addNode(node));
        }
        if (options.edges) {
            options.edges.forEach(edge => this.manager.addEdge(edge));
        }
        if (options.hyperEdges) {
            options.hyperEdges.forEach(he => this.manager.addHyperEdge(he));
        }
        if (options.modules) {
            options.modules.forEach(m => this.manager.addModule(m));
        }

        if (options.enablePhysics) {
            this.manager.enablePhysics();
        }

        this.manager.start();
    }

    addNode(node: Node): void {
        this.manager.addNode(node);
    }

    removeNode(node: Node): void {
        this.manager.removeNode(node);
    }

    addEdge(edge: Edge): void {
        this.manager.addEdge(edge);
    }

    removeEdge(edge: Edge): void {
        this.manager.removeEdge(edge);
    }

    addHyperEdge(hyperEdge: HyperEdge): void {
        this.manager.addHyperEdge(hyperEdge);
    }

    removeHyperEdge(hyperEdge: HyperEdge): void {
        this.manager.removeHyperEdge(hyperEdge);
    }

    addModule(module: Module): void {
        this.manager.addModule(module);
    }

    removeModule(module: Module): void {
        this.manager.removeModule(module);
    }

    enablePhysics(): void {
        this.manager.enablePhysics();
    }

    disablePhysics(): void {
        this.manager.disablePhysics();
    }

    setZoom(level: number): void {
        this.manager.setZoom(level);
    }

    getZoom(): number {
        return this.manager.getZoom();
    }

    on(event: string, callback: Function): void {
        this.manager.getInteractionManager().on(event, callback);
    }

    collapseModule(module: Module): void {
        this.manager.collapseModule(module);
    }

    expandModule(module: Module): void {
        this.manager.expandModule(module);
    }

    destroy(): void {
        this.manager.stop();
        this.manager.disablePhysics();
    }
}
