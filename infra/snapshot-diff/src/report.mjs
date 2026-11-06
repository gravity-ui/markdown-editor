import {execFile} from 'node:child_process';
import {mkdir, writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {promisify} from 'node:util';

import {compareImages} from './compare.mjs';
import {renderReport} from './html.mjs';

const exec = promisify(execFile);
const isSnapshot = (path) => /\/__snapshots__\/.*\.(webp|png|jpe?g)$/i.test(path ?? '');

export async function generateReport({cwd, base, head, outputDir}) {
    const root = String((await exec('git', ['rev-parse', '--show-toplevel'], {cwd})).stdout).trim();
    const git = async (...args) =>
        (await exec('git', args, {cwd: root, encoding: 'buffer', maxBuffer: 64 * 1024 * 1024}))
            .stdout;
    const commit = async (ref) =>
        String(await git('rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`)).trim();
    const headCommit = await commit(head);
    const baseCommit = String(await git('merge-base', await commit(base), headCommit)).trim();
    const changes = String(
        await git(
            'diff',
            '--name-status',
            '-z',
            '--find-renames',
            baseCommit,
            headCommit,
            '--',
            'demo/tests/visual-tests',
        ),
    ).split('\0');
    const entries = [];

    for (let i = 0; i < changes.length - 1; ) {
        const status = changes[i++];
        const firstPath = changes[i++];
        const path = status.startsWith('R') ? changes[i++] : firstPath;
        const beforePath = status === 'A' || !isSnapshot(firstPath) ? null : firstPath;
        const afterPath = status === 'D' || !isSnapshot(path) ? null : path;
        if (!beforePath && !afterPath) continue;

        const [before, after] = await Promise.all([
            beforePath ? git('show', `${baseCommit}:${beforePath}`) : null,
            afterPath ? git('show', `${headCommit}:${afterPath}`) : null,
        ]);
        entries.push({
            path,
            previousPath: firstPath === path ? null : firstPath,
            ...(await compareImages(before, after)),
        });
    }

    // Added and removed screenshots have no pixel count and come first.
    const weight = (entry) => entry.changedPixels ?? Number.MAX_SAFE_INTEGER;
    entries.sort((a, b) => weight(b) - weight(a));
    const changed = entries.filter((entry) => entry.changedPixels !== 0);
    const unchanged = entries.filter((entry) => entry.changedPixels === 0);

    await mkdir(outputDir, {recursive: true});
    for (const [index, entry] of changed.entries()) {
        for (const [mode, image] of Object.entries(entry.images)) {
            await writeFile(join(outputDir, `${index}-${mode}.png`), image);
        }
    }
    await writeFile(
        join(outputDir, 'index.html'),
        renderReport({changed, unchanged, base: baseCommit, head: headCommit}),
    );
    return {changed, unchanged};
}
