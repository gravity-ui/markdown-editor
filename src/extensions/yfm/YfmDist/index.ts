import {noop} from 'lodash';
import {Plugin} from 'prosemirror-state';

import '@doc-tools/transform/dist/js/yfm';
import '@doc-tools/transform/dist/css/yfm.css';
import './yfm.scss';

import type {ExtensionAuto} from '../../../core';

export const YfmDist: ExtensionAuto = (builder) => {
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

    // ignore yfm lint token
    builder.addNode('__yfm_lint', () => ({
        spec: {},
        fromYfm: {tokenSpec: {name: '__yfm_lint', type: 'node', ignore: true}},
        toYfm: noop,
    }));
};
