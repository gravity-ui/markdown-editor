import {resolve} from 'node:path';
import process from 'node:process';

import {generateReport} from './report.mjs';

const [base, head, output] = process.argv.slice(2);
if (!base || !head || !output) {
    throw new Error(
        'Usage: pnpm --filter @markdown-editor/snapshot-diff generate <base> <head> <output-directory>',
    );
}

await generateReport({cwd: process.cwd(), base, head, outputDir: resolve(output)});
