/**
 * n8n Workflow Validator CLI
 *
 * Command-line interface for validating n8n workflow JSON files
 */

import { program } from 'commander';
import { validateWorkflowFile } from './index.js';
import { readFile } from 'fs/promises';

interface CliOptions {
    quiet: boolean;
    strict: boolean;
    json: boolean;
}

async function main(): Promise<void> {
    // Read package.json for version
    let version = '0.1.0';
    try {
        const pkg = JSON.parse(
            await readFile(new URL('../package.json', import.meta.url), 'utf8')
        );
        version = pkg.version;
    } catch {
        // Ignore - use default version
    }

    program
        .name('n8n-validate')
        .description('Validate n8n workflow JSON files')
        .version(version)
        .argument('<files...>', 'Workflow JSON file(s) to validate')
        .option('-q, --quiet', 'Only output on errors', false)
        .option('-s, --strict', 'Treat warnings as errors', false)
        .option('-j, --json', 'Output results as JSON', false)
        .action(async (files: string[], options: CliOptions) => {
            let hasErrors = false;
            const results: Array<{
                file: string;
                valid: boolean;
                errors: unknown[];
                warnings: unknown[];
            }> = [];

            for (const file of files) {
                const result = await validateWorkflowFile(file);

                // In strict mode, warnings are treated as errors
                const effectiveValid = options.strict
                    ? result.valid && result.warnings.length === 0
                    : result.valid;

                results.push({
                    file,
                    valid: effectiveValid,
                    errors: result.errors,
                    warnings: result.warnings,
                });

                if (!effectiveValid) {
                    hasErrors = true;
                }

                if (!options.json) {
                    if (effectiveValid) {
                        if (!options.quiet) {
                            console.log(`✅ ${file}: Valid`);
                            if (result.warnings.length > 0) {
                                result.warnings.forEach((w) => {
                                    console.log(`   ⚠️  [${w.path}] ${w.message}`);
                                });
                            }
                        }
                    } else {
                        console.log(`❌ ${file}: Invalid`);
                        result.errors.forEach((e) => {
                            console.log(`   ❌ [${e.path}] ${e.message}`);
                        });
                        if (options.strict) {
                            result.warnings.forEach((w) => {
                                console.log(`   ⚠️  [${w.path}] ${w.message}`);
                            });
                        }
                    }
                }
            }

            if (options.json) {
                console.log(JSON.stringify(results, null, 2));
            } else if (!options.quiet) {
                console.log('');
                const validCount = results.filter((r) => r.valid).length;
                const invalidCount = results.length - validCount;
                console.log(
                    `Summary: ${validCount} valid, ${invalidCount} invalid out of ${results.length} file(s)`
                );
            }

            process.exit(hasErrors ? 1 : 0);
        });

    await program.parseAsync(process.argv);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
