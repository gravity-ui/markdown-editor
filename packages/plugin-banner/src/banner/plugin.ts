import {
    directiveParser,
    registerContainerDirective,
    tokenizeBlockContent,
} from '@diplodoc/directive';
import type {ContainerDirectiveHandler} from '@diplodoc/directive';
import type {PluginSimple} from 'markdown-it';

import {blockDirectiveRawAttrs} from '../directive';
import {allowedImageUrl} from '../url';

import {bannerAttrs} from './attrs';
import {bannerTokenName} from './const';

const bannerDirective: ContainerDirectiveHandler = (state, params) => {
    if (params.inlineContent || params.dests || params.contentTitle) return false;
    const attrs = params.attrs ?? {};
    const {'bg-image': image} = blockDirectiveRawAttrs(state, params, ['bg-image']);
    const token = state.push(`${bannerTokenName}_open`, 'div', 1);
    token.map = [params.startLine, params.endLine];
    token.markup = `:::${bannerTokenName}`;
    token.attrs = Object.entries(
        bannerAttrs({...attrs, 'bg-image': allowedImageUrl(state.md, image)}),
    );
    tokenizeBlockContent(state, params.content, `${bannerTokenName}-directive`);
    state.push(`${bannerTokenName}_close`, 'div', -1);
    return true;
};

export const bannerPlugin: PluginSimple = (md) => {
    md.use(directiveParser());
    registerContainerDirective(md, bannerTokenName, bannerDirective);
};
