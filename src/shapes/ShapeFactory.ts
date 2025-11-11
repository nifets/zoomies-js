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
     * For circles: use `diameter` or `size` for diameter, or `radius` for explicit radius.
     * For rectangles: use `width` and `height` (independent), or `size` as uniform dimension.
     * 
     * @param type - Shape type identifier (e.g., 'circle', 'rectangle')
     * @param attributes - Raw shape attributes (can include diameter, size, radius, width, height, etc.)
     * @param sceneScale - Multiplier to convert relative sizes to scene coordinates
     */
    static createShape(
        type: string,
        attributes: Record<string, any>,
        sceneScale: number = 1
    ): Shape {
        if (type === 'rectangle') {
            // For rectangles: prefer explicit width/height, fall back to size for square
            // `size` is treated as a bounding box dimension (like diameter for circles)
            const defaultSize = attributes.size ?? 1;
            const width = (attributes.width ?? defaultSize) * sceneScale;
            const height = (attributes.height ?? defaultSize) * sceneScale;
            const cornerRadius = (attributes.cornerRadius ?? 0) * sceneScale;
            return new RectangleShape(width, height, cornerRadius);
        }
        
        // Default to circle
        // `diameter`/`size` is the bounding box diameter, `radius` is explicit radius
        let radius: number;
        if (attributes.radius !== undefined) {
            radius = attributes.radius;
        } else {
            const diameter = attributes.diameter ?? attributes.size ?? 1; // Default diameter is 1.0
            radius = diameter / 2;
        }
        return new CircleShape(Math.max(0.1, radius * sceneScale));
    }
}
