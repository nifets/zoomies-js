/**
 * Debug widget showing zoom level scale bar with explicit layer optimal positions.
 * Visualises the scale bar metaphor: each layer has an optimal viewing position,
 * spaced by log₂(relativeScale) zoom units.
 *
 * Uses the ScaleBar from LayerDetailManager to avoid duplication.
 */
import { LayerDetailManager } from '../managers/LayerDetailManager';

export class ZoomDebugWidget {
    container: HTMLElement;
    scaleCanvas: HTMLCanvasElement;
    zoomLabel: HTMLElement;
    layerLabel: HTMLElement;
    scaleBarLabel: HTMLElement;
    layerDetailManager: LayerDetailManager;

    constructor(layerDetailManager: LayerDetailManager) {
        this.layerDetailManager = layerDetailManager;
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
        this.container.appendChild(this.scaleBarLabel);

        // Canvas for scale visualization
        this.scaleCanvas = document.createElement('canvas');
        this.scaleCanvas.width = 300;
        this.scaleCanvas.height = 100;
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
    update(zoomLevel: number, currentLayer: number, opacity: number, minZoom: number, maxZoom: number): void {
        const scaleBar = this.layerDetailManager.scaleBar;
        if (!scaleBar) return;

        const optimalZoom = scaleBar.getOptimalZoomForLayer(currentLayer);
        const distanceFromOptimal = (zoomLevel - optimalZoom).toFixed(2);
        
        // Calculate cumulative scale factor: zoom level determines how much things are scaled
        // zoom=0 (L0) is base scale (×1)
        // zoom=-log2(3) (L1) is ×3 scaled
        // zoom=-log2(6) (L2) is ×6 scaled
        const cumulativeScale = Math.pow(2, -zoomLevel);
        const scaleLabel = cumulativeScale.toFixed(1);
        
        this.zoomLabel.textContent = `Zoom: ${zoomLevel.toFixed(2)} (L${currentLayer}-optimal: ${optimalZoom.toFixed(2)})`;
        this.layerLabel.textContent = `Layer: ${currentLayer} | Opacity: ${opacity.toFixed(2)} | Distance: ${distanceFromOptimal} | Scale: ×${scaleLabel}`;

        this.drawScale(zoomLevel, minZoom, maxZoom, currentLayer, scaleBar);
    }

    /**
     * Draw zoom scale bar using ScaleBar from LayerDetailManager.
     * Each layer marker shows the optimal zoom position from the scale bar.
     * Fade windows show visibility ranges for each layer.
     */
    private drawScale(zoomLevel: number, minZoom: number, maxZoom: number, currentLayer: number, scaleBar: any): void {
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
        // Scale bar visualization: L0 (zoomed in) on LEFT, L2 (zoomed out) on RIGHT
        // Zoom coordinates: L0=0 (high), L2=negative (low)
        // So we need to flip: higher zoom → left, lower zoom → right
        const zoomRange = maxZoom - minZoom;
        const scaleRange = width - 2 * padding;
        const zoomPos = padding + ((maxZoom - zoomLevel) / zoomRange) * scaleRange;

        // Draw fade windows for all layers
        // Windows are defined in SCALE coordinates (cumulative scale factor)
        ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        for (const [layer] of scaleBar.layerPositions.entries()) {
            const { minScale, maxScale } = scaleBar.getLayerWindow(layer);
            
            // Convert scale coordinates to zoom coordinates for display
            // Handle very small scales (approaching 0) by clamping to a reasonable max zoom
            const minZoomForLayer = minScale <= Number.EPSILON ? maxZoom : -Math.log2(minScale);
            const maxZoomForLayer = maxScale === Infinity ? minZoom : -Math.log2(maxScale);
            
            // Then convert zoom to pixel positions
            const minPx = padding + ((maxZoom - minZoomForLayer) / zoomRange) * scaleRange;
            const maxPx = padding + ((maxZoom - maxZoomForLayer) / zoomRange) * scaleRange;
            
            // Highlight current layer's window
            if (layer === currentLayer) {
                ctx.fillStyle = 'rgba(255, 100, 255, 0.15)';
                ctx.strokeStyle = 'rgba(255, 100, 255, 0.5)';
                ctx.lineWidth = 1.5;
            } else {
                ctx.fillStyle = 'rgba(100, 150, 255, 0.1)';
                ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
                ctx.lineWidth = 1;
            }
            
            ctx.fillRect(minPx, scaleTop - 5, maxPx - minPx, scaleHeight + 10);
            ctx.strokeRect(minPx, scaleTop - 5, maxPx - minPx, scaleHeight + 10);
            
            // Draw label switch point
            const labelSwitchZoom = scaleBar.getLabelSwitchZoom(layer);
            const switchPx = padding + ((maxZoom - labelSwitchZoom) / zoomRange) * scaleRange;
            ctx.strokeStyle = 'rgba(200, 100, 200, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([1, 1]);
            ctx.beginPath();
            ctx.moveTo(switchPx, scaleTop - 3);
            ctx.lineTo(switchPx, scaleBottom + 3);
            ctx.stroke();
            ctx.setLineDash([2, 2]);
            
            // Draw fade checkpoints (10% from window edges in zoom space)
            const minCheckpointZoom = scaleBar.getMinFadeCheckpoint(layer);
            const maxCheckpointZoom = scaleBar.getMaxFadeCheckpoint(layer);
            const minCheckPx = padding + ((maxZoom - minCheckpointZoom) / zoomRange) * scaleRange;
            const maxCheckPx = padding + ((maxZoom - maxCheckpointZoom) / zoomRange) * scaleRange;
            
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.6)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            // Min fade checkpoint
            ctx.beginPath();
            ctx.moveTo(minCheckPx, scaleTop + scaleHeight - 3);
            ctx.lineTo(minCheckPx, scaleBottom + 3);
            ctx.stroke();
            // Max fade checkpoint
            ctx.beginPath();
            ctx.moveTo(maxCheckPx, scaleTop + scaleHeight - 3);
            ctx.lineTo(maxCheckPx, scaleBottom + 3);
            ctx.stroke();
            ctx.setLineDash([2, 2]);
        }
        
        ctx.setLineDash([]);

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
        
        for (const [layer, optimalZoom] of scaleBar.layerPositions.entries()) {
            if (optimalZoom >= minZoom && optimalZoom <= maxZoom) {
                const layerPos = padding + ((maxZoom - optimalZoom) / zoomRange) * scaleRange;

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
                ctx.font = '8px monospace';
                const scaleLabel = `L${layer}`;
                ctx.fillText(scaleLabel, layerPos, scaleBottom + 16);
                ctx.font = '9px monospace';
                
                // Show optimal zoom value for current layer
                if (isCurrentLayer) {
                    ctx.font = '8px monospace';
                    ctx.fillText(`${optimalZoom.toFixed(1)}`, layerPos, scaleTop - 10);
                    ctx.font = '9px monospace';
                }
            }
        }

        // Min/Max labels (left = zoomed in, right = zoomed out)
        // minZoom is most negative (zoomed out), maxZoom is most positive (zoomed in)
        // But we display them: left = high zoom (in), right = low zoom (out)
        ctx.fillStyle = '#00ff00';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${maxZoom.toFixed(1)} (in)`, padding + 2, height - 2);

        ctx.textAlign = 'right';
        ctx.fillText(`${minZoom.toFixed(1)} (out)`, width - padding - 2, height - 2);
    }

    /**
     * Remove widget from DOM.
     */
    destroy(): void {
        this.container.remove();
    }
}
