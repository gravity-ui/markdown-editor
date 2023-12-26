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
import color from 'markdown-it-color';
import ins from 'markdown-it-ins';
import math from 'markdown-it-katex';
import mark from 'markdown-it-mark';
import sub from 'markdown-it-sub';

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
