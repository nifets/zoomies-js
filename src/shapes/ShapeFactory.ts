import { Shape } from './Shape';
import { CircleShape } from './CircleShape';
import { RectangleShape } from './RectangleShape';

/**
 * Factory for creating Shape instances from type strings and attributes.
 * Shape-specific construction logic is isolated here.
 * Entity doesn't need to know how to construct different shapes.
 */
export class ShapeFactory {
    /**
     * Create a shape from a type string and raw attributes.
     * The factory handles all shape-specific parameter extraction and defaults.
     * 
     * For circles: use `size` or `radius` for diameter/radius.
     * For rectangles: use `width` and `height` (independent), or `size` as uniform dimension.
     * 
     * @param type - Shape type identifier (e.g., 'circle', 'rectangle')
     * @param attributes - Raw shape attributes (can include size, radius, width, height, etc.)
     * @param sceneScale - Multiplier to convert relative sizes to scene coordinates
     */
    static createShape(
        type: string,
        attributes: Record<string, any>,
        sceneScale: number = 1
    ): Shape {
        if (type === 'rectangle') {
            // For rectangles: prefer explicit width/height, fall back to size for square
            const defaultSize = attributes.size ?? 50;
            const width = (attributes.width ?? defaultSize) * sceneScale;
            const height = (attributes.height ?? defaultSize) * sceneScale;
            const cornerRadius = attributes.cornerRadius ?? 0;
            return new RectangleShape(width, height, cornerRadius);
        }
        
        // Default to circle
        const radius = (attributes.size ?? attributes.radius ?? 25) * sceneScale;
        return new CircleShape(Math.max(3, radius));
    }
}
