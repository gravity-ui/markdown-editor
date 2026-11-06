import {execFile} from 'node:child_process';
import {mkdir, mkdtemp, readFile, rename, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {promisify} from 'node:util';

import sharp from 'sharp';
import {afterEach, beforeEach, expect, it} from 'vitest';

import {generateReport} from './report.mjs';

const exec = promisify(execFile);
const snapshots = 'demo/tests/visual-tests/__snapshots__/Example.visual.test.tsx-snapshots';
let cwd;
let outputDir;
let base;

const git = async (...args) => (await exec('git', args, {cwd})).stdout.trim();
const commit = async (message) => {
    await git('add', '.');
    await git('commit', '-m', message);
    return git('rev-parse', 'HEAD');
};
const writeImage = async (path, background = 'white') => {
    await mkdir(dirname(join(cwd, path)), {recursive: true});
    await sharp({create: {width: 4, height: 3, channels: 4, background}})
        .webp({lossless: true})
        .toFile(join(cwd, path));
};

beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'snapshot-diff-test-'));
    outputDir = join(cwd, 'report');
    await git('init');
    await git('config', 'user.name', 'Snapshot test');
    await git('config', 'user.email', 'snapshot-test@example.com');
    await git('config', 'commit.gpgsign', 'false');
    await writeImage(`${snapshots}/modified.webp`);
    await writeImage(`${snapshots}/removed.webp`);
    await writeImage(`${snapshots}/renamed.webp`);
    base = await commit('Initial snapshots');
});

afterEach(async () => {
    await rm(cwd, {recursive: true, force: true});
});

it('should generate diff, before, and after views for modified, added, removed, and renamed screenshots', async () => {
    await writeImage(`${snapshots}/modified.webp`, 'black');
    await writeImage(`${snapshots}/added.webp`, 'blue');
    await rm(join(cwd, snapshots, 'removed.webp'));
    await rename(
        join(cwd, snapshots, 'renamed.webp'),
        join(cwd, snapshots, 'renamed with spaces.webp'),
    );
    await writeFile(join(cwd, 'unrelated.txt'), 'not a screenshot');
    const head = await commit('Update snapshots');

    const entries = await generateReport({cwd: join(cwd, 'demo'), base, head, outputDir});
    expect(entries).toHaveLength(4);
    const modified = entries.findIndex((entry) => entry.path.endsWith('/modified.webp'));
    expect(entries[modified].changedPixels).toBe(12);
    const html = await readFile(join(outputDir, 'index.html'), 'utf8');
    expect(html).toContain(`id="${modified}-diff" value="diff" checked`);
    expect(html).toContain('Added screenshot');
    expect(html).toContain('Removed screenshot');
    expect(html).toContain('Renamed from');
    expect(html).not.toContain('unrelated.txt');
    expect(await readFile(join(outputDir, `${modified}-diff.png`))).toEqual(
        entries[modified].images.diff,
    );
});

it('should compare with the merge base instead of unrelated target branch changes', async () => {
    await git('checkout', '-b', 'target');
    await writeImage(`${snapshots}/modified.webp`, 'blue');
    const target = await commit('Target branch change');
    await git('checkout', '-b', 'feature', base);
    await writeImage(`${snapshots}/modified.webp`, 'black');
    const head = await commit('Feature change');

    const entries = await generateReport({cwd, base: target, head, outputDir});
    const data = await sharp(entries[0].images.before).raw().toBuffer();
    expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
});

it('should escape screenshot names in HTML', async () => {
    await writeImage(`${snapshots}/<img src=x onerror=alert(1)>.webp`);
    const head = await commit('Add screenshot with HTML in its name');
    await generateReport({cwd, base, head, outputDir});
    const html = await readFile(join(outputDir, 'index.html'), 'utf8');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;.webp');
    expect(html).not.toContain('<img src=x');
});

it('should generate an empty report when screenshot baselines are unchanged', async () => {
    await generateReport({cwd, base, head: base, outputDir});
    expect(await readFile(join(outputDir, 'index.html'), 'utf8')).toContain(
        'No screenshot baselines changed.',
    );
});
