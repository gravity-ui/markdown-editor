import {mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

export function writeExtensionsJson(outDir, extensions) {
    mkdirSync(outDir, {recursive: true});
    writeFileSync(join(outDir, 'extensions.json'), `${JSON.stringify({extensions}, null, 2)}\n`);
}
