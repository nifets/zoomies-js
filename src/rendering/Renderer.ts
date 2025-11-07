import { Node } from '../core/Node';
import { Edge } from '../core/Edge';
import { HyperEdge } from '../core/HyperEdge';
import { Module } from '../core/Module';
import { Application, Graphics, Container, Text } from 'pixi.js';

export class Renderer {
    canvas: HTMLCanvasElement;
    app: Application;
    nodeGraphics: Map<Node, Graphics>;
    edgeGraphics: Map<Edge, Graphics>;
    hyperEdgeGraphics: Map<HyperEdge, Graphics>;
    nodeLabels: Map<Node, Text>;
    moduleLabels: Map<Module, Text>;
    worldContainer: Container;
    edgeContainer: Container;
    nodeContainer: Container;
    labelContainer: Container;
    scale: number;
    offsetX: number;
    offsetY: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const rect = canvas.getBoundingClientRect();
        this.app = new Application();
        this.nodeGraphics = new Map();
        this.edgeGraphics = new Map();
        this.hyperEdgeGraphics = new Map();
        this.nodeLabels = new Map();
        this.moduleLabels = new Map();
        this.worldContainer = new Container();
        this.edgeContainer = new Container();
        this.nodeContainer = new Container();
        this.labelContainer = new Container();
        this.worldContainer.addChild(this.edgeContainer);
        this.worldContainer.addChild(this.nodeContainer);
        this.worldContainer.addChild(this.labelContainer);
        this.scale = 1;
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;
    }
    
    async init(): Promise<void> {
        const rect = this.canvas.getBoundingClientRect();
        await this.app.init({
            canvas: this.canvas,
            width: rect.width,
            height: rect.height,
            antialias: true,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
            backgroundColor: 0xffffff
        });
        this.app.stage.addChild(this.worldContainer);
        this.offsetX = rect.width / 2;
        this.offsetY = rect.height / 2;
        this.updateWorldTransform();
        
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

    drawNode(node: Node): void {
        if (node.implicit) return;
        let graphics = this.nodeGraphics.get(node);
        if (!graphics) {
            graphics = new Graphics();
            this.nodeContainer.addChild(graphics);
            this.nodeGraphics.set(node, graphics);
        }
        graphics.clear();
        graphics.alpha = node.alpha;
        const colour = parseInt((node.attributes.colour ?? '#3498db').replace('#', ''), 16);
        
        if (node.shape === 'rectangle') {
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

        if (this.scale > 0.8) {
            let label = this.nodeLabels.get(node);
            const targetRes = Math.max(4, this.scale * 4);
            
            if (!label) {
                label = new Text({
                    text: node.id,
                    style: {
                        fontSize: 12,
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
                // Recreate label with new resolution when zoom changes significantly
                this.labelContainer.removeChild(label);
                label.destroy();
                label = new Text({
                    text: node.id,
                    style: {
                        fontSize: 12,
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
            label.position.set(node.x, node.y);
            label.visible = true;
            label.alpha = node.alpha;
        } else {
            const label = this.nodeLabels.get(node);
            if (label) label.visible = false;
        }
    }

    private getEdgeConnectionPoint(fromNode: Node, toNode: Node): { x: number; y: number } {
        return fromNode.shapeObject.getBorderPoint(fromNode.x, fromNode.y, toNode.x, toNode.y);
    }

    drawEdge(edge: Edge, modules?: any[]): void {
        if (edge.hidden || edge.source.implicit || edge.target.implicit) return;
        
        // Find modules for source and target if not already set
        if (!edge.sourceModule && modules) {
            for (const module of modules) {
                if (module.children.includes(edge.source)) {
                    edge.sourceModule = module;
                    break;
                }
            }
        }
        if (!edge.targetModule && modules) {
            for (const module of modules) {
                if (module.children.includes(edge.target)) {
                    edge.targetModule = module;
                    break;
                }
            }
        }
        
        let graphics = this.edgeGraphics.get(edge);
        if (!graphics) {
            graphics = new Graphics();
            this.edgeContainer.addChild(graphics);
            this.edgeGraphics.set(edge, graphics);
        }
        graphics.clear();
        graphics.alpha = edge.alpha;
        const colour = parseInt((edge.attributes.colour ?? '#95a5a6').replace('#', ''), 16);
        const width = edge.attributes.width ?? 2;

        // Check if this is a cross-module edge requiring branching
        if (edge.sourceModule && edge.targetModule && edge.sourceModule !== edge.targetModule) {
            // Hierarchical edge with branching
            const sourceNode = edge.source;
            const targetNode = edge.target;
            
            // Calculate the inter-module border points first (these are the connection points)
            const sourceModuleExit = this.getEdgeConnectionPoint(edge.sourceModule, edge.targetModule);
            const targetModuleEntry = this.getEdgeConnectionPoint(edge.targetModule, edge.sourceModule);
            
            // 1. sourceNode → sourceModule border (at the exit point)
            const sourceNodeEdge = this.getEdgeConnectionPoint(sourceNode, edge.targetModule);
            graphics.moveTo(sourceNodeEdge.x, sourceNodeEdge.y);
            graphics.lineTo(sourceModuleExit.x, sourceModuleExit.y);
            graphics.stroke({ color: colour, width, alpha: 0.6 });
            
            // 2. sourceModule border → targetModule border
            graphics.moveTo(sourceModuleExit.x, sourceModuleExit.y);
            graphics.lineTo(targetModuleEntry.x, targetModuleEntry.y);
            graphics.stroke({ color: colour, width: width * 1.5 });
            
            // 3. targetModule border → targetNode (from the entry point)
            const targetNodeEdge = this.getEdgeConnectionPoint(targetNode, edge.sourceModule);
            graphics.moveTo(targetModuleEntry.x, targetModuleEntry.y);
            graphics.lineTo(targetNodeEdge.x, targetNodeEdge.y);
            graphics.stroke({ color: colour, width, alpha: 0.6 });
        } else {
            // Regular edge
            const start = this.getEdgeConnectionPoint(edge.source, edge.target);
            const end = this.getEdgeConnectionPoint(edge.target, edge.source);
            graphics.moveTo(start.x, start.y);
            graphics.lineTo(end.x, end.y);
            graphics.stroke({ color: colour, width });
        }
    }

    drawHyperEdge(hyperEdge: HyperEdge): void {
        if (hyperEdge.hidden || hyperEdge.sources.length === 0 || hyperEdge.targets.length === 0) return;
        let graphics = this.hyperEdgeGraphics.get(hyperEdge);
        if (!graphics) {
            graphics = new Graphics();
            this.edgeContainer.addChild(graphics);
            this.hyperEdgeGraphics.set(hyperEdge, graphics);
        }
        graphics.clear();
        graphics.alpha = hyperEdge.alpha * 0.6;
        const sourceCentroidX = hyperEdge.sources.reduce((sum, n) => sum + n.x, 0) / hyperEdge.sources.length;
        const sourceCentroidY = hyperEdge.sources.reduce((sum, n) => sum + n.y, 0) / hyperEdge.sources.length;
        const targetCentroidX = hyperEdge.targets.reduce((sum, n) => sum + n.x, 0) / hyperEdge.targets.length;
        const targetCentroidY = hyperEdge.targets.reduce((sum, n) => sum + n.y, 0) / hyperEdge.targets.length;
        const colour = parseInt((hyperEdge.attributes.colour ?? '#9b59b6').replace('#', ''), 16);
        const width = hyperEdge.attributes.width ?? 1.5;
        for (const source of hyperEdge.sources) {
            graphics.moveTo(source.x, source.y);
            graphics.lineTo(targetCentroidX, targetCentroidY);
            graphics.stroke({ color: colour, width });
        }
        for (const target of hyperEdge.targets) {
            graphics.moveTo(sourceCentroidX, sourceCentroidY);
            graphics.lineTo(target.x, target.y);
            graphics.stroke({ color: colour, width });
        }
    }

    drawModule(module: Module): void {
        if (module.implicit) return;
        let graphics = this.nodeGraphics.get(module);
        if (!graphics) {
            graphics = new Graphics();
            this.nodeContainer.addChild(graphics);
            this.nodeGraphics.set(module, graphics);
        }
        graphics.clear();
        const colour = parseInt((module.attributes.colour ?? '#e8daef').replace('#', ''), 16);
        
        if (module.shape === 'rectangle') {
            const w = module.width ?? module.radius * 2;
            const h = module.height ?? module.radius * 2;
            const cornerRadius = module.attributes.cornerRadius ?? 0;
            graphics.alpha = 0.15;
            graphics.roundRect(module.x - w / 2, module.y - h / 2, w, h, cornerRadius);
            graphics.fill({ color: colour });
            graphics.alpha = 0.6;
            graphics.roundRect(module.x - w / 2, module.y - h / 2, w, h, cornerRadius);
            graphics.stroke({ color: 0x7d3c98, width: 2 });
            
            let label = this.moduleLabels.get(module);
            const targetRes = Math.max(4, this.scale * 4);
            
            if (!label) {
                label = new Text({
                    text: module.id,
                    style: {
                        fontSize: 14,
                        fill: 0x7d3c98,
                        fontWeight: 'bold',
                        align: 'center',
                        fontFamily: 'Arial, sans-serif'
                    },
                    resolution: targetRes
                });
                label.anchor.set(0.5, 1);
                this.labelContainer.addChild(label);
                this.moduleLabels.set(module, label);
            } else if (Math.abs(label.resolution - targetRes) > 2) {
                this.labelContainer.removeChild(label);
                label.destroy();
                label = new Text({
                    text: module.id,
                    style: {
                        fontSize: 14,
                        fill: 0x7d3c98,
                        fontWeight: 'bold',
                        align: 'center',
                        fontFamily: 'Arial, sans-serif'
                    },
                    resolution: targetRes
                });
                label.anchor.set(0.5, 1);
                this.labelContainer.addChild(label);
                this.moduleLabels.set(module, label);
            }
            label.position.set(module.x, module.y - h / 2 - 5);
            label.visible = true;
            label.alpha = 0.8;
        } else {
            const radius = module.radius;
            graphics.alpha = 0.15;
            graphics.circle(module.x, module.y, radius);
            graphics.fill({ color: colour });
            graphics.alpha = 0.6;
            graphics.circle(module.x, module.y, radius);
            graphics.stroke({ color: 0x7d3c98, width: 2 });
            
            let label = this.moduleLabels.get(module);
            const targetRes = Math.max(4, this.scale * 4);
            
            if (!label) {
                label = new Text({
                    text: module.id,
                    style: {
                        fontSize: 14,
                        fill: 0x7d3c98,
                        fontWeight: 'bold',
                        align: 'center',
                        fontFamily: 'Arial, sans-serif'
                    },
                    resolution: targetRes
                });
                label.anchor.set(0.5, 1);
                this.labelContainer.addChild(label);
                this.moduleLabels.set(module, label);
            } else if (Math.abs(label.resolution - targetRes) > 2) {
                this.labelContainer.removeChild(label);
                label.destroy();
                label = new Text({
                    text: module.id,
                    style: {
                        fontSize: 14,
                        fill: 0x7d3c98,
                        fontWeight: 'bold',
                        align: 'center',
                        fontFamily: 'Arial, sans-serif'
                    },
                    resolution: targetRes
                });
                label.anchor.set(0.5, 1);
                this.labelContainer.addChild(label);
                this.moduleLabels.set(module, label);
            }
            label.position.set(module.x, module.y - radius - 5);
            label.visible = true;
            label.alpha = 0.8;
        }
    }

    updatePositions(nodes: Node[]): void {
        for (const node of nodes) {
            this.drawNode(node);
        }
    }

    updateEdges(edges: Edge[]): void {
        for (const edge of edges) {
            this.drawEdge(edge);
        }
    }

    updateHyperEdges(hyperEdges: HyperEdge[]): void {
        for (const hyperEdge of hyperEdges) {
            this.drawHyperEdge(hyperEdge);
        }
    }

    clear(): void {
        // Pixi.js auto-clears
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
