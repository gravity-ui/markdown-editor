import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderImageSpecs} from './HeaderImageSpecs';

/** The image keeps its markup when the editor mode changes; it has no settings yet. */
export const HeaderImage: ExtensionAuto = (builder) => {
    builder.use(HeaderImageSpecs);
};
