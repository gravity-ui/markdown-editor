/* eslint-disable no-console, import/no-extraneous-dependencies, no-undef */
const fs = require('fs');
const path = require('path');
const process = require('process');

const ALIASES = {
    r: 'rewrite',
};
const TEMPLATE_DIR = 'tests/playwright/templates';
const DEFAULT_OUTPUT_DIR = 'tests/visual-tests/playground';
const templatePath = path.join(TEMPLATE_DIR, 'Extension.template.tsx');

if (!fs.existsSync(templatePath)) {
    console.error(`❌ Template file not found at ${templatePath}`);
    process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf-8');

/**
 * CLI arguments: <TestName> [--out <outputDir>] [--rewrite|-r]
 */
const args = parseAnyArgs(process.argv.slice(2), ALIASES);
const name = args._[0];
const outputDir = args.out || args['out'] || DEFAULT_OUTPUT_DIR;
const shouldRewrite = Boolean(args.rewrite || args.r);

if (!name) {
    console.error(
        '❌ Please specify a test name. Usage: pnpm run playwright:generate <TestName> [--out <outputDir>] [--rewrite|-r]',
    );
    process.exit(1);
}

const outputDirPath = path.join(process.cwd(), outputDir);
if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, {recursive: true});
}

// Remove the underscores to enable the test (e.g., `name.visual.test.tsx`).
const fileName = `${name}._visual_.test.tsx`;
const filePath = path.join(outputDirPath, fileName);
const content = template.replace(/%%name%%/g, name);

if (fs.existsSync(filePath) && !shouldRewrite) {
    console.error(`❌ File ${fileName} already exists. Use --rewrite to overwrite.`);
    process.exit(1);
}

fs.writeFileSync(filePath, content);
console.log(`✅ Successfully created file ${fileName}`);
process.exit(0);

/**
 * Parses CLI arguments into an options object.
 */
function parseAnyArgs(args, aliases = {}) {
    const result = {_: []};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--') && arg.includes('=')) {
            const [key, value] = arg.slice(2).split('=');
            result[key] = value;
        } else if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const next = args[i + 1];
            if (next && !next.startsWith('-')) {
                result[key] = next;
                i++;
            } else {
                result[key] = true;
            }
        } else if (arg.startsWith('-') && arg.length > 1) {
            const flags = arg.slice(1);
            if (flags.length > 1) {
                for (const c of flags) {
                    const key = aliases[c] || c;
                    result[key] = true;
                }
            } else {
                const c = flags;
                const key = aliases[c] || c;
                const next = args[i + 1];
                if (next && !next.startsWith('-')) {
                    result[key] = next;
                    i++;
                } else {
                    result[key] = true;
                }
            }
        } else {
            result._.push(arg);
        }
    }
    return result;
}
