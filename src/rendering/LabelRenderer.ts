import { CONFIG } from '../config';
import type { DetailState } from '../managers/LayerDetailManager';
import type { Entity } from '../core/Entity';
import type { Connection } from '../core/Connection';

/**
 * Transform data for positioning and styling a label.
 * COORDINATE SYSTEM: WORLD SPACE (positions and sizes before PixiJS container transform)
 */
export interface LabelTransform {
    worldX: number;       // Label X in world coordinates
    worldY: number;       // Label Y in world coordinates
    fontSize: number;     // Font size in pixels (independent of camera)
    rotation?: number;    // Optional rotation for edge labels
}

/**
 * Static utility class for calculating label transforms.
 * Computes label positions and font sizes in world space.
 * PixiJS container handles world → screen transform automatically.
 */
export class LabelRenderer {
    /**
     * Calculate label transform for a node entity.
     * @param entity - The entity to label
     * @param detailState - Optional detail state for positioning hints
     */
    static getNodeLabelTransform(
        entity: Entity,
        detailState?: DetailState
    ): LabelTransform {
        // Font size: base size / cumulative scale
        const fontSize = CONFIG.LABEL_FONT_SIZE / entity.getCumulativeScale();
        
        // Label position: inside or outside based on detail state
        const labelOffset = 20;
        let worldY = entity.y;
        if (!detailState?.labelInside) {
            // Position label outside (above) the entity
            worldY = entity.y - entity.getWorldSize() / 2 - labelOffset;
        }
        
        return {
            worldX: entity.x,
            worldY: worldY,
            fontSize: fontSize
        };
    }

    /**
     * Calculate label transform for an edge connection.
     * @param connection - The connection to label
     */
    static getEdgeLabelTransform(
        connection: Connection
    ): LabelTransform | null {
        if (connection.sources.length === 0 || connection.targets.length === 0) {
            return null;
        }

        // Calculate midpoint between first source and first target
        const source = connection.sources[0];
        const target = connection.targets[0];
        
        const worldX = (source.x + target.x) / 2;
        const worldY = (source.y + target.y) / 2;
        
        // Calculate rotation to align with edge
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        let rotation = Math.atan2(dy, dx);
        
        // Flip label if upside down (keep text readable)
        if (rotation > Math.PI / 2 || rotation < -Math.PI / 2) {
            rotation += Math.PI;
        }
        
        // Font size: base size / cumulative scale (use source layer scale)
        const fontSize = CONFIG.LABEL_FONT_SIZE / source.getCumulativeScale();
        
        return {
            worldX,
            worldY,
            fontSize,
            rotation
        };
    }
}
