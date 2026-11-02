import type {PluginSimple} from 'markdown-it';

import {headerDirective} from './directive';
import {headerSource} from './source';

export * from './dimensions';
export {headerSourceTokenName, isHeaderSource} from './source';

export const headerPlugin: PluginSimple = (md) => {
    md.use(headerDirective).use(headerSource);
};

export default headerPlugin;
