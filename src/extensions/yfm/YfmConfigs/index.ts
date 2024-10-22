import '@diplodoc/transform/dist/js/base';
import '@diplodoc/transform/dist/js/_yfm-only'; // eslint-disable-line import/order
import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

import {YfmConfigsSpecs, YfmConfigsSpecsOptions} from './YfmConfigsSpecs';

import '@diplodoc/transform/dist/css/base.css';
import '@diplodoc/transform/dist/css/_yfm-only.css'; // eslint-disable-line import/order
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
