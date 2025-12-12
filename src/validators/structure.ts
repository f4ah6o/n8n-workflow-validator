/**
 * Structure Validator
 *
 * Validates the basic structure of an n8n workflow JSON
 */

import { WorkflowSchema, type ValidationError, type ValidationResult } from '../types.js';

/**
 * Validate workflow structure using Zod schema
 */
export function validateStructure(data: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Parse with Zod
    const result = WorkflowSchema.safeParse(data);

    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push({
                path: issue.path.join('.') || 'root',
                message: issue.message,
                type: 'error',
            });
        }
        return { valid: false, errors, warnings };
    }

    const workflow = result.data;

    // Additional structural checks
    if (workflow.nodes.length === 0) {
        warnings.push({
            path: 'nodes',
            message: 'Workflow has no nodes',
            type: 'warning',
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
