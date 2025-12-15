/**
 * Tests for validating workflows fetched from n8n Template API
 *
 * This test fetches random workflows from the official n8n templates API
 * and validates them to ensure the validator handles real-world workflows correctly.
 *
 * Failed workflows are saved to test-artifacts/ for later analysis.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateWorkflow } from '../src/index.js';
import { fetchRandomWorkflows, type FetchedWorkflow } from './utils/templateApiClient.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

/** Number of random workflows to test */
const WORKFLOW_COUNT = 5;

/** Timeout for API tests (30 seconds) */
const API_TIMEOUT = 30000;

/** Directory to save failed workflow artifacts */
const ARTIFACTS_DIR = path.join(process.cwd(), 'test-artifacts');

/** Validation result with full details */
interface ValidationResult {
    id: number;
    name: string;
    valid: boolean;
    errors: Array<{ path: string; message: string }>;
    warnings: Array<{ path: string; message: string }>;
    timestamp: string;
}

describe('n8n Template API Workflows', () => {
    let fetchedWorkflows: FetchedWorkflow[] = [];
    let fetchError: Error | null = null;
    let failedWorkflows: Array<{ workflow: FetchedWorkflow; result: ValidationResult }> = [];

    beforeAll(async () => {
        // テストアーティファクトディレクトリを作成
        if (!fs.existsSync(ARTIFACTS_DIR)) {
            fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
        }

        try {
            console.log(`\n🔄 Fetching ${WORKFLOW_COUNT} random workflows from n8n templates API...`);
            fetchedWorkflows = await fetchRandomWorkflows(WORKFLOW_COUNT);
            console.log(`✅ Fetched ${fetchedWorkflows.length} workflows:`);
            fetchedWorkflows.forEach((w) => {
                console.log(`   - [${w.id}] ${w.name}`);
            });
        } catch (error) {
            fetchError = error as Error;
            console.error('❌ Failed to fetch workflows:', error);
        }
    }, API_TIMEOUT);

    afterAll(() => {
        // 失敗したワークフローをJSONファイルとして保存
        if (failedWorkflows.length > 0) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

            // サマリーファイルを保存
            const summaryPath = path.join(ARTIFACTS_DIR, `validation-failures-${timestamp}.json`);
            const summary = {
                timestamp: new Date().toISOString(),
                totalTested: fetchedWorkflows.length,
                failedCount: failedWorkflows.length,
                failures: failedWorkflows.map(({ workflow, result }) => ({
                    id: workflow.id,
                    name: workflow.name,
                    errors: result.errors,
                    warnings: result.warnings,
                })),
            };
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
            console.log(`\n📁 Validation summary saved to: ${summaryPath}`);

            // 各失敗ワークフローを個別に保存
            failedWorkflows.forEach(({ workflow, result }) => {
                const workflowPath = path.join(
                    ARTIFACTS_DIR,
                    `failed-workflow-${workflow.id}-${timestamp}.json`
                );
                const artifactData = {
                    meta: {
                        id: workflow.id,
                        name: workflow.name,
                        fetchedAt: new Date().toISOString(),
                        validationErrors: result.errors,
                        validationWarnings: result.warnings,
                    },
                    workflow: workflow.workflow,
                };
                fs.writeFileSync(workflowPath, JSON.stringify(artifactData, null, 2));
                console.log(`📁 Failed workflow saved: ${workflowPath}`);
            });
        }
    });

    it('should successfully fetch workflows from API', () => {
        if (fetchError) {
            console.warn('Skipping test due to API error:', fetchError.message);
            return;
        }

        expect(fetchedWorkflows.length).toBeGreaterThan(0);
    });

    it('should validate fetched workflows', async () => {
        if (fetchError) {
            console.warn('Skipping test due to API error:', fetchError.message);
            return;
        }

        if (fetchedWorkflows.length === 0) {
            console.warn('No workflows fetched, skipping validation');
            return;
        }

        const results: ValidationResult[] = [];

        for (const fetchedWorkflow of fetchedWorkflows) {
            const { id, name, workflow } = fetchedWorkflow;
            const result = validateWorkflow(workflow);

            const validationResult: ValidationResult = {
                id,
                name,
                valid: result.valid,
                errors: result.errors.map((e) => ({ path: e.path || '', message: e.message })),
                warnings: result.warnings.map((w) => ({ path: w.path || '', message: w.message })),
                timestamp: new Date().toISOString(),
            };

            results.push(validationResult);

            if (!result.valid) {
                console.error(`\n❌ Workflow [${id}] "${name}" validation failed:`);
                result.errors.forEach((e) => console.error(`   Error: ${e.message}`));

                // 失敗したワークフローを記録
                failedWorkflows.push({ workflow: fetchedWorkflow, result: validationResult });
            }
        }

        console.log('\n📊 Validation Results:');
        results.forEach((r) => {
            const status = r.valid ? '✅' : '❌';
            console.log(
                `   ${status} [${r.id}] ${r.name} - Errors: ${r.errors.length}, Warnings: ${r.warnings.length}`
            );
        });

        // 少なくとも半分以上のワークフローが valid であることを確認
        // (一部の公式テンプレートは厳密なスキーマに合致しない場合がある)
        const validCount = results.filter((r) => r.valid).length;
        const validRatio = validCount / results.length;
        console.log(
            `\n✅ Valid workflows: ${validCount}/${results.length} (${Math.round(validRatio * 100)}%)`
        );

        // CI/CDでの識別のため、失敗があれば警告を出力
        if (failedWorkflows.length > 0) {
            console.warn(`\n⚠️  ${failedWorkflows.length} workflow(s) failed validation.`);
            console.warn(`   Check test-artifacts/ for details.`);
        }

        expect(validRatio).toBeGreaterThanOrEqual(0.5);
    });

    it('should handle workflow nodes and connections correctly', async () => {
        if (fetchError || fetchedWorkflows.length === 0) {
            return;
        }

        for (const { id, name, workflow } of fetchedWorkflows) {
            expect(Array.isArray(workflow.nodes)).toBe(true);
            expect(typeof workflow.connections).toBe('object');

            console.log(
                `   [${id}] ${name}: ${workflow.nodes.length} nodes, ${Object.keys(workflow.connections).length} connection sources`
            );
        }
    });
});
