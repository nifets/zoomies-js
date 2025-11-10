import { Entity } from '../core/Entity';
import { Connection } from '../core/Connection';
import { Application, Graphics, Container, Text } from 'pixi.js';
import { ZoomManager } from '../managers/ZoomManager';
import type { DetailState, LayerDetailManager } from '../managers/LayerDetailManager';
import { CONFIG } from '../config';
import { LabelRenderer } from './LabelRenderer';

export class Renderer {
    canvas: HTMLCanvasElement;
    app: Application;
    nodeGraphics: Map<Entity, Graphics>;
    connectionGraphics: Map<Connection, Graphics>;
    nodeLabels: Map<Entity, Text>;
    edgeLabels: Map<Connection, Text>;
    worldContainer: Container;
    connectionContainer: Container;
    nodeContainer: Container;
    labelContainer: Container;
    scale: number;
    offsetX: number;
    offsetY: number;
    zoomManager: ZoomManager | null;
    layerDetailManager: LayerDetailManager | null;
    renderConfig: Record<string, any>;
    private resizeHandler: (() => void) | null;

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
        this.edgeLabels = new Map();
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
        this.renderConfig = { showEdgeLabels: true };
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
            backgroundColor: 0xffffff,
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
    
    // ============================================================================
    // UTILITY METHODS
    // ============================================================================
    
    private updateWorldTransform(): void {
        if (!this.worldContainer) return; // Guard against destroyed renderer
        this.worldContainer.position.set(this.offsetX, this.offsetY);
        this.worldContainer.scale.set(this.scale, this.scale);
    }

    /**
     * Calculate child node opacity based on parent detail state.
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

    /**
     * Calculate texture resolution based on cumulative scale.
     */
    private getTextureResolution(cumulativeScale: number): number {
        return Math.max(1, CONFIG.LABEL_TEXTURE_RESOLUTION / cumulativeScale);
    }

    /**
     * Create or update a text label, recreating only if resolution changed significantly.
     */
    private updateLabel(
        labelMap: Map<any, Text>,
        key: any,
        text: string,
        fontSize: number,
        resolution: number
    ): Text {
        let label = labelMap.get(key);
        
        if (!label) {
            label = new Text({
                text,
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize,
                    fill: 0x000000,
                    align: 'center'
                },
                resolution
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            labelMap.set(key, label);
        } else if (Math.abs(label.resolution - resolution) > 0.1) {
            // Recreate label if resolution changed significantly
            this.labelContainer.removeChild(label);
            label.destroy();
            label = new Text({
                text,
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize,
                    fill: 0x000000,
                    align: 'center'
                },
                resolution
            });
            label.anchor.set(0.5, 0.5);
            this.labelContainer.addChild(label);
            labelMap.set(key, label);
        } else {
            label.text = text;
            label.style.fontSize = fontSize;
        }
        
        return label;
    }

    /**
     * Get point where edge meets node boundary (for drawing edge endpoints).
     */
    private getEdgeConnectionPoint(fromNode: Entity, toNode: Entity): { x: number; y: number } {
        const worldSize = fromNode.getWorldSize();
        return fromNode.shapeObject.getBorderPoint(fromNode.x, fromNode.y, toNode.x, toNode.y, worldSize);
    }

    /**
     * Calculate max layer from connection sources and targets.
     */
    private getConnectionMaxLayer(connection: Connection): number {
        let maxLayer = 0;
        for (const source of connection.sources) {
            maxLayer = Math.max(maxLayer, source.layer);
        }
        for (const target of connection.targets) {
            maxLayer = Math.max(maxLayer, target.layer);
        }
        return maxLayer;
    }

    // ============================================================================
    // RENDERING METHODS
    // ============================================================================
    
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
        const nodeColourStr = node.colour ?? this.layerDetailManager?.getLayerEntityColour(node.layer) ?? '#3498db';
        const colour = parseInt(nodeColourStr.replace('#', ''), 16);
        
        // Determine background opacity from detail state
        const bgOpacity = detailState?.backgroundOpacity ?? 1.0;
        
        // Get world size for rendering (container transform handles screen conversion)
        const screenSize = node.getWorldSize();
        
        // Let the shape handle its own rendering
        node.shapeObject.draw(graphics, node.x, node.y, colour, bgOpacity, screenSize);
        
        // Draw border if detail state says to show it
        if (detailState?.showBorder ?? true) {
            node.shapeObject.drawStroke(graphics, node.x, node.y, colour, node.selected, node.highlighted, screenSize);
        }

        // Label handling for both regular nodes and composites
        const labelTransform = LabelRenderer.getNodeLabelTransform(node, detailState);
        const targetRes = this.getTextureResolution(node.cumulativeScale);
        
        const label = this.updateLabel(
            this.nodeLabels,
            node,
            node.id,
            labelTransform.fontSize,
            targetRes
        );
        
        label.position.set(labelTransform.worldX, labelTransform.worldY);
        label.visible = true;
        label.alpha = (detailState?.opacity ?? 1.0) * node.alpha;
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
        
        const maxLayer = this.getConnectionMaxLayer(connection);
        const edgeColourStr = connection.attributes.colour ?? this.layerDetailManager?.getLayerEdgeColour(maxLayer) ?? '#95a5a6';
        const colour = parseInt(edgeColourStr.replace('#', ''), 16);
        
        // Get world-space width for rendering (container transform handles screen conversion)
        const width = connection.getWorldWidth();
        const currentZoom = this.zoomManager?.zoomLevel ?? 0;

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
                const childDetailState = this.layerDetailManager?.getDetailStateAtZoom(childNode, currentZoom) || { opacity: 1 };
                const branchAlpha = childDetailState.opacity * 0.6;
                
                graphics.moveTo(sourceCompositeExit.x, sourceCompositeExit.y);
                graphics.lineTo(childEdgePoint.x, childEdgePoint.y);
                graphics.stroke({ color: colour, width: width, alpha: branchAlpha });
            }
            
            // Draw branching edges from target composite to each target child node
            for (const childNode of targetNodes) {
                const childEdgePoint = this.getEdgeConnectionPoint(childNode, source);
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
        
        // Render edge label if configured
        if (this.renderConfig.showEdgeLabels) {
            this.drawConnectionLabel(connection, opacity);
        }
    }

    /**
     * Draw a label for a connection at its midpoint.
     */
    private drawConnectionLabel(connection: Connection, opacity: number = 1): void {
        const labelTransform = LabelRenderer.getEdgeLabelTransform(connection);
        if (!labelTransform) return;
        
        const sourceResolution = this.getTextureResolution(connection.sources[0].cumulativeScale);
        const label = this.updateLabel(
            this.edgeLabels,
            connection,
            connection.attributes.label || connection.id,
            labelTransform.fontSize,
            sourceResolution
        );
        
        label.x = labelTransform.worldX;
        label.y = labelTransform.worldY;
        label.rotation = labelTransform.rotation ?? 0;
        label.alpha = connection.alpha * opacity;
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

    // ============================================================================
    // PUBLIC API METHODS
    // ============================================================================

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

    destroy(): void {
        // Remove resize listener
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Clear maps
        this.nodeGraphics.clear();
        this.connectionGraphics.clear();
        this.nodeLabels.clear();
        this.edgeLabels.clear();
        
        // Destroy worldContainer (which destroys all children)
        try {
            if (this.worldContainer) {
                this.worldContainer.removeChildren();
                this.worldContainer.destroy();
            }
        } catch (e) {
            console.error('Error destroying worldContainer:', e);
        }
        
        // Destroy the PixiJS app
        if (this.app) {
            try {
                this.app.destroy();
            } catch (e) {
                console.error('Error destroying PixiJS app:', e);
            }
        }
    }

    /**
     * Set render configuration.
     */
    setRenderConfig(config: Record<string, any>): void {
        this.renderConfig = { ...this.renderConfig, ...config };
    }
}
