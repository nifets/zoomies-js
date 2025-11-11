/**
 * Debug widget showing zoom level scale bar with explicit layer segment windows.
 * Visualises each layer's presentation mode segments (FADING_IN, EXPANDED, COLLAPSING, etc).
 * Layers alternate above/below centre line for clarity.
 *
 * Uses the ScaleBar from LayerDetailManager to display segment boundaries.
 */
import { LayerDetailManager, PresentationMode } from '../managers/LayerDetailManager';
import { CONFIG } from '../config';

export class ZoomDebugWidget {
    container: HTMLElement;
    scaleCanvas: HTMLCanvasElement;
    zoomLabel: HTMLElement;
    layerLabel: HTMLElement;
    layerDetailManager: LayerDetailManager;
    private loggingDone: boolean = false;

    constructor(layerDetailManager: LayerDetailManager) {
        this.layerDetailManager = layerDetailManager;
        this.loggingDone = false;
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
            width: 420px;
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
        this.scaleCanvas.width = 400;
        this.scaleCanvas.height = 200;
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
        const cumulativeScale = Math.pow(2, -zoomLevel);
        const scaleLabel = cumulativeScale.toFixed(1);
        
        this.zoomLabel.textContent = `Zoom: ${zoomLevel.toFixed(2)} | Scale: ×${scaleLabel}`;
        this.layerLabel.textContent = `Layer: ${currentLayer} | Opacity: ${opacity.toFixed(2)} | Distance from optimal: ${distanceFromOptimal}`;

        // Log segments in zoom coordinates for debugging (only once)
        if (true && !this.loggingDone) {
            this.loggingDone = true;
            console.log('[ZoomDebugWidget] Layer segments (scale → zoom):');
            for (const [layer] of scaleBar.layerWindowSegments) {
                const seg = scaleBar.layerWindowSegments.get(layer as number)!;
                const formatScale = (s: number) => isNaN(s) ? 'NaN' : (isFinite(s) ? s.toFixed(4) : (s === Infinity ? 'Inf' : '-Inf'));
                const formatZoom = (s: number) => {
                    if (isNaN(s)) return 'NaN';
                    if (s === Infinity) return '+∞';
                    if (s === -Infinity) return '-∞';
                    return isFinite(s) ? s.toFixed(2) : 'non-finite';
                };
                const fadingInMinZoom = this.scaleToZoom(seg.fadingInMin);
                const expandedMinZoom = this.scaleToZoom(seg.expandedMin);
                const expandedMaxZoom = this.scaleToZoom(seg.expandedMax);
                const collapsedMinZoom = this.scaleToZoom(seg.collapsedMin);
                const collapsedMaxZoom = this.scaleToZoom(seg.collapsedMax);
                const fadingOutMaxZoom = this.scaleToZoom(seg.fadingOutMax);
                
                console.log(
                    `  L${layer}: ` +
                    `fadingInMin=${formatScale(seg.fadingInMin)}→${formatZoom(fadingInMinZoom)}, ` +
                    `expandedMin=${formatScale(seg.expandedMin)}→${formatZoom(expandedMinZoom)}, ` +
                    `expandedMax=${formatScale(seg.expandedMax)}→${formatZoom(expandedMaxZoom)}, ` +
                    `collapsedMin=${formatScale(seg.collapsedMin)}→${formatZoom(collapsedMinZoom)}, ` +
                    `collapsedMax=${formatScale(seg.collapsedMax)}→${formatZoom(collapsedMaxZoom)}, ` +
                    `fadingOutMax=${formatScale(seg.fadingOutMax)}→${formatZoom(fadingOutMaxZoom)}`
                );
            }
        }

        this.drawScale(zoomLevel, minZoom, maxZoom, currentLayer, scaleBar);
    }

    /**
     * Convert scale coordinate to zoom coordinate.
     * scale = 2^(-zoom), so zoom = -log2(scale)
     * Special cases:
     *   - scale = 0 → zoom = ∞ (zoomed out infinitely)
     *   - scale = ∞ → zoom = -∞ (zoomed in infinitely)
     *   - scale ≤ 0 or NaN → clamp to visible zoom range bounds
     */
    private scaleToZoom(scale: number): number {
        if (isNaN(scale)) {
            return 0; // NaN fallback
        }
        if (scale === 0) {
            return Infinity; // scale 0 → zoom ∞
        }
        if (scale === Infinity) {
            return -Infinity; // scale ∞ → zoom -∞
        }
        if (scale < 0) {
            return 0; // Invalid negative scale
        }
        const zoom = -Math.log2(scale);
        return isFinite(zoom) ? zoom : 0;
    }

    /**
     * Get presentation mode for a layer at the current zoom level.
     */
    private getPresentationModeForLayer(layer: number, zoomLevel: number, scaleBar: any): PresentationMode {
        const segments = scaleBar.layerWindowSegments.get(layer);
        if (!segments) return PresentationMode.INVISIBLE;
        return this.layerDetailManager.determinePresentationMode(zoomLevel, segments);
    }

    /**
     * Format presentation mode name for display.
     */
    private formatModeName(mode: PresentationMode): string {
        return mode.replace(/_/g, ' ');
    }

    /**
     * Draw segment windows for each layer.
     * Each layer gets its own horizontal axis, stacked vertically.
     */
    private drawScale(zoomLevel: number, minZoom: number, maxZoom: number, currentLayer: number, scaleBar: any): void {
        const ctx = this.scaleCanvas.getContext('2d')!;
        const width = this.scaleCanvas.width;
        const height = this.scaleCanvas.height;
        const padding = 15;
        const zoomRange = maxZoom - minZoom;
        const scaleRange = width - 2 * padding;

        // Clear
        ctx.fillStyle = 'rgba(0, 30, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);

        // Get all layers
        const layerArray = Array.from(scaleBar.layerWindowSegments.keys() as IterableIterator<number>).sort((a, b) => a - b);
        const layerHeight = Math.max(40, Math.min(60, height / Math.max(1, layerArray.length)));
        
        // Draw each layer on its own axis
        for (let i = 0; i < layerArray.length; i++) {
            const layer = layerArray[i];
            const segments = scaleBar.layerWindowSegments.get(layer);
            if (!segments) continue;

            const axisY = padding + i * layerHeight + layerHeight / 2;
            const isCurrent = layer === currentLayer;

            // Draw axis line for this layer
            ctx.strokeStyle = isCurrent ? '#ffff00' : 'rgba(0, 255, 0, 0.3)';
            ctx.lineWidth = isCurrent ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(padding, axisY);
            ctx.lineTo(width - padding, axisY);
            ctx.stroke();

            // Convert scale coordinates to zoom coordinates
            // For first layer (NaN fadingInMin), use expandedMin as the fade start
            // For last layer (NaN fadingOutMax), use collapsedMax as the fade end
            const fadingInMinZoom = this.scaleToZoom(isNaN(segments.fadingInMin) ? segments.expandedMin : segments.fadingInMin);
            const expandedMinZoom = this.scaleToZoom(segments.expandedMin);
            const expandedMaxZoom = this.scaleToZoom(segments.expandedMax);
            const collapsedMinZoom = this.scaleToZoom(segments.collapsedMin);
            const collapsedMaxZoom = this.scaleToZoom(segments.collapsedMax);
            const fadingOutMaxZoom = this.scaleToZoom(isNaN(segments.fadingOutMax) ? segments.collapsedMax : segments.fadingOutMax);

            const windowHeight = 12;
            const topY = axisY - windowHeight / 2;
            const bottomY = axisY + windowHeight / 2;

            // Determine window colour based on layer
            const windowFill = isCurrent ? 'rgba(255, 200, 100, 0.15)' : 'rgba(100, 100, 100, 0.1)';
            const windowStroke = isCurrent ? '#ffcc66' : '#666666';

            // Draw all segment windows
            const segmentBounds: Array<[string, number, number, boolean]> = [
                ['FADING_IN', fadingInMinZoom, expandedMinZoom, false],
                ['EXPANDED', expandedMinZoom, expandedMaxZoom, true],
                ['COLLAPSING', expandedMaxZoom, collapsedMinZoom, false],
                ['COLLAPSED', collapsedMinZoom, collapsedMaxZoom, true],
                ['FADING_OUT', collapsedMaxZoom, fadingOutMaxZoom, false]
            ];

            for (const [mode, startZoom, endZoom, isSolid] of segmentBounds) {
                // Skip if segment is entirely outside visible range
                if (!isFinite(startZoom) && !isFinite(endZoom)) continue;
                
                // Handle infinities: +∞ is left edge, -∞ is right edge
                let startPx: number;
                let endPx: number;
                
                if (startZoom === Infinity) {
                    startPx = padding; // +∞ zoom = left edge (fully zoomed in)
                } else if (startZoom === -Infinity) {
                    startPx = width - padding; // -∞ zoom = right edge (fully zoomed out)
                } else if (isFinite(startZoom)) {
                    startPx = padding + ((maxZoom - startZoom) / zoomRange) * scaleRange;
                } else {
                    startPx = padding; // Fallback
                }

                if (endZoom === Infinity) {
                    endPx = padding;
                } else if (endZoom === -Infinity) {
                    endPx = width - padding;
                } else if (isFinite(endZoom)) {
                    endPx = padding + ((maxZoom - endZoom) / zoomRange) * scaleRange;
                } else {
                    endPx = width - padding; // Fallback
                }

                // Skip if both converted to same position
                if (Math.abs(startPx - endPx) < 1) continue;

                // Solid texture for EXPANDED/COLLAPSED, lighter texture for FADING/COLLAPSING
                if (isSolid) {
                    ctx.fillStyle = windowFill;
                } else {
                    ctx.fillStyle = windowFill.replace('0.15', '0.08').replace('0.1', '0.05');
                }
                ctx.fillRect(Math.min(startPx, endPx), topY, Math.abs(endPx - startPx), bottomY - topY);

                // Draw border
                ctx.strokeStyle = windowStroke;
                ctx.lineWidth = isCurrent ? 2 : 1;
                ctx.strokeRect(Math.min(startPx, endPx), topY, Math.abs(endPx - startPx), bottomY - topY);
            }

            // Layer label
            ctx.fillStyle = isCurrent ? '#ffff00' : '#00ff00';
            ctx.font = 'bold 9px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(`L${layer}`, padding - 5, axisY + 3);

            // Layer state (presentation mode)
            const mode = this.getPresentationModeForLayer(layer, zoomLevel, scaleBar);
            const modeName = this.formatModeName(mode);
            ctx.fillStyle = isCurrent ? '#ffff00' : '#888888';
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            const stateX = padding + (scaleRange / 2);
            const stateY = axisY + layerHeight / 2 - 2;
            ctx.fillText(modeName, stateX, stateY);
        }

        // Draw current zoom indicator (vertical line)
        const zoomPos = padding + ((maxZoom - zoomLevel) / zoomRange) * scaleRange;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(zoomPos, padding);
        ctx.lineTo(zoomPos, height - padding);
        ctx.stroke();

        // Current zoom label
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Z:${zoomLevel.toFixed(1)}`, zoomPos, height - 3);

        // Min/Max labels at bottom
        ctx.fillStyle = '#00ff00';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${maxZoom.toFixed(1)}`, padding + 2, 10);

        ctx.textAlign = 'right';
        ctx.fillText(`${minZoom.toFixed(1)}`, width - padding - 2, 10);
    }

    /**
     * Remove widget from DOM.
     */
    destroy(): void {
        this.container.remove();
    }
}
