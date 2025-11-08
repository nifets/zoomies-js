import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';
import { Application, Graphics, Container, Text } from 'pixi.js';
import { ZoomManager } from '../managers/ZoomManager';
import type { DetailState, LayerDetailManager } from '../managers/LayerDetailManager';

export class Renderer {
    canvas: HTMLCanvasElement;
    app: Application;
    nodeGraphics: Map<Entity, Graphics>;
    connectionGraphics: Map<Connection, Graphics>;
    nodeLabels: Map<Entity, Text>;
    worldContainer: Container;
    connectionContainer: Container;
    nodeContainer: Container;
    labelContainer: Container;
    scale: number;
    offsetX: number;
    offsetY: number;
    zoomManager: ZoomManager | null;
    layerDetailManager: LayerDetailManager | null;

    // Zoom-based visibility thresholds
    readonly COMPOSITE_COLLAPSE_ZOOM = 0.3; // Zoom level where children start to hide
    readonly COMPOSITE_FULLY_COLLAPSED_ZOOM = 0.1; // Zoom level where children are completely hidden

    constructor(canvas: HTMLCanvasElement, zoomManager: ZoomManager | null = null, layerDetailManager: LayerDetailManager | null = null) {
        this.canvas = canvas;
        this.zoomManager = zoomManager;
        this.layerDetailManager = layerDetailManager;
        const rect = canvas.getBoundingClientRect();
        this.app = new Application();
        this.nodeGraphics = new Map();
        this.connectionGraphics = new Map();
        this.nodeLabels = new Map();
        this.worldContainer = new Container();
        this.connectionContainer = new Container();
        this.nodeContainer = new Container();
        this.labelContainer = new Container();
        this.worldContainer.addChild(this.nodeContainer);
        this.worldContainer.addChild(this.connectionContainer);
        this.worldContainer.addChild(this.labelContainer);
        this.scale = 1;
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;
    }
    
    async init(): Promise<void> {
        const rect = this.canvas.getBoundingClientRect();
        console.log('[Renderer] Initializing with dimensions:', rect.width, 'x', rect.height);
        await this.app.init({
            canvas: this.canvas,
            width: rect.width,
            height: rect.height,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            backgroundColor: 0xffffff
        });
        console.log('[Renderer] PixiJS app initialized');
        this.app.stage.addChild(this.worldContainer);
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;
        this.updateWorldTransform();
        console.log('[Renderer] World transform set, offset:', this.offsetX, this.offsetY);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const newRect = this.canvas.getBoundingClientRect();
            this.app.renderer.resize(newRect.width, newRect.height);
            this.offsetX = newRect.width / 2;
            this.offsetY = newRect.height / 2;
            this.updateWorldTransform();
        });
    }
    
    private updateWorldTransform(): void {
        this.worldContainer.position.set(this.offsetX, this.offsetY);
        this.worldContainer.scale.set(this.scale, this.scale);
    }

    /**
     * Calculate child node opacity based on parent composite collapse state.
     * Children fade out as composite collapses.
     */
    private getChildNodeOpacity(node: Entity): number {
        if (!node.parent || node.parent.implicit) return 1.0;
        
        const collapseState = this.zoomManager?.getCompositeCollapseState(this.COMPOSITE_COLLAPSE_ZOOM, this.COMPOSITE_FULLY_COLLAPSED_ZOOM) ?? 0;
        // Children fade from 1.0 (expanded) to 0.0 (collapsed)
        return Math.max(0, 1.0 - collapseState);
    }

    drawNode(node: Entity, detailState?: DetailState): void {
        if (node.implicit) return;
        let graphics = this.nodeGraphics.get(node);
        if (!graphics) {
            graphics = new Graphics();
            this.nodeContainer.addChild(graphics);
            this.nodeGraphics.set(node, graphics);
            console.log('[Renderer] Created graphics for node:', node.id, 'at', node.x, node.y);
        }
        graphics.clear();
        graphics.alpha = node.alpha * this.getChildNodeOpacity(node);
        
        // Entity-level attributes take precedence over layer metadata
        // Only use layer metadata if entity didn't explicitly specify the attribute
        const nodeShape = node.shape ?? this.layerDetailManager?.getLayerEntityShape(node.layer) ?? 'circle';
        
        // If shape differs from current shapeObject's type, update it
        if (node.shapeObject.getType() !== nodeShape) {
            node.updateShapeObject(nodeShape);
        }
        
        let nodeColour = node.colour ?? this.layerDetailManager?.getLayerEntityColour(node.layer) ?? '#3498db';
        const colour = parseInt(nodeColour.replace('#', ''), 16);
        
        if (nodeShape === 'rectangle') {
            const w = node.width ?? node.radius * 2;
            const h = node.height ?? node.radius * 2;
            const cornerRadius = node.attributes.cornerRadius ?? 0;
            graphics.roundRect(node.x - w / 2, node.y - h / 2, w, h, cornerRadius);
            graphics.fill({ color: colour });
            if (node.selected) {
                graphics.roundRect(node.x - w / 2, node.y - h / 2, w, h, cornerRadius);
                graphics.stroke({ color: 0xf39c12, width: 3 });
            } else if (node.attributes.highlighted) {
                graphics.roundRect(node.x - w / 2, node.y - h / 2, w, h, cornerRadius);
                graphics.stroke({ color: 0xe74c3c, width: 2 });
            }
        } else {
            const radius = Math.max(3, node.radius);
            graphics.circle(node.x, node.y, radius);
            graphics.fill({ color: colour });
            if (node.selected) {
                graphics.circle(node.x, node.y, radius);
                graphics.stroke({ color: 0xf39c12, width: 3 });
            } else if (node.attributes.highlighted) {
                graphics.circle(node.x, node.y, radius);
                graphics.stroke({ color: 0xe74c3c, width: 2 });
            }
        }

        // Label handling for both regular nodes and composites
        let label = this.nodeLabels.get(node);
        const targetRes = Math.max(4, this.scale * 4);
        
        // Scale label font size by layer (same as node size scaling)
        const layerScaleFactor = node.attributes.layerScaleFactor ?? 5;
        const layerScale = Math.pow(layerScaleFactor, node.layer);
        const fontSize = 12 * layerScale;
        
        if (!label) {
            label = new Text({
                text: node.id,
                style: {
                    fontSize: fontSize,
                    fill: 0x000000,
                    align: 'center',
                    fontFamily: 'Arial, sans-serif'
                },
                resolution: targetRes
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            this.nodeLabels.set(node, label);
        } else if (Math.abs(label.resolution - targetRes) > 2) {
            this.labelContainer.removeChild(label);
            label.destroy();
            label = new Text({
                text: node.id,
                style: {
                    fontSize: fontSize,
                    fill: 0x000000,
                    align: 'center',
                    fontFamily: 'Arial, sans-serif'
                },
                resolution: targetRes
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            this.nodeLabels.set(node, label);
        }
        
        const labelOffset = 20;
        if (detailState && detailState.labelInside) {
            label.position.set(node.x, node.y);
        } else {
            label.position.set(node.x, node.y - node.radius - labelOffset);
        }
        
        label.visible = true;
        label.alpha = (detailState?.opacity ?? 1.0) * node.alpha;
    }

    private getEdgeConnectionPoint(fromNode: Entity, toNode: Entity): { x: number; y: number } {
        return fromNode.shapeObject.getBorderPoint(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }

    drawConnection(connection: Connection, detailState?: DetailState): void {
        if (connection.hidden || connection.sources.length === 0 || connection.targets.length === 0) return;
        
        let graphics = this.connectionGraphics.get(connection);
        if (!graphics) {
            graphics = new Graphics();
            this.connectionContainer.addChild(graphics);
            this.connectionGraphics.set(connection, graphics);
        }
        graphics.clear();
        
        // Apply detail state opacity if provided
        const opacity = detailState ? detailState.opacity : 1;
        graphics.alpha = connection.alpha * opacity;
        
        // Connection-level colour takes precedence over layer metadata
        // Only use layer metadata if connection didn't explicitly specify the colour
        let maxLayer = 0;
        for (const source of connection.sources) {
            maxLayer = Math.max(maxLayer, source.layer);
        }
        for (const target of connection.targets) {
            maxLayer = Math.max(maxLayer, target.layer);
        }
        const edgeColourStr = connection.attributes.colour ?? this.layerDetailManager?.getLayerEdgeColour(maxLayer) ?? '#95a5a6';
        const colour = parseInt(edgeColourStr.replace('#', ''), 16);
        
        // Scale edge width by layer
        const layerScaleFactor = connection.sources[0]?.attributes.layerScaleFactor ?? 5;
        const layerScale = Math.pow(layerScaleFactor, maxLayer);
        const width = (connection.attributes.width ?? 2) * layerScale;

        // Check if this is a synthetic edge between composites
        if (connection.attributes.synthetic && connection.subEdges.length > 0) {
            // For synthetic edges, draw from composite border to each child node involved
            const source = connection.sources[0];
            const target = connection.targets[0];
            
            // Get unique source and target nodes from subEdges
            const sourceNodes = new Set<any>();
            const targetNodes = new Set<any>();
            for (const subEdge of connection.subEdges) {
                sourceNodes.add(subEdge.source);
                targetNodes.add(subEdge.target);
            }
            
            // Draw main edge between composites
            const sourceCompositeExit = this.getEdgeConnectionPoint(source, target);
            const targetCompositeEntry = this.getEdgeConnectionPoint(target, source);
            graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
            graphics.lineTo(targetCompositeEntry.x, targetCompositeEntry.y);
            graphics.stroke({ color: colour, width: width * 1.5 });
            
            // Draw branching edges from source composite to each source child node
            for (const childNode of sourceNodes) {
                const childEdgePoint = this.getEdgeConnectionPoint(childNode, target);
                // Scale by geometric mean between parent and child layer scales
                const childLayerScale = Math.pow(layerScaleFactor, childNode.layer);
                const meanScale = Math.sqrt(layerScale * childLayerScale);
                const branchWidth = (connection.attributes.width ?? 2) * meanScale;
                
                // Use child node's opacity for branching edges
                const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                const childDetailState = this.layerDetailManager?.getDetailStateAtZoom(childNode, currentZoom) || { opacity: 1 };
                const branchAlpha = childDetailState.opacity * 0.6;
                
                graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
                graphics.lineTo(childEdgePoint.x, childEdgePoint.y);
                graphics.stroke({ color: colour, width: branchWidth, alpha: branchAlpha });
            }
            
            // Draw branching edges from target composite to each target child node
            for (const childNode of targetNodes) {
                const childEdgePoint = this.getEdgeConnectionPoint(childNode, source);
                // Scale by geometric mean between parent and child layer scales
                const childLayerScale = Math.pow(layerScaleFactor, childNode.layer);
                const meanScale = Math.sqrt(layerScale * childLayerScale);
                const branchWidth = (connection.attributes.width ?? 2) * meanScale;
                
                // Use child node's opacity for branching edges
                const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                const childDetailState = this.layerDetailManager?.getDetailStateAtZoom(childNode, currentZoom) || { opacity: 1 };
                const branchAlpha = childDetailState.opacity * 0.6;
                
                graphics.moveTo(targetCompositeEntry.x, targetCompositeEntry.y);
                graphics.lineTo(childEdgePoint.x, childEdgePoint.y);
                graphics.stroke({ color: colour, width: branchWidth, alpha: branchAlpha });
            }
        } else {
            // Handle many-to-many connections: draw from each source to each target
            for (const source of connection.sources) {
                if (source.implicit) continue;
                for (const target of connection.targets) {
                    if (target.implicit) continue;
                    
                    // Check if source and target are in different composites (cross-layer connection)
                    const sourceParent = source.parent;
                    const targetParent = target.parent;
                    
                    if (sourceParent && targetParent && sourceParent !== targetParent && !sourceParent.implicit && !targetParent.implicit) {
                        // Cross-composite hierarchical edge with branching
                        const sourceNodeEdgePoint = this.getEdgeConnectionPoint(source, targetParent);
                        const sourceCompositeExit = this.getEdgeConnectionPoint(sourceParent, targetParent);
                        const targetCompositeEntry = this.getEdgeConnectionPoint(targetParent, sourceParent);
                        const targetNodeEdgePoint = this.getEdgeConnectionPoint(target, sourceParent);
                        
                        // Scale branching widths by geometric mean between parent and child layer scales
                        const sourceChildLayerScale = Math.pow(layerScaleFactor, source.layer);
                        const sourceParentLayerScale = Math.pow(layerScaleFactor, sourceParent.layer);
                        const targetChildLayerScale = Math.pow(layerScaleFactor, target.layer);
                        const targetParentLayerScale = Math.pow(layerScaleFactor, targetParent.layer);
                        const sourceBranchWidth = (connection.attributes.width ?? 2) * Math.sqrt(sourceParentLayerScale * sourceChildLayerScale);
                        const targetBranchWidth = (connection.attributes.width ?? 2) * Math.sqrt(targetParentLayerScale * targetChildLayerScale);
                        
                        // Get current zoom for detail state
                        const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                        const sourceDetailState = this.layerDetailManager?.getDetailStateAtZoom(source, currentZoom) || { opacity: 1 };
                        const targetDetailState = this.layerDetailManager?.getDetailStateAtZoom(target, currentZoom) || { opacity: 1 };
                        
                        // Segment 1: source node → source composite border (use source opacity)
                        graphics.moveTo(sourceNodeEdgePoint.x, sourceNodeEdgePoint.y);
                        graphics.lineTo(sourceCompositeExit.x, sourceCompositeExit.y);
                        graphics.stroke({ color: colour, width: sourceBranchWidth, alpha: sourceDetailState.opacity * 0.6 });
                        
                        // Segment 2: source composite border → target composite border (main edge)
                        graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
                        graphics.lineTo(targetCompositeEntry.x, targetCompositeEntry.y);
                        graphics.stroke({ color: colour, width: width * 1.5 });
                        
                        // Segment 3: target composite border → target node (use target opacity)
                        graphics.moveTo(targetCompositeEntry.x, targetCompositeEntry.y);
                        graphics.lineTo(targetNodeEdgePoint.x, targetNodeEdgePoint.y);
                        graphics.stroke({ color: colour, width: targetBranchWidth, alpha: targetDetailState.opacity * 0.6 });
                    } else {
                        // Regular edge (same composite or no parents)
                        const start = this.getEdgeConnectionPoint(source, target);
                        const end = this.getEdgeConnectionPoint(target, source);
                        graphics.moveTo(start.x, start.y);
                        graphics.lineTo(end.x, end.y);
                        graphics.stroke({ color: colour, width });
                    }
                }
            }
        }
    }

    updatePositions(nodes: Entity[]): void {
        for (const node of nodes) {
            this.drawNode(node);
        }
    }

    updateConnections(connections: Connection[]): void {
        for (const connection of connections) {
            this.drawConnection(connection);
        }
    }

    clear(): void {
        // Don't remove graphics, just clear them - they'll be redrawn
    }

    render(): void {
        // PixiJS v8 auto-renders, no need to call render manually
        // The app.ticker handles rendering automatically
    }

    setCamera(scale: number, offsetX: number, offsetY: number): void {
        this.scale = scale;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.updateWorldTransform();
    }

    getDimensions(): { width: number; height: number } {
        return { 
            width: this.canvas.width / window.devicePixelRatio, 
            height: this.canvas.height / window.devicePixelRatio 
        };
    }
}
