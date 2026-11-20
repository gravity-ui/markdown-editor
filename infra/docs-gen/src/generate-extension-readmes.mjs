import {execFileSync, spawn} from 'node:child_process';
import {existsSync, readFileSync, writeFileSync} from 'node:fs';
import {join, relative, resolve} from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {parseArgs} from 'node:util';

import {EDITOR_PACKAGE, REPO_PACKAGES} from './extension-pages/packages.mjs';
import {compareStrings} from './extension-pages/utils.mjs';
import {FRONTMATTER_FIELDS, parseExtensionReadme} from './extension-readme/format.mjs';
import {README_FILE, sourceHash} from './extension-readme/source-hash.mjs';
import {createGenerator, renderExtensionPages} from './generate-extension-pages.mjs';
import {REPO_ROOT} from './repo-root.mjs';

export const SKILL_FILE = join(REPO_ROOT, 'infra/docs-gen/skills/extension-readme/SKILL.md');
export const DEFAULT_AGENT = 'claude -p --allowedTools Read,Grep,Glob';
const DEFAULT_JOBS = 4;

const USAGE = `Usage: pnpm docs:readme [--check] [--force] [--jobs N] [Extension...]

Writes README.md for extensions that have no README or whose generated README is stale.
  --check   List missing and stale READMEs; write nothing.
  --force   Write fresh READMEs too; an edited README is written only when named.
  --jobs N  Number of agents that run at the same time (default ${DEFAULT_JOBS}).
The agent command comes from DOCS_README_AGENT (default: ${DEFAULT_AGENT}).
`;

/** Reads the command line arguments. */
export function parseCommandLine(argv) {
    const {values, positionals} = parseArgs({
        args: argv,
        allowPositionals: true,
        options: {
            check: {type: 'boolean', default: false},
            force: {type: 'boolean', default: false},
            jobs: {type: 'string', default: String(DEFAULT_JOBS)},
            help: {type: 'boolean', default: false},
        },
    });
    const jobs = Number(values.jobs);
    if (!Number.isInteger(jobs) || jobs < 1) {
        throw new Error(`--jobs must be a positive integer, found "${values.jobs}".`);
    }

    return {
        names: [...new Set(positionals)],
        check: values.check,
        force: values.force,
        jobs,
        help: values.help,
    };
}

/** Takes the import line from the `### Import` section of a page. */
function importLine(page) {
    const section = page.split(/^### Import$/m)[1]?.split(/^#{2,3} /m)[0] ?? '';
    return section.match(/^import .+;$/m)?.[0] ?? null;
}

/** Formats the frontmatter values as README lines. */
function frontmatterLines(frontmatter) {
    return FRONTMATTER_FIELDS.map((field) => `${field}: ${frontmatter[field]}`).join('\n');
}

/** Builds the agent prompt: the skill, the context block and the error of the previous answer. */
export function buildPrompt({skill, task, previousError}) {
    const parts = [
        skill.trimEnd(),
        '',
        '## Context',
        '',
        `name: ${task.name}`,
        `dir: ${task.relativeDir}`,
        `import: ${task.importLine}`,
        '',
        'page:',
        '',
        '~~~~md',
        task.page.trimEnd(),
        '~~~~',
        '',
        'frontmatter:',
        '',
        '```yaml',
        frontmatterLines(task.frontmatter),
        '```',
    ];
    if (previousError) {
        parts.push(
            '',
            '## Previous answer',
            '',
            'The previous answer failed the check. Fix these errors and print the whole README again:',
            '',
            '```text',
            previousError,
            '```',
        );
    }

    return `${parts.join('\n')}\n`;
}

/** Runs the agent command in a shell with the prompt on stdin and resolves with its stdout. */
function runAgent(command, prompt, cwd) {
    return new Promise((resolvePromise, reject) => {
        const child = spawn(command, {cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe']});
        let stdout = '';
        let stderr = '';
        child.stdout.setEncoding('utf8').on('data', (chunk) => {
            stdout += chunk;
        });
        child.stderr.setEncoding('utf8').on('data', (chunk) => {
            stderr += chunk;
        });
        child.on('error', reject);
        child.on('close', (code) => {
            if (code === 0) {
                resolvePromise(stdout);
            } else {
                const output = stderr.trim();
                reject(
                    new Error(`The agent exited with code ${code}.${output ? `\n${output}` : ''}`),
                );
            }
        });
        child.stdin.on('error', () => {});
        child.stdin.end(prompt);
    });
}

/** Parses an agent answer and compares its frontmatter with the expected values. */
export function checkAnswer(answer, frontmatter) {
    const readme = parseExtensionReadme(answer);
    const mismatches = FRONTMATTER_FIELDS.filter(
        (field) => readme.frontmatter[field] !== frontmatter[field],
    ).map(
        (field) =>
            `  frontmatter: \`${field}\` must be "${frontmatter[field]}", found "${readme.frontmatter[field]}".`,
    );
    if (mismatches.length) {
        throw new Error(['Invalid extension README:', ...mismatches].join('\n'));
    }

    return readme;
}

/** Asks the agent for a README; a failed check gets one more attempt with the error in the prompt. */
async function generateReadme({task, skill, agent, cwd}) {
    let previousError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const answer = await runAgent(agent, buildPrompt({skill, task, previousError}), cwd);
            const text = `${answer.trim()}\n`;
            checkAnswer(text, task.frontmatter);
            return text;
        } catch (error) {
            previousError = error.message;
        }
    }

    throw new Error(previousError);
}

/** Runs async jobs with at most `limit` of them at the same time. */
async function runLimited(items, limit, run) {
    const queue = [...items];
    const workers = Array.from({length: Math.min(limit, queue.length)}, async () => {
        while (queue.length) await run(queue.shift());
    });
    await Promise.all(workers);
}

/** Reads the state of the README of one extension: `missing`, `invalid`, `fresh`, `stale` or `edited`. */
function readmeState(readmePath, hash) {
    if (!existsSync(readmePath)) return {state: 'missing'};

    let readme;
    try {
        readme = parseExtensionReadme(readFileSync(readmePath, 'utf8'));
    } catch (error) {
        return {state: 'invalid', error: error.message};
    }
    if (readme.frontmatter.generated === 'edited') return {state: 'edited'};

    return {state: readme.frontmatter['source-hash'] === hash ? 'fresh' : 'stale'};
}

/** Decides whether a README is written for a state. */
function shouldWrite(state, {force, named}) {
    if (state === 'missing' || state === 'stale') return true;
    if (state === 'edited') return force && named;

    return force;
}

/** Sorts an extension into `result` by its README state; returns the task when the README is written. */
function readmeTask(extension, {pages, root, force, names, result}) {
    const {name, dir} = extension;
    if (!dir) {
        result.errors.push({name, message: 'The extension has no own directory.'});
        return null;
    }
    const hash = sourceHash(dir);
    const readmePath = join(dir, README_FILE);
    const {state, error} = readmeState(readmePath, hash);
    if (state === 'missing' || state === 'stale') result[state].push(name);

    if (!shouldWrite(state, {force, named: names.includes(name)})) {
        if (state === 'invalid') result.errors.push({name, message: error});
        else result[state].push(name);
        return null;
    }

    const page = pages.get(name);
    return {
        name,
        readmePath,
        relativeDir: relative(root, dir),
        page,
        importLine: importLine(page),
        hash,
    };
}

/**
 * Selects extensions whose README is missing or stale and writes a README checked by `parseExtensionReadme` for each of them.
 * Returns the extension names grouped by result.
 */
export async function generateExtensionReadmes({
    packages = REPO_PACKAGES,
    root = REPO_ROOT,
    names = [],
    force = false,
    check = false,
    jobs = DEFAULT_JOBS,
    agent = DEFAULT_AGENT,
    skill,
    frontmatter: getFrontmatter,
    log = () => {},
}) {
    const generator = createGenerator(packages);
    const pages = renderExtensionPages(generator);
    const byName = new Map(generator.extensions.map((extension) => [extension.name, extension]));

    const unknown = names.filter((name) => !byName.has(name));
    if (unknown.length) throw new Error(`Unknown extensions: ${unknown.join(', ')}.`);

    const result = {missing: [], stale: [], written: [], fresh: [], edited: [], errors: []};
    const selected = names.length ? names.map((name) => byName.get(name)) : [...byName.values()];
    const tasks = selected
        .map((extension) => readmeTask(extension, {pages, root, force, names, result}))
        .filter(Boolean);

    if (check) return result;

    const common = tasks.length ? getFrontmatter() : null;
    await runLimited(tasks, jobs, async (task) => {
        const frontmatter = {generated: 'ai', ...common, 'source-hash': task.hash};
        log(`${task.name}: generating\n`);
        try {
            const text = await generateReadme({
                task: {...task, frontmatter},
                skill,
                agent,
                cwd: root,
            });
            writeFileSync(task.readmePath, text);
            result.written.push(task.name);
            log(`${task.name}: written ${relative(root, task.readmePath)}\n`);
        } catch (error) {
            result.errors.push({name: task.name, message: error.message});
            log(`${task.name}: failed\n`);
        }
    });

    for (const list of Object.values(result)) {
        list.sort((a, b) => compareStrings(a.name ?? a, b.name ?? b));
    }

    return result;
}

/** Formats a list of names for the summary. */
function namesLine(label, list) {
    return `${label}: ${list.length}${list.length ? ` (${list.join(', ')})` : ''}`;
}

/** Formats the result as summary lines. */
export function formatSummary(result, {check}) {
    const lines = check
        ? [namesLine('Missing', result.missing), namesLine('Stale', result.stale)]
        : [
              namesLine('Written', result.written),
              namesLine('Fresh', result.fresh),
              namesLine('Edited', result.edited),
          ];
    lines.push(
        namesLine(
            'Errors',
            result.errors.map(({name}) => name),
        ),
    );
    for (const {name, message} of result.errors) lines.push('', `${name}:`, message);

    return `${lines.join('\n')}\n`;
}

/** Computes the frontmatter fields shared by every README of one run. */
function repoFrontmatter(root) {
    const {version} = JSON.parse(
        readFileSync(join(root, EDITOR_PACKAGE.dir, 'package.json'), 'utf8'),
    );
    const commit = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], {
        cwd: root,
        encoding: 'utf8',
    }).trim();

    return {editor: version, commit, date: new Date().toISOString().slice(0, 10)};
}

/** Runs the command and returns the exit code. */
export async function main(argv, options = {}) {
    const {stdout = process.stdout, stderr = process.stderr, env = process.env, ...rest} = options;
    let args;
    try {
        args = parseCommandLine(argv);
    } catch (error) {
        stderr.write(`${error.message}\n\n${USAGE}`);
        return 1;
    }
    if (args.help) {
        stdout.write(USAGE);
        return 0;
    }

    const root = rest.root ?? REPO_ROOT;
    let result;
    try {
        result = await generateExtensionReadmes({
            skill: readFileSync(SKILL_FILE, 'utf8'),
            agent: env.DOCS_README_AGENT || DEFAULT_AGENT,
            frontmatter: () => repoFrontmatter(root),
            log: (line) => stderr.write(line),
            ...rest,
            ...args,
            root,
        });
    } catch (error) {
        stderr.write(`${error.message}\n`);
        return 1;
    }

    stdout.write(formatSummary(result, args));
    return !args.check && result.errors.length ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    process.exitCode = await main(process.argv.slice(2));
}
