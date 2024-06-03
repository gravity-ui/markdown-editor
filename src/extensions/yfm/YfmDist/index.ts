import '@diplodoc/transform/dist/js/yfm';
import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

import {YfmDistSpecs} from './YfmDistSpecs';

import '@diplodoc/transform/dist/css/yfm.css';
import './yfm.scss'; // eslint-disable-line import/order

export const YfmDist: ExtensionAuto = (builder) => {
    // ignore yfm lint token
    builder.use(YfmDistSpecs);

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
