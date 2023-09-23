import type {PluginWithParams} from 'markdown-it/lib';

import file from '@doc-tools/transform/lib/plugins/file';
import imsize from '@doc-tools/transform/lib/plugins/imsize';

import sub from 'markdown-it-sub';
import ins from 'markdown-it-ins';
import mark from 'markdown-it-mark';
import color from 'markdown-it-color';
import math from 'markdown-it-katex';

import meta from '@doc-tools/transform/lib/plugins/meta';
import checkbox from '@doc-tools/transform/lib/plugins/checkbox';
import deflist from '@doc-tools/transform/lib/plugins/deflist';
import anchors from '@doc-tools/transform/lib/plugins/anchors';
import cut from '@doc-tools/transform/lib/plugins/cut';
import notes from '@doc-tools/transform/lib/plugins/notes';
import tabs from '@doc-tools/transform/lib/plugins/tabs';
import code from '@doc-tools/transform/lib/plugins/code';
import sup from '@doc-tools/transform/lib/plugins/sup';
import video from '@doc-tools/transform/lib/plugins/video';
import monospace from '@doc-tools/transform/lib/plugins/monospace';
import yfmTable from '@doc-tools/transform/lib/plugins/table';

const defaultPlugins: PluginWithParams[] = [
    meta,
    deflist,
    cut,
    notes,
    anchors,
    tabs,
    code,
    sup,
    video,
    monospace,
    yfmTable,
    file,
    imsize,
    checkbox,
];
const extendedPlugins = defaultPlugins.concat(sub, ins, mark, math, color);

export {extendedPlugins as plugins};
