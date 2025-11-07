import { Node } from '../core/Node';
import { Edge } from '../core/Edge';
import { HyperEdge } from '../core/HyperEdge';
import { Module } from '../core/Module';

/**
 * Physics engine for force-directed layout.
 * Handles simulation updates and node positioning.
 */
export class PhysicsEngine {
    nodes: Node[];
    edges: Edge[];
    hyperEdges: HyperEdge[];
    isRunning: boolean;
    strength: number;
    distance: number;
    damping: number;
    centerForce: number;
    animationFrameId: number | null;
    pinnedNodes: Set<Node>;
    modules: any[]; // Module array for hierarchical physics

    // Physics constants
    private readonly MODULE_REPULSION_STRENGTH = 1.0;
    private readonly CHILD_REPULSION_STRENGTH = 0.08;
    private readonly CENTER_ATTRACTION_STRENGTH = 0.01;
    private readonly EDGE_ATTRACTION_STRENGTH = 0.001;
    private readonly BORDER_ATTRACTION_STRENGTH = 0.001;
    private readonly BORDER_ATTRACTION_MIN_DISTANCE = 10;
    private readonly BOUNDARY_MARGIN = 0.9;

    constructor() {
        this.nodes = [];
        this.edges = [];
        this.hyperEdges = [];
        this.isRunning = false;
        this.strength = 80; // Reduced from 150 - was too strong
        this.distance = 60; // Target link distance
        this.damping = 0.92; // Increased from 0.88 - more dampening for stability
        this.centerForce = 0.01; // Reduced from 0.02
        this.animationFrameId = null;
        this.pinnedNodes = new Set();
        this.modules = [];
    }

    /**
     * Initialize the physics simulation with nodes and edges.
     */
    init(nodes: Node[], edges: Edge[], hyperEdges: HyperEdge[] = [], modules: any[] = []): void {
        this.nodes = nodes.filter(n => !n.implicit);
        this.edges = edges;
        this.hyperEdges = hyperEdges;
        this.modules = modules;

        // Initialize top-level nodes randomly if not set
        this.nodes.forEach(node => {
            if (node.x === 0 && node.y === 0) {
                node.x = Math.random() * 400 - 200;
                node.y = Math.random() * 400 - 200;
            }
            node.vx = (Math.random() - 0.5) * 2;
            node.vy = (Math.random() - 0.5) * 2;
        });

        // Initialize modules with velocities
        this.modules.forEach(module => {
            module.vx = (Math.random() - 0.5) * 2;
            module.vy = (Math.random() - 0.5) * 2;
            
            // Initialize child positions INSIDE the module
            for (const child of module.children) {
                if (child.x === 0 && child.y === 0) {
                    const pos = module.shapeObject.getRandomInteriorPoint(module.x, module.y);
                    child.x = pos.x;
                    child.y = pos.y;
                }
                child.vx = (Math.random() - 0.5) * 2;
                child.vy = (Math.random() - 0.5) * 2;
            }
        });
    }

    /**
     * Start the physics simulation.
     */
    start(): void {
        this.isRunning = true;
        this.animate();
    }

    /**
     * Stop the simulation.
     */
    stop(): void {
        this.isRunning = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Main simulation loop.
     */
    private animate = (): void => {
        if (!this.isRunning) return;

        this.simulationStep();
        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    /**
     * Perform one step of the physics simulation.
     * Modular/stratified physics: each module is an independent universe.
     */
    private simulationStep(): void {
        // Step 1: Module-level physics (modules interact with each other)
        for (let i = 0; i < this.modules.length; i++) {
            for (let j = i + 1; j < this.modules.length; j++) {
                const a = this.modules[i];
                const b = this.modules[j];
                if (this.pinnedNodes.has(a) || this.pinnedNodes.has(b)) continue;
                this.applyRepulsion(a, b, this.MODULE_REPULSION_STRENGTH);
            }
        }

        // Step 1.5: Module-level edge attractions
        for (const edge of this.edges) {
            if (this.pinnedNodes.has(edge.source) || this.pinnedNodes.has(edge.target)) continue;
            // Check if this is a module-to-module edge
            if (this.modules.includes(edge.source) && this.modules.includes(edge.target)) {
                this.applyAttraction(edge.source, edge.target);
            }
        }

        // Step 2: Within each module, run independent physics for children
        for (const module of this.modules) {
            this.simulateModuleInternal(module);
        }

        // Step 3: Update positions
        this.updatePositions();
    }

    /**
     * Run physics simulation within a single module (isolated universe).
     */
    private simulateModuleInternal(module: any): void {
        const children = module.children.filter((c: Node) => !c.implicit);
        
        // Child-child repulsion (only within same module)
        for (let i = 0; i < children.length; i++) {
            for (let j = i + 1; j < children.length; j++) {
                const a = children[i];
                const b = children[j];
                if (this.pinnedNodes.has(a) || this.pinnedNodes.has(b)) continue;
                this.applyRepulsion(a, b, this.CHILD_REPULSION_STRENGTH);
            }
        }

        // Gentle attraction to module center (prevents drift)
        for (const child of children) {
            if (this.pinnedNodes.has(child)) continue;
            const dx = module.x - child.x;
            const dy = module.y - child.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const force = dist * this.CENTER_ATTRACTION_STRENGTH;
                child.vx += (dx / dist) * force;
                child.vy += (dy / dist) * force;
            }
        }

        // Edges within module
        for (const edge of this.edges) {
            if (this.pinnedNodes.has(edge.source) || this.pinnedNodes.has(edge.target)) continue;
            if (children.includes(edge.source) && children.includes(edge.target)) {
                this.applyAttraction(edge.source, edge.target);
            }
        }

        // Cross-module edge border attraction
        // Attract nodes toward border exit points for edges leaving the module
        for (const edge of this.edges) {
            if (this.pinnedNodes.has(edge.source) || this.pinnedNodes.has(edge.target)) continue;
            
            // Edge from child inside this module to external node
            if (children.includes(edge.source) && !children.includes(edge.target)) {
                const borderPoint = module.shapeObject.getBorderPoint(
                    module.x, module.y,
                    edge.target.x, edge.target.y
                );
                const dx = borderPoint.x - edge.source.x;
                const dy = borderPoint.y - edge.source.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.BORDER_ATTRACTION_MIN_DISTANCE) {
                    const force = dist * this.BORDER_ATTRACTION_STRENGTH;
                    edge.source.vx += (dx / dist) * force;
                    edge.source.vy += (dy / dist) * force;
                }
            }
            
            // Edge from external node to child inside this module
            if (children.includes(edge.target) && !children.includes(edge.source)) {
                const borderPoint = module.shapeObject.getBorderPoint(
                    module.x, module.y,
                    edge.source.x, edge.source.y
                );
                const dx = borderPoint.x - edge.target.x;
                const dy = borderPoint.y - edge.target.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > this.BORDER_ATTRACTION_MIN_DISTANCE) {
                    const force = dist * this.BORDER_ATTRACTION_STRENGTH;
                    edge.target.vx += (dx / dist) * force;
                    edge.target.vy += (dy / dist) * force;
                }
            }
        }

        // Boundary constraints - hard constraint to keep children inside
        for (const child of children) {
            if (this.pinnedNodes.has(child)) continue;
            this.enforceModuleBoundary(child, module);
        }
    }

    /**
     * Update positions for all nodes (modules and their children).
     */
    private updatePositions(): void {
        // Update module positions
        for (const module of this.modules) {
            if (this.pinnedNodes.has(module)) {
                module.vx = 0;
                module.vy = 0;
                continue;
            }

            module.vx *= this.damping;
            module.vy *= this.damping;
            module.x += module.vx;
            module.y += module.vy;

            if (Math.abs(module.vx) < 0.001 && Math.abs(module.vy) < 0.001) {
                module.vx = 0;
                module.vy = 0;
            }
        }

        // Update child positions
        for (const module of this.modules) {
            for (const child of module.children) {
                if (this.pinnedNodes.has(child)) {
                    child.vx = 0;
                    child.vy = 0;
                    continue;
                }

                child.vx *= this.damping;
                child.vy *= this.damping;
                child.x += child.vx;
                child.y += child.vy;

                if (Math.abs(child.vx) < 0.001 && Math.abs(child.vy) < 0.001) {
                    child.vx = 0;
                    child.vy = 0;
                }
            }
        }
    }

    /**
     * Hard boundary constraint - teleport child back inside if it escapes.
     */
    private enforceModuleBoundary(child: Node, module: any): void {
        const result = module.shapeObject.enforceConstraint(
            child.x, child.y, child.vx, child.vy,
            module.x, module.y,
            this.BOUNDARY_MARGIN
        );
        
        if (result) {
            child.x = result.x;
            child.y = result.y;
            child.vx = result.vx;
            child.vy = result.vy;
        }
    }

    /**
     * Apply repulsive force between two nodes.
     */

    /**
     * Apply repulsive force from module boundary.
     * Pushes child back inside if it tries to escape.
     * Only applies force if child is near/outside boundary (efficient).
     */
    private applyModuleBoundaryRepulsion(child: Node, module: any): void {
        const dx = child.x - module.x;
        const dy = child.y - module.y;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Only apply if child is near or outside the boundary
        // Use radius * 1.0 as threshold to keep children well inside
        const boundaryDistance = module.radius * 0.9;
        
        if (distFromCenter > boundaryDistance) {
            // Child is escaping - push it back toward center
            const force = (distFromCenter - module.radius * 0.7) * 0.25;
            const fx = (-dx / (distFromCenter + 1e-6)) * force;
            const fy = (-dy / (distFromCenter + 1e-6)) * force;
            
            child.vx += fx;
            child.vy += fy;
        }
    }

    /**
     * Apply repulsive force between two nodes.
     * Considers node size (radius) to prevent overlap.
     * multiplier allows weakening repulsion for same-module nodes.
     */
    private applyRepulsion(a: Node, b: Node, multiplier: number = 1.0): void {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1; // Avoid division by zero
        const dist = Math.sqrt(distSq);

        // Minimum distance based on node sizes (prevent overlap)
        const minDist = (a.radius + b.radius) * 1.5;

        // Modules repel MUCH more strongly (50x multiplier for module-module)
        const isModuleA = this.modules.includes(a as any);
        const isModuleB = this.modules.includes(b as any);
        let modulePenalty = 1;
        if (isModuleA && isModuleB) {
            modulePenalty = 50; // Module-to-module: very strong
        } else if (isModuleA || isModuleB) {
            modulePenalty = 5; // Module-to-node: medium-strong
        }

        // Apply repulsion if nodes are closer than minDist
        if (dist < minDist) {
            const force = (this.strength * multiplier * modulePenalty * (minDist - dist)) / (dist + 1e-6);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
        } else {
            // Weaker repulsion at distance (inverse square)
            const force = (this.strength * multiplier * modulePenalty) / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
        }
    }

    /**
     * Apply attractive force along an edge.
     */
    private applyAttraction(a: Node, b: Node): void {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = (dist - this.distance) * this.EDGE_ATTRACTION_STRENGTH;

        const fx = (dx / (dist + 1e-6)) * force;
        const fy = (dy / (dist + 1e-6)) * force;

        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
    }

    /**
     * Set the repulsive charge force.
     */
    setCharge(strength: number): void {
        this.strength = strength;
    }

    /**
     * Set the target link distance.
     */
    setLinkDistance(distance: number): void {
        this.distance = distance;
    }

    /**
     * Manually set a node's position and pin it (for dragging).
     */
    pinNode(node: Node, x: number, y: number): void {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        this.pinnedNodes.add(node);
    }

    /**
     * Unpin a node (allow it to move again).
     */
    unpinNode(node: Node): void {
        this.pinnedNodes.delete(node);
    }
}
