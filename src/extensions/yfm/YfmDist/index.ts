import '@diplodoc/transform/dist/js/yfm';
import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

import {YfmDistSpecs, YfmDistSpecsOptions} from './YfmDistSpecs';

import '@diplodoc/transform/dist/css/yfm.css';
import './yfm.scss'; // eslint-disable-line import/order

export type YfmDistOptions = YfmDistSpecsOptions & {};

export const YfmDist: ExtensionAuto<YfmDistOptions> = (builder, opts) => {
    // apply md-it-attrs plugin and ignore yfm lint token
    builder.use(YfmDistSpecs, opts);

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
