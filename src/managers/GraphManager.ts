import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';
import { Renderer } from '../rendering/Renderer';
import { InteractionManager } from './InteractionManager';
import { ZoomManager } from './ZoomManager';
import { PhysicsEngine, PhysicsConfig } from './PhysicsEngine';
import { LayerDetailManager, LayerDetailConfig } from './LayerDetailManager';
import { ZoomDebugWidget } from '../debug/ZoomDebugWidget';
import { CONFIG } from '../config';

/**
 * Main graph manager and scene controller.
 * Works with flat lists of entities and connections.
 */
export class GraphManager {
    root: Entity | null;
    entities: Entity[];
    allConnections: Connection[];
    renderer: Renderer;
    interactionManager: InteractionManager;
    zoomManager: ZoomManager;
    physicsEngine: PhysicsEngine;
    layerDetailManager: LayerDetailManager;
    zoomDebugWidget: ZoomDebugWidget | null;
    canvas: HTMLCanvasElement;
    isPhysicsEnabled: boolean;
    animationFrameId: number | null;
    lastZoom: number;
    draggedNode: Entity | null;
    pinnedNodes: Set<Entity>;
    isPanning: boolean;
    panStartX: number;
    panStartY: number;
    offsetStartX: number;
    offsetStartY: number;
    renderConfig: Record<string, any>;

    constructor(canvas: HTMLCanvasElement, physicsConfig?: PhysicsConfig, layerDetailConfig?: LayerDetailConfig) {
        this.canvas = canvas;
        this.root = null;
        this.entities = [];
        this.allConnections = [];
        this.zoomManager = new ZoomManager(0, -3, 3);
        this.layerDetailManager = new LayerDetailManager(layerDetailConfig ?? {
            layerScaleFactor: 3
        });
        this.renderer = new Renderer(canvas, this.zoomManager, this.layerDetailManager);
        this.interactionManager = new InteractionManager();
        this.physicsEngine = new PhysicsEngine(physicsConfig);
        this.zoomDebugWidget = null;
        this.isPhysicsEnabled = false;
        this.animationFrameId = null;
        this.lastZoom = 0;
        this.draggedNode = null;
        this.pinnedNodes = new Set();
        this.isPanning = false;
        this.panStartX = 0;
        this.panStartY = 0;
        this.offsetStartX = 0;
        this.offsetStartY = 0;
        this.renderConfig = {};

        this.bindInteractions();
    }

    async init(): Promise<void> {
        await this.renderer.init();
        
        // Set up zoom manager callback for both zoom and focused camera adjustment
        this.zoomManager.onZoomChange = (zoomLevel: number) => {
            const cameraScale = Math.pow(2, zoomLevel);
            
            // If focused zoom is active, adjust camera to keep focus point under cursor
            if (this.zoomManager.focusPoint) {
                const prevScale = Math.pow(2, this.zoomManager.prevZoom);
                const scaleChange = cameraScale / prevScale;
                
                this.renderer.offsetX = this.zoomManager.focusPoint.x + (this.renderer.offsetX - this.zoomManager.focusPoint.x) * scaleChange;
                this.renderer.offsetY = this.zoomManager.focusPoint.y + (this.renderer.offsetY - this.zoomManager.focusPoint.y) * scaleChange;
            }
            
            this.renderer.setCamera(cameraScale, this.renderer.offsetX, this.renderer.offsetY);
            this.updateVisibility();
        };
    }

    /**
     * Build the graph from flat lists: entities and connections.
     * - Populates entity.connections with edges they're involved in
     * - Populates entity.internalConnections for edges between their children
     * - Generates synthetic edges from parent-child relationships
     * - Merges user + synthetic edges that connect the same node pairs
     * - Builds scale bar from layer hierarchy
     *
     * Call this after creating entities and connections, before physics/rendering.
     */
    buildGraph(entities: Entity[], connections: Connection[]): void {
        console.log('[GraphManager] buildGraph called');
        // Store the flat lists
        this.entities = entities;
        this.allConnections = connections;

        // Calculate min/max layers in hierarchy and build scale bar
        const layers = this.layerDetailManager.getLayersInHierarchy(entities);
        if (layers.length > 0) {
            const minLayer = Math.min(...layers);
            const maxLayer = Math.max(...layers);
            this.layerDetailManager.buildScaleBar(minLayer, maxLayer);

            // Update ZoomManager's range from scale bar
            const scaleBar = this.layerDetailManager.scaleBar;
            if (scaleBar) {
                this.zoomManager.minZoom = scaleBar.minZoom;
                this.zoomManager.maxZoom = scaleBar.maxZoom;
            }
            
            // Scale entity sizes based on layer
            // Recreate shapes at the scaled size for this layer
            for (const entity of entities) {
                const scaleFactor = this.layerDetailManager.getNodeRadiusAtLayer(1, entity.layer);
                entity.labelSize = CONFIG.LABEL_FONT_SIZE * scaleFactor;
                entity.recreateShapeAtScale(scaleFactor);
                console.log(`[GraphManager] Scaled ${entity.id} (L${entity.layer}): scale factor ${scaleFactor}`);
            }
        }

        // For each entity, collect all connections that involve it
        for (const entity of entities) {
            entity.connections = connections.filter(conn =>
                this.connectionTouchesEntity(conn, entity)
            );

            // For composites, collect internal connections (between children)
            if (entity.isComposite()) {
                const childIds = new Set(entity.children.map(c => c.id));
                entity.internalConnections = connections.filter(conn =>
                    conn.sources.length > 0 && conn.targets.length > 0 &&
                    childIds.has(conn.sources[0].id) &&
                    childIds.has(conn.targets[0].id)
                );
            }
        }

        // Generate synthetic edges from hierarchy
        const syntheticEdges = this.generateSyntheticEdges(entities);

        // Merge user and synthetic edges that connect the same node pairs
        this.mergeConnections(connections, syntheticEdges);
    }
    
    /**
     * Check if a connection touches an entity (directly or through its children).
     */
    private connectionTouchesEntity(conn: Connection, entity: Entity): boolean {
        if (conn.sources.length === 0 || conn.targets.length === 0) return false;
        
        // Direct connection to this entity
        if (conn.sources.includes(entity) || conn.targets.includes(entity)) {
            return true;
        }
        
        // Connection between children of this entity
        const childIds = new Set(entity.children.map(c => c.id));
        return (childIds.has(conn.sources[0].id) || childIds.has(conn.targets[0].id)) ||
               (childIds.has(conn.sources[0].id) && childIds.has(conn.targets[0].id));
    }
    
    /**
     * Generate synthetic edges from parent-child hierarchy.
     * When two composites have edges between their children, create synthetic
     * edges between the composites themselves.
     */
    private generateSyntheticEdges(entities: Entity[]): Connection[] {
        const synthetic: Connection[] = [];
        const composites = entities.filter(e => e.isComposite());
        
        // For each pair of composites
        for (let i = 0; i < composites.length; i++) {
            for (let j = i + 1; j < composites.length; j++) {
                const comp1 = composites[i];
                const comp2 = composites[j];
                
                // Check if there are any edges between children of comp1 and comp2
                const edges1to2 = this.findEdgesBetweenChildren(comp1, comp2);
                const edges2to1 = this.findEdgesBetweenChildren(comp2, comp1);
                
                if (edges1to2.length > 0) {
                    const syntheticId = `synthetic_${comp1.id}_to_${comp2.id}`;
                    const synthEdge = new Connection(syntheticId, [comp1], [comp2], { synthetic: true });
                    for (const edge of edges1to2) {
                        synthEdge.addSubEdge('synthetic', edge.sources[0], edge.targets[0]);
                    }
                    synthetic.push(synthEdge);
                }
                
                if (edges2to1.length > 0) {
                    const syntheticId = `synthetic_${comp2.id}_to_${comp1.id}`;
                    const synthEdge = new Connection(syntheticId, [comp2], [comp1], { synthetic: true });
                    for (const edge of edges2to1) {
                        synthEdge.addSubEdge('synthetic', edge.sources[0], edge.targets[0]);
                    }
                    synthetic.push(synthEdge);
                }
            }
        }
        
        return synthetic;
    }
    
    /**
     * Find all edges that go from children of source to children of target.
     */
    private findEdgesBetweenChildren(source: Entity, target: Entity): Connection[] {
        if (!source.isComposite() || !target.isComposite()) return [];
        
        const sourceChildIds = new Set(source.children.map(c => c.id));
        const targetChildIds = new Set(target.children.map(c => c.id));
        
        // Find all connections where source is child of `source` and target is child of `target`
        return this.allConnections.filter(conn => 
            conn.sources.length > 0 && conn.targets.length > 0 &&
            sourceChildIds.has(conn.sources[0].id) &&
            targetChildIds.has(conn.targets[0].id)
        );
    }
    
    /**
     * Merge synthetic edges with user edges. When edges connect the same node pair,
     * combine them into one Connection with multiple subEdges.
     * Also mark inter-composite edges as hidden (they're represented by synthetic edges).
     */
    private mergeConnections(userEdges: Connection[], syntheticEdges: Connection[]): void {
        // Create a map of node pair → connection
        const edgeMap = new Map<string, Connection>();
        const interCompositeEdgeIds = new Set<string>();
        
        // First pass: identify all inter-composite user edges
        for (const edge of userEdges) {
            if (edge.sources.length > 0 && edge.targets.length > 0) {
                const source = edge.sources[0];
                const target = edge.targets[0];
                
                // Check if this is an inter-composite edge
                if (source.parent && target.parent && 
                    source.parent !== target.parent &&
                    !source.parent.implicit && !target.parent.implicit) {
                    interCompositeEdgeIds.add(edge.id);
                    console.log(`[GraphManager] Marking inter-composite edge as hidden: ${edge.id} (${source.id} → ${target.id})`);
                }
            }
        }
        
        // Add user edges, but mark inter-composite ones as hidden
        for (const edge of userEdges) {
            if (edge.sources.length > 0 && edge.targets.length > 0) {
                if (interCompositeEdgeIds.has(edge.id)) {
                    edge.hidden = true; // Hide inter-composite edges
                }
                const key = `${edge.sources[0].id}→${edge.targets[0].id}`;
                edgeMap.set(key, edge);
            }
        }
        
        // Merge synthetic edges
        for (const synthEdge of syntheticEdges) {
            if (synthEdge.sources.length > 0 && synthEdge.targets.length > 0) {
                const key = `${synthEdge.sources[0].id}→${synthEdge.targets[0].id}`;
                
                if (edgeMap.has(key)) {
                    // Merge: add synthetic sub-edges to existing user edge
                    const existing = edgeMap.get(key)!;
                    for (const subEdge of synthEdge.subEdges) {
                        existing.addSubEdge(subEdge.type, subEdge.source, subEdge.target);
                    }
                } else {
                    // New: add synthetic edge
                    edgeMap.set(key, synthEdge);
                }
            }
        }
        
        // Update this.allConnections with merged result
        this.allConnections = Array.from(edgeMap.values());
    }

    /**
     * Set the root entity for the entire graph.
     */
    setRoot(root: Entity): void {
        this.root = root;
        if (this.isPhysicsEnabled) {
            this.enablePhysics();
        }
    }

    /**
     * Collect all entities from tree (including composites and leaves, excluding implicit).
     */
    private getAllEntities(entity: Entity = this.root!): Entity[] {
        // If we have stored entities from buildGraph, use those
        if (this.entities.length > 0) {
            return this.entities.filter(e => !e.implicit);
        }
        
        // Fallback for legacy tree-based usage
        if (!entity) return [];
        const all: Entity[] = [];
        
        if (!entity.implicit) {
            all.push(entity);
        }
        
        if (entity.isComposite()) {
            for (const child of entity.children) {
                all.push(...this.getAllEntities(child));
            }
        }
        
        return all;
    }

    /**
     * Collect all connections from tree (recursively from all composites).
     */
    private getAllConnections(entity: Entity = this.root!): Connection[] {
        // If we have stored connections from buildGraph, use those
        if (this.allConnections.length > 0) {
            return this.allConnections;
        }
        
        // Fallback for legacy tree-based usage
        if (!entity) return [];
        const connections: Connection[] = [];
        
        if (entity.isComposite()) {
            connections.push(...entity.connections);
            
            for (const child of entity.children) {
                connections.push(...this.getAllConnections(child));
            }
        }
        
        return connections;
    }

    /**
     * Collect all composite entities from tree.
     */
    private getAllComposites(entity: Entity = this.root!): Entity[] {
        if (!entity) return [];
        const composites: Entity[] = [];
        
        if (entity.isComposite()) {
            composites.push(entity);
            
            for (const child of entity.children) {
                composites.push(...this.getAllComposites(child));
            }
        }
        
        return composites;
    }

    /**
     * Get visible nodes based on current zoom level (excluding implicit).
     */
    getVisibleNodes(): Entity[] {
        return this.getAllEntities().filter(e => !e.implicit && e.visible);
    }

    /**
     * Get all visible connections.
     */
    getVisibleConnections(): Connection[] {
        return this.getAllConnections().filter(c => !c.hidden);
    }

    /**
     * Find which composite contains a given entity (recursively).
     */
    private findCompositeForEntity(target: Entity, entity: Entity = this.root!): Entity | null {
        if (!entity.isComposite()) return null;
        
        if (entity.children.includes(target)) {
            return entity;
        }
        
        for (const child of entity.children) {
            const found = this.findCompositeForEntity(target, child);
            if (found) return found;
        }
        
        return null;
    }

    /**
     * Enable physics-based layout.
     * Only simulates entities and connections in visible layers for performance.
     */
    enablePhysics(): void {
        if (this.entities.length === 0 && !this.root) return;
        
        this.isPhysicsEnabled = true;
        
        // For flat list API, find a root (or create implicit one)
        let root = this.root;
        if (!root && this.entities.length > 0) {
            // Create implicit root for physics simulation
            root = new Entity('_implicit_root', {
                children: this.entities,
                implicit: true
            });
        }
        
        if (root) {
            this.physicsEngine.init(root);
            this.physicsEngine.setConnections(this.getAllConnections());
            this.physicsEngine.start();
        }
    }

    /**
     * Update physics to only simulate visible layers.
     * Called during animation to filter based on current zoom.
     */
    private updatePhysicsForVisibleLayers(): void {
        if (!this.isPhysicsEnabled) return;
        
        const visibleEntities = this.layerDetailManager.getVisibleEntities(
            this.entities,
            this.zoomManager.zoomLevel
        );
        
        this.physicsEngine.setVisibleEntities(visibleEntities);
    }

    /**
     * Disable physics simulation.
     */
    disablePhysics(): void {
        this.isPhysicsEnabled = false;
        this.physicsEngine.stop();
    }

    /**
     * Set zoom level.
     */
    setZoom(level: number, animate: boolean = true, focusPoint?: { x: number; y: number }): void {
        this.zoomManager.setZoom(level, animate, focusPoint);
    }

    /**
     * Adjust zoom by delta, optionally towards a focus point (e.g., mouse position).
     */
    adjustZoom(delta: number, focusPoint?: { x: number; y: number }): void {
        const newZoom = this.zoomManager.zoomLevel + delta;
        // Short animation for smooth but responsive zoom
        this.setZoom(newZoom, true, focusPoint);
    }

    /**
     * Get current zoom level.
     */
    getZoom(): number {
        return this.zoomManager.zoomLevel;
    }

    /**
     * Collapse a composite entity.
     */
    collapseEntity(composite: Entity): void {
        composite.collapse();
        this.updateSummaryEdges(composite);
    }

    /**
     * Expand a composite entity.
     */
    expandEntity(composite: Entity): void {
        composite.expand();
        this.updateSummaryEdges(composite);
    }

    /**
     * Update summary edges for a composite.
     */
    private updateSummaryEdges(composite: Entity): void {
        if (composite.collapsed) {
            composite.updateSummaryEdges();
        }
    }

    /**
     * Bind mouse/touch interactions.
     */
    private bindInteractions(): void {
        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -CONFIG.ZOOM_SCROLL_SENSITIVITY : CONFIG.ZOOM_SCROLL_SENSITIVITY;
            
            // Get mouse position in canvas coordinates
            const rect = this.canvas.getBoundingClientRect();
            const mouseCanvasX = e.clientX - rect.left;
            const mouseCanvasY = e.clientY - rect.top;
            
            this.adjustZoom(delta, { x: mouseCanvasX, y: mouseCanvasY });
        });

        const getWorldCoords = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const worldX = (mx - this.renderer.offsetX) / this.renderer.scale;
            const worldY = (my - this.renderer.offsetY) / this.renderer.scale;
            return { worldX, worldY };
        };

        const getEntityAtPoint = (worldX: number, worldY: number): Entity | null => {
            // Only check entities in visible layers (same filtering as physics and renderer)
            const visibleEntities = this.layerDetailManager.getVisibleEntities(
                this.entities,
                this.zoomManager.zoomLevel
            );
            const visibleEntitySet = new Set(visibleEntities);
            
            let closest: Entity | null = null;
            let closestDist = Infinity;
            
            for (const entity of this.getAllEntities()) {
                if (entity.implicit) continue;
                
                // Skip entities not in visible layers
                if (!visibleEntitySet.has(entity)) {
                    continue;
                }
                
                // Check if entity is visible (opacity > 0)
                const detailState = this.layerDetailManager.getDetailStateAtZoom(entity, this.zoomManager.zoomLevel);
                if (detailState.opacity <= 0) {
                    continue;
                }
                
                // Check if point is inside the entity's hitbox
                if (!entity.shapeObject.containsPoint(worldX, worldY, entity.x, entity.y)) {
                    continue;
                }
                
                // Calculate distance from point to entity center for sorting
                const dist = Math.hypot(entity.x - worldX, entity.y - worldY);
                if (dist < closestDist) {
                    closest = entity;
                    closestDist = dist;
                }
            }
            
            return closest;
        };

        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            const { worldX, worldY } = getWorldCoords(e);
            const entity = getEntityAtPoint(worldX, worldY);

            if (entity) {
                this.draggedNode = entity;
                this.interactionManager.selectNode(entity, e.ctrlKey || e.metaKey);
                if (this.isPhysicsEnabled) {
                    this.physicsEngine.pinNode(entity, entity.x, entity.y);
                }
            } else {
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.offsetStartX = this.renderer.offsetX;
                this.offsetStartY = this.renderer.offsetY;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        this.canvas.addEventListener('mousemove', (e: MouseEvent) => {
            const { worldX, worldY } = getWorldCoords(e);

            if (this.isPanning) {
                const dx = e.clientX - this.panStartX;
                const dy = e.clientY - this.panStartY;
                this.renderer.offsetX = this.offsetStartX + dx;
                this.renderer.offsetY = this.offsetStartY + dy;
                this.renderer.setCamera(this.renderer.scale, this.renderer.offsetX, this.renderer.offsetY);
                return;
            }

            if (this.draggedNode) {
                this.draggedNode.setPosition(worldX, worldY);
                if (this.isPhysicsEnabled) {
                    this.physicsEngine.pinNode(this.draggedNode, worldX, worldY);
                }
                return;
            }

            const entity = getEntityAtPoint(worldX, worldY);
            this.interactionManager.hoverNode(entity);
            this.canvas.style.cursor = entity ? 'pointer' : 'default';
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
            if (this.draggedNode && this.isPhysicsEnabled) {
                this.physicsEngine.unpinNode(this.draggedNode);
            }
            this.draggedNode = null;
        });

        this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            const { worldX, worldY } = getWorldCoords(e);

            for (const composite of this.getAllComposites()) {
                const dist = Math.hypot(composite.x - worldX, composite.y - worldY);
                const diameter = composite.shapeObject.getDiameter();
                const radius = diameter / 2;
                if (dist < radius * 1.5 * 2) {
                    if (composite.collapsed) {
                        this.expandEntity(composite);
                    } else {
                        this.collapseEntity(composite);
                    }
                    return;
                }
            }
        });
    }

    /**
     * Update entity and connection visibility based on scale bar and detail state.
     */
    private updateVisibility(): void {
        const zoomLevel = this.zoomManager.zoomLevel;
        const visibleLayers = this.layerDetailManager.getVisibleLayers(zoomLevel);
        const visibleSet = new Set(visibleLayers);

        for (const entity of this.getAllEntities()) {
            if (visibleSet.has(entity.layer)) {
                const detailState = this.layerDetailManager.getDetailStateAtZoom(entity, zoomLevel);
                entity.setOpacity(detailState.opacity);
                entity.visible = detailState.visible;
            } else {
                entity.setOpacity(0);
                entity.visible = false;
            }
        }

        // Update connection visibility: visible if both endpoints are in visible layers
        for (const conn of this.getAllConnections()) {
            const sourceInView = conn.sources.some(s => visibleSet.has(s.layer));
            const targetInView = conn.targets.some(t => visibleSet.has(t.layer));

            if (sourceInView || targetInView) {
                conn.setOpacity(1.0);
            } else {
                conn.setOpacity(0);
            }
        }

        // Auto-expand/collapse composites based on zoom
        for (const composite of this.getAllComposites()) {
            if (this.zoomManager.shouldAutoExpand(composite, 0.5)) {
                if (composite.collapsed) {
                    this.expandEntity(composite);
                }
            }
        }
    }

    /**
     * Update and render the scene.
     */
    update(): void {
        this.updateVisibility();
        this.updatePhysicsForVisibleLayers();
        this.updateZoomDebug();
        this.renderer.clear();

        // Get visible entities at current zoom (same filtering as physics engine)
        const visibleEntities = this.layerDetailManager.getVisibleEntities(
            this.entities,
            this.zoomManager.zoomLevel
        );
        const visibleEntitySet = new Set(visibleEntities);

        const visibleConnections = this.getVisibleConnections();
        const visibleNodes = this.getVisibleNodes();

        // Filter visible nodes to only those in visible layers
        const layerFilteredNodes = visibleNodes.filter(node => visibleEntitySet.has(node));

        // Filter connections to only those with at least one endpoint in visible layers
        const layerFilteredConnections = visibleConnections.filter(conn =>
            conn.sources.some(s => visibleEntitySet.has(s)) ||
            conn.targets.some(t => visibleEntitySet.has(t))
        );

        // Group nodes and edges by layer
        const nodesByLayer = new Map<number, Entity[]>();
        const connectionsByLayer = new Map<number, Connection[]>();
        
        for (const node of layerFilteredNodes) {
            if (!nodesByLayer.has(node.layer)) {
                nodesByLayer.set(node.layer, []);
            }
            nodesByLayer.get(node.layer)!.push(node);
        }
        
        for (const conn of layerFilteredConnections) {
            let maxLayer = 0;
            for (const source of conn.sources) {
                maxLayer = Math.max(maxLayer, source.layer);
            }
            for (const target of conn.targets) {
                maxLayer = Math.max(maxLayer, target.layer);
            }
            if (!connectionsByLayer.has(maxLayer)) {
                connectionsByLayer.set(maxLayer, []);
            }
            connectionsByLayer.get(maxLayer)!.push(conn);
        }

        // Get all unique layers and sort descending (highest layer first = rendered last = on top)
        const allLayers = Array.from(new Set([...nodesByLayer.keys(), ...connectionsByLayer.keys()])).sort((a, b) => b - a);

        // Draw each layer: edges then nodes
        for (const layer of allLayers) {
            // Draw edges at this layer
            const edgesAtLayer = connectionsByLayer.get(layer) || [];
            for (const conn of edgesAtLayer) {
                let minLayer = Infinity;
                for (const source of conn.sources) {
                    minLayer = Math.min(minLayer, source.layer);
                }
                for (const target of conn.targets) {
                    minLayer = Math.min(minLayer, target.layer);
                }
                minLayer = minLayer === Infinity ? 0 : minLayer;
                const tempEntity = { layer: minLayer, x: 0, y: 0 } as Entity;
                const detailState = this.layerDetailManager.getDetailStateAtZoom(tempEntity, this.zoomManager.zoomLevel);
                this.renderer.drawConnection(conn, detailState);
            }

            // Draw all nodes at this layer (composites and regular nodes together)
            const nodesAtLayer = nodesByLayer.get(layer) || [];
            for (const entity of nodesAtLayer) {
                const detailState = this.layerDetailManager.getDetailStateAtZoom(entity, this.zoomManager.zoomLevel);
                if (entity.isComposite()) {
                    this.renderer.drawNode(entity, detailState);
                } else {
                    this.renderer.drawNode(entity, detailState);
                }
            }
        }

        // Draw summary connections for collapsed composites
        for (const composite of this.getAllComposites()) {
            if (composite.collapsed) {
                for (const summaryConn of composite.summaryConnections) {
                    const tempEntity = { layer: composite.layer, x: 0, y: 0 } as Entity;
                    const detailState = this.layerDetailManager.getDetailStateAtZoom(tempEntity, this.zoomManager.zoomLevel);
                    this.renderer.drawConnection(summaryConn, detailState);
                }
            }
        }

        // Render the scene
        this.renderer.render();
    }

    /**
     * Start animation loop.
     */
    start(): void {
        let frameCount = 0;
        const animate = () => {
            this.update();
            this.animationFrameId = requestAnimationFrame(animate);
            frameCount++;
        };
        animate();
    }

    /**
     * Stop animation loop.
     */
    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        // Clear zoom callbacks to prevent updates
        this.zoomManager.onZoomChange = null;
        this.renderer.destroy();
    }

    /**
     * Get interaction manager.
     */
    getInteractionManager(): InteractionManager {
        return this.interactionManager;
    }

    /**
     * Get zoom manager.
     */
    getZoomManager(): ZoomManager {
        return this.zoomManager;
    }

    /**
     * Get physics engine.
     */
    getPhysicsEngine(): PhysicsEngine {
        return this.physicsEngine;
    }

    /**
     * Get layer detail manager.
     */
    getLayerDetailManager(): LayerDetailManager {
        return this.layerDetailManager;
    }

    /**
     * Toggle zoom debug widget visibility.
     */
    toggleZoomDebug(): void {
        if (this.zoomDebugWidget) {
            this.zoomDebugWidget.destroy();
            this.zoomDebugWidget = null;
        } else {
            this.zoomDebugWidget = new ZoomDebugWidget(this.layerDetailManager);
        }
    }

    /**
     * Show the zoom debug widget (create if not exists).
     */
    showZoomDebug(): void {
        if (!this.zoomDebugWidget) {
            this.zoomDebugWidget = new ZoomDebugWidget(this.layerDetailManager);
        }
    }

    /**
     * Set render configuration.
     */
    setRenderConfig(config: Record<string, any>): void {
        this.renderConfig = config;
        this.renderer.setRenderConfig(config);
    }

    /**
     * Update zoom debug widget with current state.
     */
    private updateZoomDebug(): void {
        if (!this.zoomDebugWidget) return;

        const zoomLevel = this.zoomManager.zoomLevel;
        const currentLayer = this.layerDetailManager.getPrimaryLayerAtZoom(zoomLevel);

        // Create a temporary entity at the current layer to calculate its opacity
        const tempEntity = { layer: currentLayer } as Entity;
        const detailState = this.layerDetailManager.getDetailStateAtZoom(tempEntity, zoomLevel);
        const opacity = detailState.opacity;

        this.zoomDebugWidget.update(
            zoomLevel,
            currentLayer,
            opacity,
            this.zoomManager.minZoom,
            this.zoomManager.maxZoom
        );
    }
}
