import {Plugin} from 'prosemirror-state';

import '@diplodoc/transform/dist/js/yfm';
import '@diplodoc/transform/dist/css/yfm.css';
import './yfm.scss';

import type {ExtensionAuto} from '../../../core';
import {YfmDistSpecs} from './YfmDistSpecs';

export const YfmDist: ExtensionAuto = (builder) => {
    // ignore yfm lint token
    builder.use(YfmDistSpecs);

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        class: 'yfm yfm_no-list-reset',
                    },
                },
            }),
    );
};
