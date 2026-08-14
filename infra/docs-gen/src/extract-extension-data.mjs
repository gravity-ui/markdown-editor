#!/usr/bin/env node
import {fileURLToPath} from 'node:url';

import {DOCS_GEN_DIR} from './extractor/config.mjs';
import {extractExtensionData} from './extractor/index.mjs';
import {writeExtensionsJson} from './extractor/output.mjs';

export function main() {
    writeExtensionsJson(DOCS_GEN_DIR, extractExtensionData());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    main();
}
