import '@diplodoc/transform/dist/js/base.js';
import '@diplodoc/transform/dist/js/_yfm-only.js'; // eslint-disable-line import/order
import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '#core';
import {type YfmMods, b} from 'src/view/components/YfmHtml/YfmStaticView';

import {YfmConfigsSpecs, type YfmConfigsSpecsOptions} from './YfmConfigsSpecs';

import '@diplodoc/transform/dist/css/base.css';
import '@diplodoc/transform/dist/css/_yfm-only.css'; // eslint-disable-line import/order
import './yfm.scss'; // eslint-disable-line import/order

export type YfmConfigsOptions = YfmConfigsSpecsOptions & {
    mods?: YfmMods;
    mix?: string;
};

export const YfmConfigs: ExtensionAuto<YfmConfigsOptions> = (builder, opts) => {
    // apply md-it-attrs plugin and ignore yfm lint token
    builder.use(YfmConfigsSpecs, opts);

    const {mix} = opts;
    const mods = {...opts.mods};
    // by default mods['no-list-reset']===true
    if (mods['no-list-reset'] !== false) mods['no-list-reset'] = true;

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        class: `${b(mods, mix)} yfm-editor`,
                    },
                },
            }),
    );
};
