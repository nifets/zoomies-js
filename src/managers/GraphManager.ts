import { Node } from '../core/Node';
import { Edge } from '../core/Edge';
import { HyperEdge } from '../core/HyperEdge';
import { Module } from '../core/Module';
import { Renderer } from '../rendering/Renderer';
import { InteractionManager } from './InteractionManager';
import { ZoomManager } from './ZoomManager';
import { PhysicsEngine } from './PhysicsEngine';

/**
 * Main graph manager and scene controller.
 * Orchestrates nodes, edges, modules, physics, rendering, and interactions.
 */
export class GraphManager {
    nodes: Node[];
    edges: Edge[];
    hyperEdges: HyperEdge[];
    modules: Module[];
    renderer: Renderer;
    interactionManager: InteractionManager;
    zoomManager: ZoomManager;
    physicsEngine: PhysicsEngine;
    canvas: HTMLCanvasElement;
    isPhysicsEnabled: boolean;
    animationFrameId: number | null;
    lastZoom: number;
    draggedNode: Node | null;
    pinnedNodes: Set<Node>;
    isPanning: boolean;
    panStartX: number;
    panStartY: number;
    offsetStartX: number;
    offsetStartY: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.nodes = [];
        this.edges = [];
        this.hyperEdges = [];
        this.modules = [];
        this.renderer = new Renderer(canvas);
        this.interactionManager = new InteractionManager();
        this.zoomManager = new ZoomManager(0, -3, 3);
        this.physicsEngine = new PhysicsEngine();
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

        this.bindInteractions();
    }

    async init(): Promise<void> {
        await this.renderer.init();
    }

    /**
     * Add a node to the graph.
     */
    addNode(node: Node): void {
        if (!this.nodes.includes(node)) {
            this.nodes.push(node);
            if (this.isPhysicsEnabled) {
                this.physicsEngine.init(this.getVisibleNodes(), this.edges, this.hyperEdges);
            }
        }
    }

    /**
     * Remove a node from the graph.
     */
    removeNode(node: Node): void {
        this.nodes = this.nodes.filter(n => n !== node);
        // Remove edges connected to this node
        this.edges = this.edges.filter(e => e.source !== node && e.target !== node);
        this.interactionManager.deselectNode(node);
    }

    /**
     * Add an edge to the graph.
     */
    addEdge(edge: Edge): void {
        if (!this.edges.includes(edge)) {
            // Auto-detect cross-module edges
            const sourceModule = this.findModuleForNode(edge.source);
            const targetModule = this.findModuleForNode(edge.target);
            if (sourceModule && targetModule && sourceModule !== targetModule) {
                edge.sourceModule = sourceModule;
                edge.targetModule = targetModule;
            }
            
            this.edges.push(edge);
            if (this.isPhysicsEnabled) {
                this.physicsEngine.init(this.getVisibleNodes(), this.edges, this.hyperEdges);
            }
        }
    }

    /**
     * Remove an edge from the graph.
     */
    removeEdge(edge: Edge): void {
        this.edges = this.edges.filter(e => e !== edge);
    }

    /**
     * Add a hyperedge to the graph.
     */
    addHyperEdge(hyperEdge: HyperEdge): void {
        if (!this.hyperEdges.includes(hyperEdge)) {
            this.hyperEdges.push(hyperEdge);
        }
    }

    /**
     * Remove a hyperedge from the graph.
     */
    removeHyperEdge(hyperEdge: HyperEdge): void {
        this.hyperEdges = this.hyperEdges.filter(he => he !== hyperEdge);
    }

    /**
     * Add a module to the graph.
     */
    addModule(module: Module): void {
        if (!this.modules.includes(module)) {
            this.modules.push(module);
        }
    }

    /**
     * Remove a module from the graph.
     */
    removeModule(module: Module): void {
        this.modules = this.modules.filter(m => m !== module);
    }

    /**
     * Collapse a module: hide internal nodes/edges, show summary edges.
     */
    collapseModule(module: Module): void {
        module.collapse();
        this.updateSummaryEdges(module);
    }

    /**
     * Expand a module: show internal nodes/edges, hide summary edges.
     */
    expandModule(module: Module): void {
        module.expand();
        this.updateSummaryEdges(module);
    }

    /**
     * Update summary edges for a module.
     */
    private updateSummaryEdges(module: Module): void {
        if (module.collapsed) {
            module.updateSummaryEdges();
        }
    }

    /**
     * Get all visible nodes (including children of modules, recursive).
     */
    getVisibleNodes(): Node[] {
        const visible: Node[] = [];
        
        // Add top-level nodes
        for (const node of this.nodes) {
            if (!node.implicit && node.visible) {
                visible.push(node);
            }
        }
        
        // Recursively add visible children from modules
        for (const module of this.modules) {
            visible.push(...module.getVisibleChildren());
        }
        
        return visible;
    }

    /**
     * Get all visible edges.
     */
    getVisibleEdges(): Edge[] {
        return this.edges.filter(e => !e.hidden);
    }

    /**
     * Get all visible hyperedges.
     */
    getVisibleHyperEdges(): HyperEdge[] {
        return this.hyperEdges.filter(he => !he.hidden);
    }

    /**
     * Find which module contains a given node (recursively).
     */
    findModuleForNode(node: Node): Module | null {
        for (const module of this.modules) {
            if (module.children.includes(node)) {
                return module;
            }
            // Could also check recursively for nested modules
        }
        return null;
    }

    /**
     * Infer higher-level edges from lower-level edges.
     * For each lower-level edge, if source and target are in different modules,
     * create a higher-level edge connecting those modules.
     * Returns map of module-pair -> edges for grouping.
     */
    inferHierarchicalEdges(): Map<string, Edge[]> {
        const hierarchicalEdges = new Map<string, Edge[]>();

        for (const edge of this.edges) {
            const sourceModule = this.findModuleForNode(edge.source);
            const targetModule = this.findModuleForNode(edge.target);

            // Only create hierarchical edge if nodes are in different modules
            if (sourceModule && targetModule && sourceModule !== targetModule) {
                const pairKey = `${sourceModule.id}-${targetModule.id}`;
                if (!hierarchicalEdges.has(pairKey)) {
                    hierarchicalEdges.set(pairKey, []);
                }
                hierarchicalEdges.get(pairKey)!.push(edge);
            }
        }

        return hierarchicalEdges;
    }

    /**
     * Create a higher-level edge from a lower-level edge pair.
     * User provides a transformation function to customize the higher-level edge.
     */
    createHierarchicalEdge(
        sourceModule: Module,
        targetModule: Module,
        detailEdges: Edge[],
        transform?: (detailEdges: Edge[]) => Record<string, any>
    ): Edge {
        const defaultAttrs = {
            colour: '#f39c12',
            width: 2,
            isHierarchical: true
        };

        const customAttrs = transform ? transform(detailEdges) : {};
        const attributes = { ...defaultAttrs, ...customAttrs };

        const hierarchicalEdge = new Edge(
            `hier_${sourceModule.id}_${targetModule.id}`,
            sourceModule,
            targetModule,
            attributes
        );

        // Link detail edges
        hierarchicalEdge.detailEdges = detailEdges;
        hierarchicalEdge.sourceModule = sourceModule;
        hierarchicalEdge.targetModule = targetModule;

        return hierarchicalEdge;
    }

    /**
     * Get all nodes for physics simulation (including modules as root entities).
     * Modules are treated as first-class nodes in the hierarchy.
     */
    getAllRootNodes(): Node[] {
        return this.nodes.concat(this.modules);
    }

    /**
     * Get all leaf nodes recursively (no implicit nodes, respects hierarchy).
     */
    getAllLeafNodes(): Node[] {
        const leaves: Node[] = [];
        
        // Collect from top-level nodes
        for (const node of this.nodes) {
            if (!node.implicit) {
                leaves.push(node);
            }
        }
        
        // Collect from modules recursively
        for (const module of this.modules) {
            leaves.push(...module.getLeafNodes());
        }
        
        return leaves;
    }

    /**
     * Enable physics-based layout.
     */
    enablePhysics(): void {
        this.isPhysicsEnabled = true;
        // Pass both regular nodes and modules to physics engine
        // Modules are root-level entities that should have physics applied
        this.physicsEngine.init(this.getAllLeafNodes(), this.edges, this.hyperEdges, this.modules);
        this.physicsEngine.start();
    }

    /**
     * Disable physics simulation.
     */
    disablePhysics(): void {
        this.isPhysicsEnabled = false;
        this.physicsEngine.stop();
    }

    /**
     * Set the zoom level.
     */
    setZoom(level: number, animate: boolean = true): void {
        this.zoomManager.setZoom(level, animate);
    }

    /**
     * Adjust zoom by a delta.
     */
    adjustZoom(delta: number): void {
        const newZoom = this.zoomManager.zoomLevel + delta;
        this.setZoom(newZoom, true);
    }

    /**
     * Get current zoom level.
     */
    getZoom(): number {
        return this.zoomManager.zoomLevel;
    }

    /**
     * Bind mouse/touch interactions to the canvas.
     */
    private bindInteractions(): void {
        // Zoom with mouse wheel
        this.canvas.addEventListener('wheel', (e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.25 : 0.25;
            this.adjustZoom(delta);
        });

        const getWorldCoords = (e: MouseEvent) => {
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const worldX = (mx - this.renderer.offsetX) / this.renderer.scale;
            const worldY = (my - this.renderer.offsetY) / this.renderer.scale;
            return { worldX, worldY };
        };

        const getNodeAtPoint = (worldX: number, worldY: number): Node | null => {
            let closest: Node | null = null;
            let closestDist = Infinity;
            
            // Check all top-level nodes and modules
            const allTopLevel = this.nodes.concat(this.modules as any);
            
            for (const node of allTopLevel) {
                if (node.implicit) continue;
                
                let hitRadius = node.radius * 2.5;
                // Modules have larger hit area
                if (node instanceof Module) {
                    hitRadius = node.radius * 1.5 * 2;
                }
                
                const dist = Math.hypot(node.x - worldX, node.y - worldY);
                if (dist < hitRadius && dist < closestDist) {
                    closest = node;
                    closestDist = dist;
                }
            }
            
            // Check children of modules (can override parent if closer)
            for (const module of this.modules) {
                for (const child of module.children) {
                    if (child.implicit || child instanceof Module) continue;
                    
                    const dist = Math.hypot(child.x - worldX, child.y - worldY);
                    const hitRadius = child.radius * 2.5;
                    if (dist < hitRadius && dist < closestDist) {
                        closest = child;
                        closestDist = dist;
                    }
                }
            }
            
            return closest;
        };

                // Mouse down for selection and dragging
        this.canvas.addEventListener('mousedown', (e: MouseEvent) => {
            const { worldX, worldY } = getWorldCoords(e);
            const draggable = getNodeAtPoint(worldX, worldY);

            if (draggable) {
                this.draggedNode = draggable;
                this.interactionManager.selectNode(draggable, e.ctrlKey || e.metaKey);
                if (this.isPhysicsEnabled) {
                    this.physicsEngine.pinNode(draggable, draggable.x, draggable.y);
                }
            } else {
                // Start panning when clicking empty space
                this.isPanning = true;
                this.panStartX = e.clientX;
                this.panStartY = e.clientY;
                this.offsetStartX = this.renderer.offsetX;
                this.offsetStartY = this.renderer.offsetY;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        // Mouse move for dragging and hover
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

            // Hover detection
            const node = getNodeAtPoint(worldX, worldY);
            this.interactionManager.hoverNode(node);
            this.canvas.style.cursor = node ? 'pointer' : 'default';
        });

        // Mouse up to stop dragging
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

        // Right-click for context menu or module collapse/expand
        this.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            const { worldX, worldY } = getWorldCoords(e);

            for (const module of this.modules) {
                const dist = Math.hypot(module.x - worldX, module.y - worldY);
                if (dist < module.radius * 1.5 * 2) {
                    if (module.collapsed) {
                        this.expandModule(module);
                    } else {
                        this.collapseModule(module);
                    }
                    return;
                }
            }
        });

        // Zoom manager event callback
        this.zoomManager.onZoomChange = (zoomLevel: number) => {
            // Update camera scale based on zoom level
            // Zoom level 0 = 1x, each +1 = 2x, each -1 = 0.5x
            const cameraScale = Math.pow(2, zoomLevel);
            this.renderer.setCamera(cameraScale, this.renderer.offsetX, this.renderer.offsetY);
            this.updateVisibility();
        };
    }    /**
     * Update node and edge visibility based on zoom level.
     */
    private updateVisibility(): void {
        for (const node of this.nodes) {
            const vis = this.zoomManager.getNodeVisibility(node);
            node.setOpacity(vis);
        }

        for (const edge of this.edges) {
            const vis = this.zoomManager.getNodeVisibility(edge.source);
            edge.setOpacity(vis);
        }

        for (const hyperEdge of this.hyperEdges) {
            const vis = hyperEdge.getVisibility(this.zoomManager.zoomLevel);
            hyperEdge.setOpacity(vis);
        }

        // Auto-expand/collapse modules based on zoom
        for (const module of this.modules) {
            if (this.zoomManager.shouldAutoExpand(module, 0.5)) {
                if (module.collapsed) {
                    this.expandModule(module);
                }
            }
        }
    }

    /**
     * Update and render the scene.
     */
    update(): void {
        // Update physics
        if (this.isPhysicsEnabled) {
            // Physics engine handles its own animation loop
        }

        // Update visibility
        this.updateVisibility();

        // Render
        this.renderer.clear();

        // Draw all modules first (background)
        for (const module of this.modules) {
            this.renderer.drawModule(module);
        }

        // Draw edges
        for (const edge of this.getVisibleEdges()) {
            this.renderer.drawEdge(edge, this.modules);
        }

        // Draw summary edges for collapsed modules
        for (const module of this.modules) {
            if (module.collapsed) {
                for (const summaryEdge of module.summaryEdges) {
                    this.renderer.drawEdge(summaryEdge);
                }
            }
        }

        // Draw hyperedges
        for (const hyperEdge of this.getVisibleHyperEdges()) {
            this.renderer.drawHyperEdge(hyperEdge);
        }

        // Draw nodes
        for (const node of this.getVisibleNodes()) {
            this.renderer.drawNode(node);
        }
    }

    /**
     * Start the animation loop.
     */
    start(): void {
        const animate = () => {
            this.update();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * Stop the animation loop.
     */
    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Get interaction manager (for event listening).
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
}
