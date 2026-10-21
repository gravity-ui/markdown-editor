import type {ExtensionAuto} from '#core';

import {HeaderSpecs} from './HeaderSpecs';

import './index.scss';

export * from './HeaderSpecs';

/** Обложка страницы. */
export const Header: ExtensionAuto = (builder) => {
    builder.use(HeaderSpecs);
};
