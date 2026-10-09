import {transform} from '@diplodoc/folding-headings-extension';

import type {ExtensionAuto} from '../../../../core';

import {skipSectionsPlugin} from './md/skip-heading-sections';

export const FoldingHeadingSpecs: ExtensionAuto = (builder) => {
    builder.configureMd((md) => md.use(transform({bundle: false})).use(skipSectionsPlugin));
};
