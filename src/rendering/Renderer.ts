import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';
import { Application, Graphics, Container, Text } from 'pixi.js';
import { ZoomManager } from '../managers/ZoomManager';
import type { DetailState, LayerDetailManager } from '../managers/LayerDetailManager';
import { CONFIG } from '../config';

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
    private resizeHandler: (() => void) | null;

    // Zoom-based visibility thresholds
    readonly COMPOSITE_COLLAPSE_ZOOM = 0.3; // Zoom level where children start to hide
    readonly COMPOSITE_FULLY_COLLAPSED_ZOOM = 0.1; // Zoom level where children are completely hidden

    constructor(canvas: HTMLCanvasElement, zoomManager: ZoomManager | null = null, layerDetailManager: LayerDetailManager | null = null) {
        this.canvas = canvas;
        this.zoomManager = zoomManager;
        this.layerDetailManager = layerDetailManager;
        this.resizeHandler = null;
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
        this.resizeHandler = () => {
            if (!this.app.renderer) return; // Prevent errors after destroy
            const newRect = this.canvas.getBoundingClientRect();
            this.app.renderer.resize(newRect.width, newRect.height);
            this.offsetX = newRect.width / 2;
            this.offsetY = newRect.height / 2;
            this.updateWorldTransform();
        };
        window.addEventListener('resize', this.resizeHandler);
    }
    
    private updateWorldTransform(): void {
        if (!this.worldContainer) return; // Guard against destroyed renderer
        this.worldContainer.position.set(this.offsetX, this.offsetY);
        this.worldContainer.scale.set(this.scale, this.scale);
    }

    /**
     * Calculate child node opacity based on parent composite detail state.
     * Children fade based on whether parent shows children.
     */
    private getChildNodeOpacity(node: Entity): number {
        if (!node.parent || node.parent.implicit) return 1.0;
        
        // Use detail state to determine if parent shows children
        const currentZoom = this.zoomManager?.zoomLevel ?? 0;
        const parentDetailState = this.layerDetailManager?.getDetailStateAtZoom(node.parent, currentZoom);
        
        if (parentDetailState) {
            return parentDetailState.showChildren ? 1.0 : 0.0;
        }
        
        return 1.0;
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
        
        // Use detail state opacity if provided, otherwise fall back to old method
        const finalOpacity = detailState ? detailState.opacity * node.alpha : node.alpha * this.getChildNodeOpacity(node);
        graphics.alpha = finalOpacity;
        
        // Entity-level attributes take precedence over layer metadata
        // Entity-level shape takes precedence over layer metadata
        const nodeShape = node.shape ?? this.layerDetailManager?.getLayerEntityShape(node.layer) ?? 'circle';
        
        let nodeColour = node.colour ?? this.layerDetailManager?.getLayerEntityColour(node.layer) ?? '#3498db';
        const colour = parseInt(nodeColour.replace('#', ''), 16);
        
        // Determine background opacity from detail state
        const bgOpacity = detailState?.backgroundOpacity ?? 1.0;
        
        // Let the shape handle its own rendering
        node.shapeObject.draw(graphics, node.x, node.y, colour, bgOpacity);
        
        // Draw border if detail state says to show it
        if (detailState?.showBorder ?? true) {
            node.shapeObject.drawStroke(graphics, node.x, node.y, colour, node.selected, node.highlighted);
        }

        // Label handling for both regular nodes and composites
        let label = this.nodeLabels.get(node);
        const targetRes = Math.max(4, this.scale * 4);
        
        // Font size is managed by entity (same logic as shape sizing)
        
        if (!label) {
            label = new Text({
                text: node.id,
                style: {
                    fontSize: node.labelSize,
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
                    fontSize: node.labelSize,
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
            const diameter = node.shapeObject.getDiameter();
            label.position.set(node.x, node.y - diameter / 2 - labelOffset);
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
        
        // Edge width is not scaled by layer - camera zoom handles all scaling
        const width = connection.attributes.width ?? 2;

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
                
                // Use child node's opacity for branching edges
                const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                const childDetailState = this.layerDetailManager?.getDetailStateAtZoom(childNode, currentZoom) || { opacity: 1 };
                const branchAlpha = childDetailState.opacity * 0.6;
                
                graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
                graphics.lineTo(childEdgePoint.x, childEdgePoint.y);
                graphics.stroke({ color: colour, width: width, alpha: branchAlpha });
            }
            
            // Draw branching edges from target composite to each target child node
            for (const childNode of targetNodes) {
                const childEdgePoint = this.getEdgeConnectionPoint(childNode, source);
                
                // Use child node's opacity for branching edges
                const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                const childDetailState = this.layerDetailManager?.getDetailStateAtZoom(childNode, currentZoom) || { opacity: 1 };
                const branchAlpha = childDetailState.opacity * 0.6;
                
                graphics.moveTo(targetCompositeEntry.x, targetCompositeEntry.y);
                graphics.lineTo(childEdgePoint.x, childEdgePoint.y);
                graphics.stroke({ color: colour, width: width, alpha: branchAlpha });
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
                        
                        // Get current zoom for detail state
                        const currentZoom = this.zoomManager?.zoomLevel ?? 0;
                        const sourceDetailState = this.layerDetailManager?.getDetailStateAtZoom(source, currentZoom) || { opacity: 1 };
                        const targetDetailState = this.layerDetailManager?.getDetailStateAtZoom(target, currentZoom) || { opacity: 1 };
                        
                        // Segment 1: source node → source composite border (use source opacity)
                        graphics.moveTo(sourceNodeEdgePoint.x, sourceNodeEdgePoint.y);
                        graphics.lineTo(sourceCompositeExit.x, sourceCompositeExit.y);
                        graphics.stroke({ color: colour, width: width, alpha: sourceDetailState.opacity * 0.6 });
                        
                        // Segment 2: source composite border → target composite border (main edge)
                        graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
                        graphics.lineTo(targetCompositeEntry.x, targetCompositeEntry.y);
                        graphics.stroke({ color: colour, width: width * 1.5 });
                        
                        // Segment 3: target composite border → target node (use target opacity)
                        graphics.moveTo(targetCompositeEntry.x, targetCompositeEntry.y);
                        graphics.lineTo(targetNodeEdgePoint.x, targetNodeEdgePoint.y);
                        graphics.stroke({ color: colour, width: width, alpha: targetDetailState.opacity * 0.6 });
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
        if (!this.worldContainer) return; // Guard against destroyed renderer
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

    destroy(): void {
        // Remove resize listener first
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Destroy graphics and labels
        this.nodeGraphics.forEach(g => g.destroy());
        this.connectionGraphics.forEach(g => g.destroy());
        this.nodeLabels.forEach(l => l.destroy());
        this.nodeGraphics.clear();
        this.connectionGraphics.clear();
        this.nodeLabels.clear();
        
        // Destroy containers
        if (this.worldContainer) {
            this.worldContainer.removeChildren();
            this.worldContainer.destroy();
        }
        if (this.connectionContainer) {
            this.connectionContainer.destroy();
        }
        if (this.nodeContainer) {
            this.nodeContainer.destroy();
        }
        if (this.labelContainer) {
            this.labelContainer.destroy();
        }
        
        // Destroy the PixiJS app completely to release WebGPU resources
        if (this.app) {
            this.app.destroy();
        }
    }
}
