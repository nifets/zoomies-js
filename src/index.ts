/**
 * Main entry point for Zoomies.js library.
 * Unified hierarchy: Entity (atomic/composite) + Connection (all relationships).
 */
export { Entity } from './core/Entity';
export { Connection } from './core/Connection';
export { Renderer } from './rendering/Renderer';
export { InteractionManager } from './managers/InteractionManager';
export { ZoomManager } from './managers/ZoomManager';
export { PhysicsEngine } from './managers/PhysicsEngine';
export type { PhysicsConfig } from './managers/PhysicsEngine';
export { GraphManager } from './managers/GraphManager';
export { LayerDetailManager } from './managers/LayerDetailManager';
export type { LayerMetadata, LayerDetailConfig } from './managers/LayerDetailManager';
export { validateCompositeSize, validateCompositeHierarchy } from './utils/validation';

// Create a convenience class for quick initialization
import { GraphManager } from './managers/GraphManager';
import { Entity } from './core/Entity';
import { Connection } from './core/Connection';
import type { PhysicsConfig } from './managers/PhysicsEngine';
import type { LayerDetailConfig } from './managers/LayerDetailManager';
import { validateCompositeHierarchy } from './utils/validation';

export class Zoomies {
    manager: GraphManager;

    constructor(
        selector: string,
        entities: Entity | Entity[],
        connections: Connection[] = [],
        options: {
            enablePhysics?: boolean;
            physicsConfig?: PhysicsConfig;
            layerDetailConfig?: LayerDetailConfig;
        } = {}
    ) {
        const canvas = document.querySelector(selector) as HTMLCanvasElement;
        if (!canvas) {
            throw new Error(`Canvas element not found: ${selector}`);
        }

        this.manager = new GraphManager(canvas, options.physicsConfig, options.layerDetailConfig);
        
        // Normalize single entity (legacy) to array
        const entityList = Array.isArray(entities) ? entities : [entities];
        
        // Initialize asynchronously
        this.init(entityList, connections, options).catch(err => {
            console.error('Failed to initialize Zoomies:', err);
        });
    }

    private async init(entities: Entity[], connections: Connection[], options: { enablePhysics?: boolean }): Promise<void> {
        console.log('[Zoomies] Starting initialization...');
        
        // Validate composite hierarchy
        for (const entity of entities) {
            validateCompositeHierarchy(entity);
        }
        
        await this.manager.init();
        console.log('[Zoomies] Manager initialized');

        // Build graph from flat lists
        this.manager.buildGraph(entities, connections);
        console.log('[Zoomies] Graph built:', entities.length, 'entities,', connections.length, 'connections');

        if (options.enablePhysics) {
            console.log('[Zoomies] Enabling physics');
            this.manager.enablePhysics();
        }

        console.log('[Zoomies] Starting render loop');
        this.manager.start();
        console.log('[Zoomies] Initialization complete');
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

    collapseEntity(composite: Entity): void {
        this.manager.collapseEntity(composite);
    }

    expandEntity(composite: Entity): void {
        this.manager.expandEntity(composite);
    }

    toggleZoomDebug(): void {
        this.manager.toggleZoomDebug();
    }

    destroy(): void {
        this.manager.stop();
        this.manager.disablePhysics();
    }
}
