import { Entity } from '../core/Entity';

/**
 * Configuration for composite validation.
 */
export interface ValidationConfig {
    minAreaMultiplier?: number;
}

/**
 * Validates that a composite is large enough to contain its children.
 * Warns if the composite's area is too small relative to its children.
 */
export function validateCompositeSize(
    composite: Entity,
    config: ValidationConfig = {}
): boolean {
    const { minAreaMultiplier = 2.5 } = config;
    
    if (!composite.isComposite() || composite.children.length === 0) {
        return true;
    }

    // Calculate total area of all children
    let childrenTotalArea = 0;
    for (const child of composite.children) {
        childrenTotalArea += child.getWorldArea();
    }

    // Calculate composite area
    const compositeArea = composite.getWorldArea();

    // Check if composite is large enough
    if (compositeArea < childrenTotalArea * minAreaMultiplier) {
        const minRequiredArea = childrenTotalArea * minAreaMultiplier;
        console.warn(
            `[Validation] Composite "${composite.id}" may be too small for its children. ` +
            `Composite area: ${compositeArea.toFixed(0)}, ` +
            `Children total area: ${childrenTotalArea.toFixed(0)}, ` +
            `Minimum required: ${minRequiredArea.toFixed(0)}.`
        );
        return false;
    }

    return true;
}

/**
 * Recursively validates all composites in a hierarchy.
 */
export function validateCompositeHierarchy(
    entity: Entity,
    config: ValidationConfig = {}
): boolean {
    let allValid = true;

    // Validate this composite if it has children
    if (entity.isComposite()) {
        if (!validateCompositeSize(entity, config)) {
            allValid = false;
        }

        // Recursively validate nested composites
        for (const child of entity.children) {
            if (!validateCompositeHierarchy(child, config)) {
                allValid = false;
            }
        }
    }

    return allValid;
}
