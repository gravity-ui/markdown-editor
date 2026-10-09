import {Plugin} from 'prosemirror-state';

import type {ExtensionAuto} from '../../../core';

import './index.scss';

const CLASSNAME = 'g-md-editor';

export type BaseStylesOptions = {
    attributes?: Record<string, string>;
};

export const BaseStyles: ExtensionAuto<BaseStylesOptions> = (builder, opts) => {
    const {attributes = {}} = opts;

    builder.addPlugin(
        () =>
            new Plugin({
                props: {
                    attributes: {
                        ...attributes,
                        class: [CLASSNAME, attributes.class].filter(Boolean).join(' '),
                    },
                },
            }),
    );
};
