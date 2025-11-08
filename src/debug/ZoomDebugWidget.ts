/**
 * Debug widget showing zoom level scale bar with explicit layer optimal positions.
 * Visualises the scale bar metaphor: each layer has an optimal viewing position,
 * spaced by log₂(relativeScale) zoom units.
 */
export class ZoomDebugWidget {
    container: HTMLElement;
    scaleCanvas: HTMLCanvasElement;
    zoomLabel: HTMLElement;
    layerLabel: HTMLElement;
    scaleBarLabel: HTMLElement;
    layerScaleFactor: number;
    scaleBar: Map<number, number>; // layer → optimal zoom position

    constructor(layerScaleFactor: number = 5) {
        this.layerScaleFactor = layerScaleFactor;
        this.scaleBar = new Map();
        this.container = document.createElement('div');
        this.container.id = 'zoom-debug-widget';
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            font-family: monospace;
            color: #00ff00;
            width: 320px;
            z-index: 1000;
            font-size: 12px;
            line-height: 1.5;
        `;

        // Zoom level display
        this.zoomLabel = document.createElement('div');
        this.zoomLabel.style.marginBottom = '10px';
        this.zoomLabel.textContent = 'Zoom: 0.0';
        this.container.appendChild(this.zoomLabel);

        // Layer display
        this.layerLabel = document.createElement('div');
        this.layerLabel.style.marginBottom = '5px';
        this.layerLabel.textContent = 'Layer: 0 | Opacity: 1.0';
        this.container.appendChild(this.layerLabel);

        // Scale bar info
        this.scaleBarLabel = document.createElement('div');
        this.scaleBarLabel.style.cssText = 'margin-bottom: 10px; font-size: 10px; opacity: 0.7;';
        this.scaleBarLabel.textContent = 'Scale Bar: Building...';
        this.container.appendChild(this.scaleBarLabel);

        // Canvas for scale visualization
        this.scaleCanvas = document.createElement('canvas');
        this.scaleCanvas.width = 300;
        this.scaleCanvas.height = 80;
        this.scaleCanvas.style.cssText = `
            border: 1px solid #00ff00;
            display: block;
            margin-top: 10px;
            background: rgba(0, 30, 0, 0.5);
        `;
        this.container.appendChild(this.scaleCanvas);

        document.body.appendChild(this.container);
    }

    /**
     * Build the scale bar from layer metadata.
     * Each layer has an optimal zoom position separated by log₂(relativeScale) units.
     */
    buildScaleBar(minLayer: number, maxLayer: number, layerScaleFactor: number): void {
        this.scaleBar.clear();
        this.layerScaleFactor = layerScaleFactor;
        
        let currentZoom = 0; // L0 at zoom = 0 (arbitrary reference)
        this.scaleBar.set(0, currentZoom);
        
        // For now, assume uniform scaling (can be extended with per-layer metadata)
        for (let layer = 1; layer <= maxLayer; layer++) {
            currentZoom += Math.log2(layerScaleFactor);
            this.scaleBar.set(layer, currentZoom);
        }
        
        // Update scale bar info label
        const spacing = Math.log2(layerScaleFactor).toFixed(2);
        this.scaleBarLabel.textContent = `Scale Bar: L0→L1 spacing = ${spacing} zoom units`;
    }

    /**
     * Update widget with current zoom state and layer info.
     */
    update(zoomLevel: number, currentLayer: number, opacity: number, minZoom: number, maxZoom: number, layerScaleFactor: number): void {
        // Build scale bar if not yet built or if scale factor changed
        if (this.scaleBar.size === 0 || this.layerScaleFactor !== layerScaleFactor) {
            const maxLayer = Math.ceil((maxZoom - minZoom) / Math.log2(layerScaleFactor)) + 2;
            this.buildScaleBar(0, maxLayer, layerScaleFactor);
        }
        
        const optimalZoom = this.scaleBar.get(currentLayer) ?? 0;
        const distanceFromOptimal = (zoomLevel - optimalZoom).toFixed(2);
        
        this.zoomLabel.textContent = `Zoom: ${zoomLevel.toFixed(2)} (L${currentLayer}-optimal: ${optimalZoom.toFixed(2)})`;
        this.layerLabel.textContent = `Layer: ${currentLayer} | Opacity: ${opacity.toFixed(2)} | Distance: ${distanceFromOptimal}`;

        this.drawScale(zoomLevel, minZoom, maxZoom, currentLayer);
    }

    /**
     * Draw zoom scale bar with explicit layer optimal positions.
     * Each layer marker shows the optimal zoom position from the scale bar.
     */
    private drawScale(zoomLevel: number, minZoom: number, maxZoom: number, currentLayer: number): void {
        const ctx = this.scaleCanvas.getContext('2d')!;
        const width = this.scaleCanvas.width;
        const height = this.scaleCanvas.height;
        const padding = 10;
        const scaleTop = 20;
        const scaleHeight = 12;
        const scaleBottom = scaleTop + scaleHeight;

        // Clear
        ctx.fillStyle = 'rgba(0, 30, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // Draw scale bar (horizontal line)
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, scaleBottom);
        ctx.lineTo(width - padding, scaleBottom);
        ctx.stroke();

        // Draw end markers
        ctx.beginPath();
        ctx.moveTo(padding, scaleBottom - 5);
        ctx.lineTo(padding, scaleBottom + 5);
        ctx.moveTo(width - padding, scaleBottom - 5);
        ctx.lineTo(width - padding, scaleBottom + 5);
        ctx.stroke();

        // Map zoom to scale position
        const zoomRange = maxZoom - minZoom;
        const scaleRange = width - 2 * padding;
        const zoomPos = padding + ((zoomLevel - minZoom) / zoomRange) * scaleRange;

        // Draw current zoom indicator (yellow triangle)
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(zoomPos, scaleTop - 8);
        ctx.lineTo(zoomPos - 4, scaleTop - 1);
        ctx.lineTo(zoomPos + 4, scaleTop - 1);
        ctx.closePath();
        ctx.fill();

        // Draw layer optimal positions using scale bar
        ctx.fillStyle = '#0088ff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        
        for (const [layer, optimalZoom] of this.scaleBar.entries()) {
            if (optimalZoom >= minZoom && optimalZoom <= maxZoom) {
                const layerPos = padding + ((optimalZoom - minZoom) / zoomRange) * scaleRange;

                // Highlight current layer's optimal position
                const isCurrentLayer = layer === currentLayer;
                const tickHeight = isCurrentLayer ? 8 : 4;
                const tickColor = isCurrentLayer ? '#ff00ff' : '#0088ff';
                
                ctx.strokeStyle = tickColor;
                ctx.lineWidth = isCurrentLayer ? 2 : 1;
                
                // Tick mark
                ctx.beginPath();
                ctx.moveTo(layerPos, scaleBottom);
                ctx.lineTo(layerPos, scaleBottom + tickHeight);
                ctx.stroke();

                // Layer label
                ctx.fillStyle = tickColor;
                ctx.fillText(`L${layer}`, layerPos, scaleBottom + 14 + tickHeight);
                
                // Show optimal zoom value for current layer
                if (isCurrentLayer) {
                    ctx.font = '8px monospace';
                    ctx.fillText(`${optimalZoom.toFixed(1)}`, layerPos, scaleTop - 10);
                    ctx.font = '9px monospace';
                }
            }
        }

        // Draw fade regions around current layer optimal position
        const fadeDistance = Math.log2(this.layerScaleFactor) * 0.5; // Half the layer spacing
        const currentOptimal = this.scaleBar.get(currentLayer) ?? zoomLevel;
        
        const fadeLeftZoom = currentOptimal - fadeDistance;
        const fadeRightZoom = currentOptimal + fadeDistance;
        
        const fadeLeftPos = padding + ((Math.max(minZoom, fadeLeftZoom) - minZoom) / zoomRange) * scaleRange;
        const fadeRightPos = padding + ((Math.min(maxZoom, fadeRightZoom) - minZoom) / zoomRange) * scaleRange;

        // Draw fade region (semi-transparent)
        ctx.fillStyle = 'rgba(255, 0, 255, 0.15)';
        ctx.fillRect(fadeLeftPos, scaleTop - 5, fadeRightPos - fadeLeftPos, scaleHeight + 10);
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(fadeLeftPos, scaleTop - 5, fadeRightPos - fadeLeftPos, scaleHeight + 10);
        ctx.setLineDash([]);

        // Min/Max labels
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${minZoom.toFixed(1)}`, padding + 2, height - 2);

        ctx.textAlign = 'right';
        ctx.fillText(`${maxZoom.toFixed(1)}`, width - padding - 2, height - 2);
    }

    /**
     * Remove widget from DOM.
     */
    destroy(): void {
        this.container.remove();
    }
}
