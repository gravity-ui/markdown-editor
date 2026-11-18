import {
    type LeafBlockDirectiveParams,
    directiveParser,
    registerContainerDirective,
    registerLeafBlockDirective,
} from '@diplodoc/directive';
import type MarkdownIt from 'markdown-it';
import type StateBlock from 'markdown-it/lib/rules_block/state_block';

import {HeaderSlot, headerActionName, headerDirectiveName, headerTokenName} from '../const';

const containers = [headerDirectiveName, HeaderSlot.Content, HeaderSlot.Actions];
const leaves = [HeaderSlot.Title, HeaderSlot.Image, headerActionName];

/**
 * Разбор для ВИЗИВИГ: блок и его директивы, в том числе вне обложки, превращаются в один токен
 * с исходной разметкой. Так переключение режимов возвращает разметку без изменений.
 */
export const headerStubPlugin = (md: MarkdownIt) => {
    md.use(directiveParser());

    const keepMarkup = (state: StateBlock, {startLine, endLine}: LeafBlockDirectiveParams) => {
        const token = state.push(headerTokenName, 'div', 0);
        token.block = true;
        token.map = [startLine, endLine];
        token.content = state.getLines(startLine, endLine, state.blkIndent, false);
        return true;
    };

    for (const name of containers) registerContainerDirective(md, name, keepMarkup);
    for (const name of leaves) registerLeafBlockDirective(md, name, keepMarkup);
};
