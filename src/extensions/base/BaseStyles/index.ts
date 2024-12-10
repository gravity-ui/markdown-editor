import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

export const BaseStyles: ExtensionAuto = (builder) => {
    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        class: 'g-md-editor',
                    },
                },
            }),
    );
};
