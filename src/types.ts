/**
 * n8n Workflow Validator - Type Definitions
 *
 * Based on n8n-workflow package types but simplified for standalone validation
 */

import { z } from 'zod';

// Connection schema
export const ConnectionSchema = z.object({
    node: z.string(),
    type: z.string(),
    index: z.number(),
});

export type Connection = z.infer<typeof ConnectionSchema>;

// Node connections schema (output type -> array of connections per output index)
export const NodeConnectionsSchema = z.record(
    z.string(),
    z.array(z.array(ConnectionSchema).nullable())
);

export type NodeConnections = z.infer<typeof NodeConnectionsSchema>;

// All connections (source node name -> node connections)
export const ConnectionsSchema = z.record(z.string(), NodeConnectionsSchema);

export type Connections = z.infer<typeof ConnectionsSchema>;

// Node parameter value (simplified)
const NodeParameterValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined(),
]);

// Node parameters schema (recursive)
export const NodeParametersSchema: z.ZodType<Record<string, unknown>> = z.lazy(
    () => z.record(z.string(), z.unknown())
);

// Node credentials schema
export const NodeCredentialsSchema = z.record(
    z.string(),
    z.object({
        id: z.string().nullable(),
        name: z.string(),
    })
);

// Node schema
export const NodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
    typeVersion: z.number(),
    position: z.tuple([z.number(), z.number()]),
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    notesInFlow: z.boolean().optional(),
    retryOnFail: z.boolean().optional(),
    maxTries: z.number().optional(),
    waitBetweenTries: z.number().optional(),
    alwaysOutputData: z.boolean().optional(),
    executeOnce: z.boolean().optional(),
    onError: z.enum(['continueErrorOutput', 'continueRegularOutput', 'stopWorkflow']).optional(),
    continueOnFail: z.boolean().optional(),
    webhookId: z.string().optional(),
    parameters: NodeParametersSchema,
    credentials: NodeCredentialsSchema.optional(),
});

export type Node = z.infer<typeof NodeSchema>;

// Nodes array schema
export const NodesSchema = z.array(NodeSchema);

// Workflow schema (minimal for validation)
export const WorkflowSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    nodes: NodesSchema,
    connections: ConnectionsSchema,
    active: z.boolean().optional(),
    settings: z.record(z.string(), z.unknown()).optional(),
    staticData: z.record(z.string(), z.unknown()).optional(),
    pinData: z.record(z.string(), z.unknown()).optional(),
});

export type Workflow = z.infer<typeof WorkflowSchema>;

// Validation result
export interface ValidationError {
    path: string;
    message: string;
    type: 'error' | 'warning';
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationError[];
}
