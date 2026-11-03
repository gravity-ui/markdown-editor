import type {PluginSimple} from 'markdown-it';

import {headerDirective} from './directive';
import {headerSource} from './source';
import {headerText} from './text';

export * from './dimensions';
export {headerSourceTokenName, isHeaderSource} from './source';
export * from './text';
export {stringifyAttrs} from './attrs';

export const headerPlugin: PluginSimple = (md) => {
    md.use(headerDirective).use(headerText).use(headerSource);
};

export default headerPlugin;
