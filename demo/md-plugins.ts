import type {PluginWithParams} from 'markdown-it/lib';

import file from '@diplodoc/transform/lib/plugins/file';
import imsize from '@diplodoc/transform/lib/plugins/imsize';

import sub from 'markdown-it-sub';
import ins from 'markdown-it-ins';
import mark from 'markdown-it-mark';
import color from 'markdown-it-color';
import math from 'markdown-it-katex';

import meta from '@diplodoc/transform/lib/plugins/meta';
import checkbox from '@diplodoc/transform/lib/plugins/checkbox';
import deflist from '@diplodoc/transform/lib/plugins/deflist';
import anchors from '@diplodoc/transform/lib/plugins/anchors';
import cut from '@diplodoc/transform/lib/plugins/cut';
import notes from '@diplodoc/transform/lib/plugins/notes';
import tabs from '@diplodoc/transform/lib/plugins/tabs';
import code from '@diplodoc/transform/lib/plugins/code';
import sup from '@diplodoc/transform/lib/plugins/sup';
import video from '@diplodoc/transform/lib/plugins/video';
import monospace from '@diplodoc/transform/lib/plugins/monospace';
import yfmTable from '@diplodoc/transform/lib/plugins/table';

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
