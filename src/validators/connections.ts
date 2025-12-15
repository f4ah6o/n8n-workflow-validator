/**
 * Connection Validator
 *
 * Validates connections between nodes
 */

import type { Connections, Node, ValidationError } from '../types.js';

/**
 * Validate connections reference existing nodes
 */
export function validateConnections(
    connections: Connections,
    nodes: Node[]
): ValidationError[] {
    const errors: ValidationError[] = [];

    // Build a set of valid node names
    const nodeNames = new Set(nodes.map((n) => n.name));

    for (const [sourceName, nodeConnections] of Object.entries(connections)) {
        // Check if source node exists
        if (!nodeNames.has(sourceName)) {
            errors.push({
                path: `connections.${sourceName}`,
                message: `Connection source node "${sourceName}" does not exist in nodes`,
                type: 'error',
            });
            continue;
        }

        // Check each connection type (e.g., "main")
        for (const [connectionType, outputs] of Object.entries(nodeConnections)) {
            // Check each output index
            for (let outputIdx = 0; outputIdx < outputs.length; outputIdx++) {
                const connections = outputs[outputIdx];

                // Skip null connections (unconnected outputs)
                if (connections === null) {
                    continue;
                }

                // Check each connection target
                for (let connIdx = 0; connIdx < connections.length; connIdx++) {
                    const conn = connections[connIdx];
                    const connPath = `connections.${sourceName}.${connectionType}[${outputIdx}][${connIdx}]`;

                    // Check if target node exists
                    if (!nodeNames.has(conn.node)) {
                        errors.push({
                            path: connPath,
                            message: `Connection target node "${conn.node}" does not exist in nodes`,
                            type: 'error',
                        });
                    }

                    // Check connection index is non-negative
                    if (conn.index < 0) {
                        errors.push({
                            path: `${connPath}.index`,
                            message: `Invalid connection index: ${conn.index} (must be >= 0)`,
                            type: 'error',
                        });
                    }
                }
            }
        }
    }

    return errors;
}

/**
 * Check for potential connection issues (warnings)
 */
export function checkConnectionWarnings(
    connections: Connections,
    nodes: Node[]
): ValidationError[] {
    const warnings: ValidationError[] = [];

    // Build a set of connected node names
    const connectedNodes = new Set<string>();

    // Collect all source nodes
    for (const sourceName of Object.keys(connections)) {
        connectedNodes.add(sourceName);
    }

    // Collect all target nodes
    for (const nodeConnections of Object.values(connections)) {
        for (const outputs of Object.values(nodeConnections)) {
            for (const conns of outputs) {
                if (conns) {
                    for (const conn of conns) {
                        connectedNodes.add(conn.node);
                    }
                }
            }
        }
    }

    // Find unconnected nodes (except potential trigger nodes and sticky notes)
    const triggerPatterns = ['trigger', 'webhook', 'schedule', 'cron', 'start'];

    // Sticky notes are meant to exist independently, not connected to other nodes
    const standaloneNodeTypes = ['n8n-nodes-base.stickynote'];

    for (const node of nodes) {
        const isLikelyTrigger = triggerPatterns.some(
            (pattern) => node.type.toLowerCase().includes(pattern)
        );

        const isStandaloneNode = standaloneNodeTypes.includes(node.type.toLowerCase());

        if (!connectedNodes.has(node.name) && !isLikelyTrigger && !isStandaloneNode) {
            warnings.push({
                path: `nodes.${node.name}`,
                message: `Node "${node.name}" is not connected to any other node`,
                type: 'warning',
            });
        }
    }

    return warnings;
}
