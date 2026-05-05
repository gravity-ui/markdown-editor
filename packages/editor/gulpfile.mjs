import {readFileSync, readdirSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, extname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

import {parallel, series, task} from '@markdown-editor/gulp-tasks';
import {registerBuildTasks} from '@markdown-editor/gulp-tasks/build';

import pkg from './package.json' with {type: 'json'};

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const BUILD_DIR = resolve('build');
const NODE_MODULES_DIR = resolve(__dirname, 'node_modules');
const SOURCE_DIR = resolve('src');
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const EXTERNAL_CSS_IMPORT_RE = /^\s*import\s+(?:.+?\s+from\s+)?['"]([^./'"][^'"]*\.css)['"];?/gm;

registerBuildTasks({
    version: pkg.version,
    buildDir: BUILD_DIR,
    nodeModulesDir: NODE_MODULES_DIR,
});

task('styles-string', (done) => {
    const externalCss = collectExternalCss();
    const editorCss = readFileSync(resolve(BUILD_DIR, 'styles.css'), 'utf8');
    const styles = [externalCss, editorCss].filter(Boolean).join('\n');
    const content = toTemplateLiteral(styles);

    writeFileSync(resolve(BUILD_DIR, 'styles-string.mjs'), `export default ${content};\n`);
    writeFileSync(resolve(BUILD_DIR, 'styles-string.cjs'), `module.exports = ${content};\n`);
    writeFileSync(
        resolve(BUILD_DIR, 'styles-string.d.ts'),
        'declare const styles: string;\nexport default styles;\n',
    );
    done();
});

task('build', series(parallel('ts', 'json', 'scss'), 'styles-string'));
task('default', series('clean', 'build'));

function collectExternalCss() {
    const cssImports = new Set();

    for (const sourceFile of getSourceFiles(SOURCE_DIR)) {
        const sourceCode = readFileSync(sourceFile, 'utf8');

        for (const match of sourceCode.matchAll(EXTERNAL_CSS_IMPORT_RE)) {
            cssImports.add(match[1]);
        }
    }

    return Array.from(cssImports)
        .map((cssImport) => readFileSync(require.resolve(cssImport), 'utf8'))
        .join('\n');
}

function getSourceFiles(dir) {
    return readdirSync(dir, {withFileTypes: true})
        .sort((left, right) => left.name.localeCompare(right.name))
        .flatMap((entry) => {
            const entryPath = resolve(dir, entry.name);

            if (entry.isDirectory()) {
                return getSourceFiles(entryPath);
            }

            return SOURCE_EXTENSIONS.has(extname(entry.name)) ? [entryPath] : [];
        });
}

function toTemplateLiteral(value) {
    return `\`${value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\``;
}
