import type {ExtensionAuto} from '@gravity-ui/markdown-editor/core';

import {HeaderTitleSpecs} from './HeaderTitleSpecs';

/** The title keeps its markup when the editor mode changes; it has no settings yet. */
export const HeaderTitle: ExtensionAuto = (builder) => {
    builder.use(HeaderTitleSpecs);
};
