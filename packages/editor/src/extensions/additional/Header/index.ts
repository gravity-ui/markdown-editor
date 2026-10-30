import type {ExtensionAuto} from '#core';

import {HeaderSpecs} from './HeaderSpecs';

import './index.scss';
import './stub.scss';

export * from './HeaderSpecs';

/** Обложка страницы. В ВИЗИВИГ блок пока показан заглушкой с исходной разметкой. */
export const Header: ExtensionAuto = (builder) => {
    builder.use(HeaderSpecs);
};
