/**
 * n8n Workflow Validator
 *
 * Main entry point for programmatic usage
 */

import { readFile } from 'fs/promises';
import { type ValidationResult, WorkflowSchema } from './types.js';
import {
    validateStructure,
    validateNodes,
    checkNodeWarnings,
    validateConnections,
    checkConnectionWarnings,
} from './validators/index.js';

export { ValidationResult, ValidationError } from './types.js';
export { WorkflowSchema, NodeSchema, NodesSchema, ConnectionsSchema } from './types.js';

/**
 * Validate workflow data (already parsed JSON)
 */
export function validateWorkflow(data: unknown): ValidationResult {
    // Step 1: Validate structure with Zod
    const structureResult = validateStructure(data);
    if (!structureResult.valid) {
        return structureResult;
    }

    // At this point, data is confirmed to be a valid Workflow
    const workflow = WorkflowSchema.parse(data);

    const errors = [...structureResult.errors];
    const warnings = [...structureResult.warnings];

    // Step 2: Validate nodes
    const nodeErrors = validateNodes(workflow.nodes);
    errors.push(...nodeErrors);

    const nodeWarnings = checkNodeWarnings(workflow.nodes);
    warnings.push(...nodeWarnings);

    // Step 3: Validate connections
    const connectionErrors = validateConnections(workflow.connections, workflow.nodes);
    errors.push(...connectionErrors);

    const connectionWarnings = checkConnectionWarnings(workflow.connections, workflow.nodes);
    warnings.push(...connectionWarnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate workflow from JSON string
 */
export function validateWorkflowJson(json: string): ValidationResult {
    let data: unknown;

    try {
        data = JSON.parse(json);
    } catch (e) {
        const error = e as Error;
        return {
            valid: false,
            errors: [
                {
                    path: 'root',
                    message: `Invalid JSON: ${error.message}`,
                    type: 'error',
                },
            ],
            warnings: [],
        };
    }

    return validateWorkflow(data);
}

/**
 * Validate workflow from file path
 */
export async function validateWorkflowFile(filePath: string): Promise<ValidationResult> {
    let content: string;

    try {
        content = await readFile(filePath, 'utf8');
    } catch (e) {
        const error = e as Error;
        return {
            valid: false,
            errors: [
                {
                    path: 'file',
                    message: `Cannot read file "${filePath}": ${error.message}`,
                    type: 'error',
                },
            ],
            warnings: [],
        };
    }

    return validateWorkflowJson(content);
}
