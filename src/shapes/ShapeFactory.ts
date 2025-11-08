import { Shape } from './Shape';
import { CircleShape } from './CircleShape';
import { RectangleShape } from './RectangleShape';

/**
 * Factory for creating Shape instances from type strings.
 * Centralises shape instantiation logic; add new shapes here only.
 */
export class ShapeFactory {
    /**
     * Create a shape from a type string and parameters.
     * Defaults to CircleShape if type is unknown.
     */
    static createShape(
        type: string,
        radius: number,
        width?: number,
        height?: number,
        cornerRadius?: number
    ): Shape {
        if (type === 'rectangle') {
            return new RectangleShape(width ?? radius * 2, height ?? radius * 2, cornerRadius ?? 0);
        }
        // Default to circle for unknown types
        return new CircleShape(Math.max(3, radius));
    }
}
