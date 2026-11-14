import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderContentSpecs} from './HeaderContentSpecs';

/** The description keeps its markup when the editor mode changes; it has no settings yet. */
export const HeaderContent: ExtensionAuto = (builder) => {
    builder.use(HeaderContentSpecs);
};
