/* eslint-disable no-console, no-undef */
// Fails if a consumer that only needs `YfmStaticView` gets the editor core, prosemirror or codemirror in its bundle.
const fs = require('node:fs');
const path = require('node:path');

const esbuild = require('esbuild');

const root = path.resolve(__dirname, '..');
const forbidden = [
    /[\\/]src[\\/]core[\\/]/,
    /[\\/]build[\\/]esm[\\/]core[\\/]/,
    /prosemirror-/,
    /@codemirror[\\/]/,
];

const entries = {
    'src root': ['src/index.ts', 'src'],
    'src view': ['src/view/index.ts', 'src/view'],
    'build/esm root': ['build/esm/index.js', 'build/esm'],
    'build/esm view': ['build/esm/view/index.js', 'build/esm/view'],
};

async function main() {
    let failed = false;
    for (const [name, [file]] of Object.entries(entries)) {
        const abs = path.join(root, file);
        if (!fs.existsSync(abs)) {
            console.log(`${name}: skipped (${file} not found, run \`pnpm build\`)`);
            continue;
        }
        const result = await esbuild.build({
            stdin: {
                contents: `import {YfmStaticView} from ${JSON.stringify(abs)}; console.log(YfmStaticView);`,
                resolveDir: root,
                loader: 'js',
            },
            bundle: true,
            write: false,
            metafile: true,
            format: 'esm',
            platform: 'browser',
            logLevel: 'silent',
            external: ['fs', 'path', 'stream'],
            loader: {'.css': 'empty', '.scss': 'empty'},
        });
        // esbuild lists tree-shaken modules in `inputs`, so count only those that emit code
        const emitted = Object.values(result.metafile.outputs).flatMap((output) =>
            Object.entries(output.inputs)
                .filter(([, info]) => info.bytesInOutput > 0)
                .map(([input]) => input),
        );
        const leaked = emitted.filter((input) => forbidden.some((re) => re.test(input)));
        if (leaked.length) {
            failed = true;
            console.error(
                `${name}: YfmStaticView pulls the editor (${leaked.length} modules), e.g.:`,
            );
            leaked.slice(0, 5).forEach((input) => console.error(`  ${input}`));
        } else {
            console.log(`${name}: ok`);
        }
    }
    process.exit(failed ? 1 : 0);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
