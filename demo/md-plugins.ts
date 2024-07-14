/* eslint-disable import/no-extraneous-dependencies */
import {transform as yfmHtmlBlock} from '@diplodoc/html-extension';
import {transform as latex} from '@diplodoc/latex-extension';
import {transform as mermaid} from '@diplodoc/mermaid-extension';
import anchors from '@diplodoc/transform/lib/plugins/anchors';
import checkbox from '@diplodoc/transform/lib/plugins/checkbox';
import code from '@diplodoc/transform/lib/plugins/code';
import cut from '@diplodoc/transform/lib/plugins/cut';
import deflist from '@diplodoc/transform/lib/plugins/deflist';
import file from '@diplodoc/transform/lib/plugins/file';
import imsize from '@diplodoc/transform/lib/plugins/imsize';
import meta from '@diplodoc/transform/lib/plugins/meta';
import monospace from '@diplodoc/transform/lib/plugins/monospace';
import notes from '@diplodoc/transform/lib/plugins/notes';
import sup from '@diplodoc/transform/lib/plugins/sup';
import yfmTable from '@diplodoc/transform/lib/plugins/table';
import tabs from '@diplodoc/transform/lib/plugins/tabs';
import video from '@diplodoc/transform/lib/plugins/video';
import type {PluginWithParams} from 'markdown-it/lib';

import {emojiDefs} from '../src/bundle/emoji';
import color from '../src/markdown-it/color';
import {bare as emoji} from '../src/markdown-it/emoji';
import ins from '../src/markdown-it/ins';
import mark from '../src/markdown-it/mark';
import sub from '../src/markdown-it/sub';

export const LATEX_RUNTIME = 'extension:latex';
export const MERMAID_RUNTIME = 'extension:mermaid';

const defaultPlugins: PluginWithParams[] = [
    anchors,
    code,
    cut,
    deflist,
    file,
    imsize,
    meta,
    monospace,
    notes,
    sup,
    tabs,
    video,
    yfmTable,
];
const extendedPlugins = defaultPlugins.concat(
    (md) => md.use(emoji, {defs: emojiDefs}),
    checkbox,
    color,
    ins,
    latex({bundle: false, validate: false, runtime: LATEX_RUNTIME}),
    mark,
    mermaid({bundle: false, runtime: MERMAID_RUNTIME}),
    sub,
    yfmHtmlBlock({bundle: false}),
);

export {extendedPlugins as plugins};
