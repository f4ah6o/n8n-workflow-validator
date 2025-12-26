#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distCliPath = resolve(__dirname, '../dist/cli.js');

if (!existsSync(distCliPath)) {
    const buildResult = spawnSync('npm', ['run', 'build'], {
        cwd: resolve(__dirname, '..'),
        stdio: 'inherit',
    });

    if (buildResult.status !== 0) {
        process.exit(buildResult.status ?? 1);
    }
}

if (!existsSync(distCliPath)) {
    console.error('n8n-workflow-validator: build did not produce dist/cli.js');
    process.exit(1);
}

await import(pathToFileURL(distCliPath).href);
