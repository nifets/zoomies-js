import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';
import { CONFIG } from '../config';

/**
 * Physics engine configuration options.
 */
export interface PhysicsConfig {
    // Base physics constants
    baseRepulsionStrength?: number;
    targetLinkDistance?: number;
    velocityDamping?: number;
    
    // Physics iterations per frame (for force propagation)
    substeps?: number;
    
    // Minimum distance multipliers (relative to sum of radii)
    minNodeDistanceMultiplier?: number;
    
    // Force strength multipliers for different scenarios
    overlapRepulsionStrengthMultiplier?: number;
    moderateDistanceRepulsionStrengthMultiplier?: number;
    moderateDistanceThresholdMultiplier?: number;
    
    // Internal composite physics
    centerAttractionStrength?: number;
    edgeAttractionStrength?: number;
    branchingEdgeAttractionStrength?: number;
    boundaryMargin?: number;
    
    // Velocity constraints
    minVelocityThreshold?: number;
    maxVelocityCap?: number;
    
    // Random initialization ranges
    initialPositionRange?: number;
    initialVelocityRange?: number;
}

/**
 * Default physics configuration.
 */
const DEFAULT_PHYSICS_CONFIG: Required<PhysicsConfig> = {
    baseRepulsionStrength: 50,
    targetLinkDistance: 60,
    velocityDamping: 0.01,
    substeps: 3,
    minNodeDistanceMultiplier: 2,
    overlapRepulsionStrengthMultiplier: 8.0,
    moderateDistanceRepulsionStrengthMultiplier: 1.0,
    moderateDistanceThresholdMultiplier: 2,
    centerAttractionStrength: 0.1,
    edgeAttractionStrength: 0.1,
    branchingEdgeAttractionStrength: 0.0,
    boundaryMargin: 0.9,
    minVelocityThreshold: 0.05,
    maxVelocityCap: 3,
    initialPositionRange: 400,
    initialVelocityRange: 1
};

/**
 * Physics engine for force-directed layout.
 * Uses layer-based simulation where all entities at the same hierarchy level
 * are simulated together in their own "universe".
 */
export class PhysicsEngine {
    root: Entity | null;
    layers: Entity[][] = []; // layers[0] = leaf nodes, layers[1] = their parent composites, etc.
    connections: Connection[];
    isRunning: boolean;
    animationFrameId: number | null;
    pinnedNodes: Set<Entity>;
    visibleEntities: Set<Entity>;
    config: Required<PhysicsConfig>;
    crossLayerConnections: Connection[]; // Connections between entities in different layers

    constructor(config: PhysicsConfig = {}) {
        this.root = null;
        this.layers = [];
        this.connections = [];
        this.isRunning = false;
        this.animationFrameId = null;
        this.pinnedNodes = new Set();
        this.visibleEntities = new Set();
        this.crossLayerConnections = [];
        
        // Merge user config with defaults
        this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    }

    /**
     * Initialize the physics simulation with the root entity.
     * Organizes entities into layers based on their depth in the hierarchy.
     */
    init(root: Entity): void {
        this.root = root;
        this.layers = [];
        
        // Traverse hierarchy and group entities by depth level
        this.buildLayers(root, 0);
        
        // Initialize positions for all entities
        for (const layer of this.layers) {
            for (const entity of layer) {
                if (entity.x === 0 && entity.y === 0) {
                    entity.x = Math.random() * this.config.initialPositionRange - this.config.initialPositionRange / 2;
                    entity.y = Math.random() * this.config.initialPositionRange - this.config.initialPositionRange / 2;
                }
                entity.vx = (Math.random() - 0.5) * this.config.initialVelocityRange;
                entity.vy = (Math.random() - 0.5) * this.config.initialVelocityRange;
            }
        }
    }

    /**
     * Recursively build layers: group entities by their depth.
     * Level 0: leaf nodes (Entity)
     * Level 1: CompositeEntity containing level 0 entities
     * Level N: CompositeEntity containing level N-1 entities
     */
    private buildLayers(entity: Entity, parentDepth: number): number {
        if (entity.implicit) {
            // Implicit entities don't increment depth - their children are at the parent's depth
            if (entity.isComposite()) {
                let maxChildDepth = parentDepth;
                for (const child of entity.children) {
                    const childDepth = this.buildLayers(child, parentDepth);
                    maxChildDepth = Math.max(maxChildDepth, childDepth);
                }
                return maxChildDepth;
            }
            return parentDepth;
        }

        // Non-implicit entity - gets added to current layer
        const depth = parentDepth;
        if (!this.layers[depth]) {
            this.layers[depth] = [];
        }
        this.layers[depth].push(entity);

        // If this is a composite, its children are at depth+1
        if (entity.isComposite()) {
            let maxChildDepth = depth;
            for (const child of entity.children) {
                const childDepth = this.buildLayers(child, depth + 1);
                maxChildDepth = Math.max(maxChildDepth, childDepth);
            }
            return maxChildDepth;
        }

        return depth;
    }

    /**
     * Set connections for the physics simulation.
     */
    setConnections(connections: Connection[]): void {
        this.connections = connections;
        
        // Identify cross-layer connections (edges between entities in different layers)
        this.crossLayerConnections = [];
        for (const conn of connections) {
            if (conn.sources.length === 0 || conn.targets.length === 0) continue;
            
            const source = conn.sources[0];
            const target = conn.targets[0];
            
            // Find which layers contain source and target
            let sourceLayer = -1;
            let targetLayer = -1;
            
            for (let i = 0; i < this.layers.length; i++) {
                if (this.layers[i].includes(source)) sourceLayer = i;
                if (this.layers[i].includes(target)) targetLayer = i;
            }
            
            // If in different layers, it's a cross-layer connection
            if (sourceLayer !== targetLayer && sourceLayer !== -1 && targetLayer !== -1) {
                this.crossLayerConnections.push(conn);
            }
        }
    }

    /**
     * Set the visible entities for physics simulation.
     * Only entities in this set are simulated; others are frozen.
     * Called per frame to filter based on zoom level.
     */
    setVisibleEntities(visibleEntities: Entity[]): void {
        this.visibleEntities = new Set(visibleEntities);
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

        // Run multiple physics iterations per frame for better force propagation
        for (let i = 0; i < this.config.substeps; i++) {
            this.simulationStep();
        }
        this.animationFrameId = requestAnimationFrame(this.animate);
    };

    /**
     * Perform one step of the physics simulation.
     * Simulates each layer independently: entities at the same depth interact with each other.
     */
    private simulationStep(): void {
        // Simulate each layer from bottom to top (leaves first, then containers)
        for (let depth = 0; depth < this.layers.length; depth++) {
            const layer = this.layers[depth];
            if (layer && layer.length > 0) {
                this.simulateLayer(layer, depth);
            }
        }

        // Update all positions
        this.updatePositions();
    }

    /**
     * Simulate physics for all entities at a given layer/depth.
     * All entities at the same depth are treated as peers in the same physics universe.
     */
    private simulateLayer(entities: Entity[], depth: number): void {
        // Step 1: Repulsion between entities at this layer
        for (let i = 0; i < entities.length; i++) {
            for (let j = i + 1; j < entities.length; j++) {
                const a = entities[i];
                const b = entities[j];
                if (this.pinnedNodes.has(a) || this.pinnedNodes.has(b)) continue;
                
                // Skip invisible entities
                if (!this.visibleEntities.has(a) || !this.visibleEntities.has(b)) continue;
                
                // Skip repulsion between parent and direct children (handled by boundary constraint)
                if ((a.isComposite() && a.children.includes(b)) || 
                    (b.isComposite() && b.children.includes(a))) {
                    continue;
                }
                
                // All entities use same repulsion (unified model)
                this.applyRepulsion(a, b, 1.0);
            }
        }

        // Step 2: Apply attractions along connections
        for (const connection of this.connections) {
            if (connection.sources.length === 0 || connection.targets.length === 0) continue;
            if (connection.hidden) {
                // console.log(`[PhysicsEngine] Skipping hidden connection: ${connection.id}`);
                continue;
            }
            
            // Skip synthetic edges entirely - they're just visual representations
            if (connection.attributes.synthetic) {
                // console.log(`[PhysicsEngine] Skipping synthetic connection: ${connection.id}`);
                continue;
            }
            
            const source = connection.sources[0];
            const target = connection.targets[0];
            
            // Only apply if both are in this layer
            if (entities.includes(source) && entities.includes(target)) {
                // console.log(`[PhysicsEngine] Applying attraction on connection: ${connection.id}`);
                this.applyAttraction(source, target, false);
            }
        }

        // Step 3: Center attraction for children to parent
        // Children at this layer should be attracted to their parent's center
        for (const entity of entities) {
            if (this.pinnedNodes.has(entity)) continue;
            if (!this.visibleEntities.has(entity)) continue;
            
            // Find parent (entity at layer depth-1 that contains this entity as a child)
            if (depth > 0 && this.layers[depth - 1]) {
                for (const potentialParent of this.layers[depth - 1]) {
                    if (potentialParent.isComposite() && potentialParent.children.includes(entity)) {
                        // This is the parent - attract child to parent center
                        const dx = potentialParent.x - entity.x;
                        const dy = potentialParent.y - entity.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist > 0) {
                            // Stronger parent attraction - child should primarily be attracted to parent
                            const diameter = entity.shapeObject.getDiameter();
                            const sizeScale = diameter / 2 / CONFIG.DEFAULT_NODE_RADIUS;
                            const force = dist * this.config.centerAttractionStrength * 0.5; // 50% of normal strength
                            entity.vx += (dx / dist) * force;
                            entity.vy += (dy / dist) * force;
                        }
                        break; // Found parent, no need to search further
                    }
                }
            }
        }

        // Step 3b: Attraction to branching points for inter-composite edges
        // Nodes with edges to other composites are attracted toward the branching point
        for (const connection of this.connections) {
            if (connection.hidden || connection.attributes.synthetic) continue;
            if (connection.sources.length === 0 || connection.targets.length === 0) continue;
            
            const source = connection.sources[0];
            const target = connection.targets[0];
            
            // Only process inter-composite edges
            if (!source.parent || !target.parent || source.parent === target.parent) continue;
            if (source.parent.implicit || target.parent.implicit) continue;
            
            // Source is in this layer and has a parent
            if (!entities.includes(source) || !this.visibleEntities.has(source)) continue;
            
            const sourceParent = source.parent as Entity;
            
            // Calculate branching point: where the line from parent to target parent
            // intersects the source parent's boundary
            const dx = target.parent.x - sourceParent.x;
            const dy = target.parent.y - sourceParent.y;
            const distToTarget = Math.sqrt(dx * dx + dy * dy);
            
            if (distToTarget > 0) {
                // Get the border point in the direction of target parent
                const branchPoint = sourceParent.shapeObject.getBorderPoint(
                    sourceParent.x, sourceParent.y,
                    target.parent.x, target.parent.y
                );
                
                // Attract source node toward this branching point
                const bdx = branchPoint.x - source.x;
                const bdy = branchPoint.y - source.y;
                const bDist = Math.sqrt(bdx * bdx + bdy * bdy);
                
                if (bDist > 0 && this.config.branchingEdgeAttractionStrength > 0) {
                    const force = bDist * this.config.branchingEdgeAttractionStrength;
                    source.vx += (bdx / bDist) * force;
                    source.vy += (bdy / bDist) * force;
                }
            }
        }

        // Step 4: Layer-level center attraction (prevents layer drift)
        // Only apply to top-level nodes (those without parents)
        // Child nodes are only attracted to their parent's center (Step 3)
        let centerX = 0, centerY = 0;
        let avgRadius = 0;
        let topLevelCount = 0;
        
        for (const entity of entities) {
            if (!this.visibleEntities.has(entity)) continue;
            
            // Only count top-level nodes (no parent at all)
            if (!entity.parent || !entity.parent.isComposite()) {
                centerX += entity.x;
                centerY += entity.y;
                avgRadius += entity.shapeObject.getDiameter() / 2;
                topLevelCount++;
            }
        }
        
        if (topLevelCount > 0) {
            centerX /= topLevelCount;
            centerY /= topLevelCount;
            avgRadius /= topLevelCount;
        }

        for (const entity of entities) {
            if (this.pinnedNodes.has(entity) || topLevelCount < 2) continue;
            if (!this.visibleEntities.has(entity)) continue;
            
            // Only apply to top-level nodes
            if (entity.parent && entity.parent.isComposite()) continue;
            
            const dx = centerX - entity.x;
            const dy = centerY - entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const radius = entity.shapeObject.getDiameter() / 2;
                const sizeScale = (radius + avgRadius) / (2 * avgRadius);
                const force = dist * this.config.centerAttractionStrength * sizeScale;
                entity.vx += (dx / dist) * force;
                entity.vy += (dy / dist) * force;
            }
        }

        // Step 5: Boundary constraints for composites containing children
        // Find parent-child relationships and apply boundary constraints
        for (const entity of entities) {
            if (!entity.isComposite()) continue;
            if (!this.visibleEntities.has(entity)) continue;
            
            // Apply boundary repulsion/constraint to its visible children
            for (const child of entity.children) {
                if (this.pinnedNodes.has(child)) continue;
                if (!this.visibleEntities.has(child)) continue;
                this.enforceCompositeBoundary(child, entity);
            }
        }
    }



    /**
     * Hard boundary constraint - teleport child back inside if it escapes.
     */
    private enforceCompositeBoundary(child: Entity, composite: Entity): void {
        const result = composite.shapeObject.enforceConstraint(
            child.x, child.y, child.vx, child.vy,
            composite.x, composite.y,
            this.config.boundaryMargin
        );
        
        if (result) {
            child.x = result.x;
            child.y = result.y;
            child.vx = result.vx;
            child.vy = result.vy;
        }
    }

    /**
     * Update positions for all entities in all layers.
     */
    private updatePositions(): void {
        for (const layer of this.layers) {
            for (const entity of layer) {
                if (this.pinnedNodes.has(entity)) {
                    entity.vx = 0;
                    entity.vy = 0;
                    continue;
                }

                entity.vx *= this.config.velocityDamping;
                entity.vy *= this.config.velocityDamping;
                
                // Cap velocity
                const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
                if (speed > this.config.maxVelocityCap) {
                    entity.vx = (entity.vx / speed) * this.config.maxVelocityCap;
                    entity.vy = (entity.vy / speed) * this.config.maxVelocityCap;
                }
                
                // Zero out very small velocities
                if (Math.abs(entity.vx) < this.config.minVelocityThreshold) entity.vx = 0;
                if (Math.abs(entity.vy) < this.config.minVelocityThreshold) entity.vy = 0;
                
                entity.x += entity.vx;
                entity.y += entity.vy;
            }
        }
    }

    /**
     * Apply repulsive force between two nodes.
     * Considers node size (radius) to prevent overlap.
     * All forces scale by node sizes for invariant behavior across different scales.
     */
    private applyRepulsion(a: Entity, b: Entity, multiplier: number = 1.0): void {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 1;
        const dist = Math.sqrt(distSq);

        // Minimum distance based on node sizes
        const aRadius = a.shapeObject.getDiameter() / 2;
        const bRadius = b.shapeObject.getDiameter() / 2;
        const minDist = (aRadius + bRadius) * this.config.minNodeDistanceMultiplier;
        
        // Size scale factor: average of their radii relative to a reference
        // This makes forces proportional to node mass/size
        const avgRadius = (aRadius + bRadius) / 2;
        const sizeScale = avgRadius / CONFIG.DEFAULT_NODE_RADIUS;

        // Apply strong repulsion when nodes are too close (overlapping region)
        if (dist < minDist) {
            const overlap = minDist - dist;
            // Scale base repulsion by size
            const force = (this.config.baseRepulsionStrength * multiplier * overlap * this.config.overlapRepulsionStrengthMultiplier * sizeScale) / (dist + 1e-6);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
        } else if (dist < minDist * this.config.moderateDistanceThresholdMultiplier) {
            // Weaker repulsion at moderate distance, also scaled by size
            const force = (this.config.baseRepulsionStrength * multiplier * this.config.moderateDistanceRepulsionStrengthMultiplier * sizeScale) / distSq;
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
     * Target distance depends on node sizes: equilibrium = minDist + baseSpacing.
     * Force magnitude scales with node sizes for scale-invariant behavior.
     */
    private applyAttraction(a: Entity, b: Entity, isBranching: boolean = false): void {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Minimum distance - don't pull nodes closer than this
        const aRadius = a.shapeObject.getDiameter() / 2;
        const bRadius = b.shapeObject.getDiameter() / 2;
        const minDist = (aRadius + bRadius) * this.config.minNodeDistanceMultiplier;
        
        // Only apply attraction if distance is greater than minimum
        if (dist <= minDist) {
            return;
        }
        
        // Target link distance scales with node sizes: size-aware equilibrium
        const targetDist = minDist + this.config.targetLinkDistance;
        
        // Size scale factor: average radius relative to reference
        const avgRadius = (aRadius + bRadius) / 2;
        const sizeScale = avgRadius / CONFIG.DEFAULT_NODE_RADIUS;
        
        // Cap the attraction distance to prevent excessive forces
        const maxAttractionDistance = targetDist * 3;
        const effectiveDist = Math.min(dist, maxAttractionDistance);
        
        // Choose attraction strength based on edge type
        const attractionStrength = isBranching 
            ? this.config.branchingEdgeAttractionStrength 
            : this.config.edgeAttractionStrength;
        
        // Spring-like attraction: pull towards target distance
        // Scale strength by node size to maintain consistent behavior across scales
        const force = (effectiveDist - targetDist) * attractionStrength * sizeScale;

        const fx = (dx / (dist + 1e-6)) * force;
        const fy = (dy / (dist + 1e-6)) * force;

        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
    }

    /**
     * Set the repulsive charge force strength.
     */
    setCharge(strength: number): void {
        // Note: This now affects BASE_REPULSION_STRENGTH
        // Consider making BASE_REPULSION_STRENGTH non-readonly if dynamic adjustment is needed
        console.warn('setCharge() called but BASE_REPULSION_STRENGTH is readonly. Consider refactoring if dynamic adjustment is required.');
    }

    /**
     * Set the target link distance.
     */
    setLinkDistance(distance: number): void {
        // Note: This now affects TARGET_LINK_DISTANCE
        // Consider making TARGET_LINK_DISTANCE non-readonly if dynamic adjustment is needed
        console.warn('setLinkDistance() called but TARGET_LINK_DISTANCE is readonly. Consider refactoring if dynamic adjustment is required.');
    }

    /**
     * Manually set a node's position and pin it (for dragging).
     */
    pinNode(node: Entity, x: number, y: number): void {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        this.pinnedNodes.add(node);
    }

    /**
     * Unpin a node (allow it to move again).
     */
    unpinNode(node: Entity): void {
        this.pinnedNodes.delete(node);
    }
}
