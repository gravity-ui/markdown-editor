import '@diplodoc/transform/dist/js/yfm';
import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

import {YfmConfigsSpecs, YfmConfigsSpecsOptions} from './YfmConfigsSpecs';

// TODO: @makhnatkin update transform after https://github.com/diplodoc-platform/transform/pull/540
import '@diplodoc/transform/dist/css/yfm.css';
import './yfm.scss'; // eslint-disable-line import/order

export type YfmConfigsOptions = YfmConfigsSpecsOptions & {};

export const YfmConfigs: ExtensionAuto<YfmConfigsOptions> = (builder, opts) => {
    // apply md-it-attrs plugin and ignore yfm lint token
    builder.use(YfmConfigsSpecs, opts);

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        class: 'yfm yfm_no-list-reset yfm-editor',
                    },
                },
            }),
    );
};
