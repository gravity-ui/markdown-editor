import {ExtensionAuto} from '../../../core';

import {YfmHtmlSpecs} from './YfmHtmlSpecs';

export const YfmHtml: ExtensionAuto = (builder) => {
    builder.use(YfmHtmlSpecs);
};
