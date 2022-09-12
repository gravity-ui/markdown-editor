import {Plugin} from 'prosemirror-state';
import type {ExtensionAuto} from '../../../core';

import './index.scss';

export const BaseStyles: ExtensionAuto = (builder) => {
    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        class: 'yfm-editor',
                    },
                },
            }),
    );
};
