/**
 * Tests for n8n Workflow Validator
 */

import { describe, it, expect } from 'vitest';
import { validateWorkflow, validateWorkflowJson } from '../src/index.js';

describe('validateWorkflow', () => {
    it('should validate a minimal valid workflow', () => {
        const workflow = {
            nodes: [
                {
                    id: 'node1',
                    name: 'Start',
                    type: 'n8n-nodes-base.manualTrigger',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
            ],
            connections: {},
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should fail on missing nodes array', () => {
        const workflow = {
            connections: {},
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('array');
    });

    it('should fail on missing connections object', () => {
        const workflow = {
            nodes: [],
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect duplicate node IDs', () => {
        const workflow = {
            nodes: [
                {
                    id: 'same-id',
                    name: 'Node1',
                    type: 'n8n-nodes-base.noOp',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
                {
                    id: 'same-id',
                    name: 'Node2',
                    type: 'n8n-nodes-base.noOp',
                    typeVersion: 1,
                    position: [100, 0],
                    parameters: {},
                },
            ],
            connections: {},
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes('Duplicate node ID'))).toBe(true);
    });

    it('should detect duplicate node names', () => {
        const workflow = {
            nodes: [
                {
                    id: 'id1',
                    name: 'Same Name',
                    type: 'n8n-nodes-base.noOp',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
                {
                    id: 'id2',
                    name: 'Same Name',
                    type: 'n8n-nodes-base.noOp',
                    typeVersion: 1,
                    position: [100, 0],
                    parameters: {},
                },
            ],
            connections: {},
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.message.includes('Duplicate node name'))).toBe(true);
    });

    it('should detect connections to non-existent nodes', () => {
        const workflow = {
            nodes: [
                {
                    id: 'node1',
                    name: 'Start',
                    type: 'n8n-nodes-base.manualTrigger',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
            ],
            connections: {
                Start: {
                    main: [
                        [
                            {
                                node: 'NonExistent',
                                type: 'main',
                                index: 0,
                            },
                        ],
                    ],
                },
            },
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.message.includes('does not exist'))
        ).toBe(true);
    });

    it('should detect connection from non-existent source node', () => {
        const workflow = {
            nodes: [
                {
                    id: 'node1',
                    name: 'End',
                    type: 'n8n-nodes-base.noOp',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
            ],
            connections: {
                NonExistent: {
                    main: [[{ node: 'End', type: 'main', index: 0 }]],
                },
            },
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) =>
                e.message.includes('source node "NonExistent" does not exist')
            )
        ).toBe(true);
    });

    it('should warn about empty workflow', () => {
        const workflow = {
            nodes: [],
            connections: {},
        };

        const result = validateWorkflow(workflow);

        expect(result.valid).toBe(true);
        expect(result.warnings.some((w) => w.message.includes('no nodes'))).toBe(true);
    });
});

describe('validateWorkflowJson', () => {
    it('should parse and validate valid JSON', () => {
        const json = JSON.stringify({
            nodes: [
                {
                    id: 'node1',
                    name: 'Start',
                    type: 'n8n-nodes-base.manualTrigger',
                    typeVersion: 1,
                    position: [0, 0],
                    parameters: {},
                },
            ],
            connections: {},
        });

        const result = validateWorkflowJson(json);

        expect(result.valid).toBe(true);
    });

    it('should fail on invalid JSON', () => {
        const result = validateWorkflowJson('{ not valid json }');

        expect(result.valid).toBe(false);
        expect(result.errors[0].message).toContain('Invalid JSON');
    });
});
