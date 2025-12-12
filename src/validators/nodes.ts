/**
 * Node Validator
 *
 * Validates individual nodes within a workflow
 */

import type { Node, ValidationError } from '../types.js';

/**
 * Validate nodes have unique IDs and names
 */
export function validateNodes(nodes: Node[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodePath = `nodes[${i}].${node.name}`;

        // Check for duplicate IDs
        if (seenIds.has(node.id)) {
            errors.push({
                path: `${nodePath}.id`,
                message: `Duplicate node ID: "${node.id}"`,
                type: 'error',
            });
        }
        seenIds.add(node.id);

        // Check for duplicate names
        if (seenNames.has(node.name)) {
            errors.push({
                path: `${nodePath}.name`,
                message: `Duplicate node name: "${node.name}"`,
                type: 'error',
            });
        }
        seenNames.add(node.name);

        // Validate position is within reasonable bounds
        const [x, y] = node.position;
        if (Math.abs(x) > 100000 || Math.abs(y) > 100000) {
            errors.push({
                path: `${nodePath}.position`,
                message: `Node position [${x}, ${y}] is outside reasonable bounds`,
                type: 'error',
            });
        }

        // Validate type version is positive
        if (node.typeVersion < 1) {
            errors.push({
                path: `${nodePath}.typeVersion`,
                message: `Invalid type version: ${node.typeVersion} (must be >= 1)`,
                type: 'error',
            });
        }
    }

    return errors;
}

/**
 * Check for potential issues (warnings)
 */
export function checkNodeWarnings(nodes: Node[]): ValidationError[] {
    const warnings: ValidationError[] = [];

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nodePath = `nodes[${i}].${node.name}`;

        // Warn about disabled nodes
        if (node.disabled) {
            warnings.push({
                path: nodePath,
                message: `Node "${node.name}" is disabled`,
                type: 'warning',
            });
        }

        // Warn about empty parameters
        if (Object.keys(node.parameters).length === 0) {
            warnings.push({
                path: `${nodePath}.parameters`,
                message: `Node "${node.name}" has no parameters configured`,
                type: 'warning',
            });
        }
    }

    return warnings;
}
