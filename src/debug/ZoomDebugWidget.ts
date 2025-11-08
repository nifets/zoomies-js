/**
 * Debug widget showing zoom level scale with layer markers.
 * Displays optimal zoom for each layer and current zoom position.
 */
export class ZoomDebugWidget {
    container: HTMLElement;
    scaleCanvas: HTMLCanvasElement;
    zoomLabel: HTMLElement;
    layerLabel: HTMLElement;
    layerScaleFactor: number; // For calculating correct layer-to-zoom mapping

    constructor(layerScaleFactor: number = 5) {
        this.layerScaleFactor = layerScaleFactor;
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
        this.layerLabel.style.marginBottom = '10px';
        this.layerLabel.textContent = 'Layer: 0 | Opacity: 1.0';
        this.container.appendChild(this.layerLabel);

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
     * Update widget with current zoom state and layer info.
     */
    update(zoomLevel: number, currentLayer: number, opacity: number, minZoom: number, maxZoom: number, layerScaleFactor: number): void {
        const zoomWindowSize = Math.log2(layerScaleFactor) * 3;
        this.zoomLabel.textContent = `Zoom: ${zoomLevel.toFixed(2)}`;
        this.layerLabel.textContent = `Layer: ${currentLayer} | Opacity: ${opacity.toFixed(2)} | Window: ${zoomWindowSize.toFixed(1)}`;

        this.drawScale(zoomLevel, minZoom, maxZoom, currentLayer, zoomWindowSize);
    }

    /**
     * Draw zoom scale with layer markers and current position indicator.
     */
    private drawScale(zoomLevel: number, minZoom: number, maxZoom: number, currentLayer: number, zoomWindowSize: number): void {
        const ctx = this.scaleCanvas.getContext('2d')!;
        const width = this.scaleCanvas.width;
        const height = this.scaleCanvas.height;
        const padding = 10;
        const scaleTop = 15;
        const scaleHeight = 12;
        const scaleBottom = scaleTop + scaleHeight;

        // Clear
        ctx.fillStyle = 'rgba(0, 30, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // Draw scale bar
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

        // Draw current zoom indicator
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(zoomPos, scaleTop - 8);
        ctx.lineTo(zoomPos - 4, scaleTop - 1);
        ctx.lineTo(zoomPos + 4, scaleTop - 1);
        ctx.closePath();
        ctx.fill();

        // Draw window range indicator (semi-transparent zone)
        // zoomWindowSize is in layer-space, so convert to zoom-space
        const log2LayerScale = Math.log2(this.layerScaleFactor);
        const windowRadiusZoom = (zoomWindowSize / 2) * log2LayerScale;
        
        const leftWindowZoom = zoomLevel - windowRadiusZoom;
        const rightWindowZoom = zoomLevel + windowRadiusZoom;
        
        const leftWindowPos = padding + ((Math.max(minZoom, leftWindowZoom) - minZoom) / zoomRange) * scaleRange;
        const rightWindowPos = padding + ((Math.min(maxZoom, rightWindowZoom) - minZoom) / zoomRange) * scaleRange;

        ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
        ctx.fillRect(leftWindowPos, scaleTop - 10, rightWindowPos - leftWindowPos, 25);
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftWindowPos, scaleTop - 10, rightWindowPos - leftWindowPos, 25);

        // Draw layer markers using actual inverse formula
        // layer = layerOffset - (zoomLevel / log₂(layerScaleFactor))
        // So: zoomLevel = (layerOffset - layer) * log₂(layerScaleFactor)
        // 
        // We estimate layerOffset from the zoom range:
        // At maxZoom we should see the minimum (most detailed) layer = 0
        // At minZoom we should see the maximum (most abstract) layer
        // layerOffset = 0 + (maxZoom / log₂(layerScaleFactor)) = maxZoom / log₂(5)
        ctx.fillStyle = '#0088ff';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        
        const estimatedLayerOffset = maxZoom / log2LayerScale;
        
        // Determine how many layers fit in the zoom range
        const estimatedMaxLayer = Math.ceil(estimatedLayerOffset - (minZoom / log2LayerScale));
        
        for (let layer = 0; layer <= estimatedMaxLayer; layer++) {
            // Using the actual formula: zoomLevel = (layerOffset - layer) * log₂(layerScaleFactor)
            const layerZoom = (estimatedLayerOffset - layer) * log2LayerScale;
            
            if (layerZoom >= minZoom && layerZoom <= maxZoom) {
                const layerPos = padding + ((layerZoom - minZoom) / zoomRange) * scaleRange;

                // Small tick mark
                ctx.beginPath();
                ctx.moveTo(layerPos, scaleBottom);
                ctx.lineTo(layerPos, scaleBottom + 4);
                ctx.stroke();

                // Layer number label
                ctx.fillText(`L${layer}`, layerPos, scaleBottom + 14);
            }
        }

        // Min/Max labels (left = zoomed out/high layers, right = zoomed in/low layers)
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${minZoom.toFixed(1)}(out)`, padding + 2, height - 2);

        ctx.textAlign = 'right';
        ctx.fillText(`${maxZoom.toFixed(1)}(in)`, width - padding - 2, height - 2);
    }

    /**
     * Remove widget from DOM.
     */
    destroy(): void {
        this.container.remove();
    }
}
