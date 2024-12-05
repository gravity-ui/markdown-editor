import Token from 'markdown-it/lib/token';

import {emptyRow} from './constants';
import {EmptyTokenParserType, checkRow, normilize} from './utils';

export const parseEmptyRow = (tokens: Token[]) => {
    const parsedTokens: Token[] = [];

    const openBlocks: EmptyTokenParserType[] = [];
    const closedBlocks: EmptyTokenParserType[] = [];

    const previosTokenData = {
        index: 0,
        blockName: '',
        isTab: 0,
    };

    for (let i = 0; i < tokens.length; i++) {
        const isOpenBlock = tokens[i].type.indexOf('_open') !== -1;
        const isClosedBlock = tokens[i].type.indexOf('_close') !== -1;

        if (isOpenBlock || ['hr', 'fence', 'mermaid'].includes(tokens[i].type)) {
            const activeBlock = normilize(tokens[i]);

            if (activeBlock && activeBlock.tag === 'tabs') {
                activeBlock.start = tokens[i + 1]?.map?.[0] || -1;
                activeBlock.end = tokens[i + 1]?.map?.[1] || -1;

                previosTokenData.isTab++;
            }

            openBlocks.push(activeBlock);
            let row = checkRow(activeBlock, previosTokenData);

            while (row > 0) {
                parsedTokens.push(...emptyRow(i));
                row--;
            }
        } else if (isClosedBlock) {
            let lastItem = openBlocks.pop();
            if (['yfm_cut_close'].includes(tokens[i].type)) {
                lastItem = normilize(tokens[i]);
            }
            if (lastItem) {
                closedBlocks.push(lastItem);

                if (lastItem.tag === 'tabs') {
                    previosTokenData.isTab--;
                }
            }
        }

        const maps = tokens[i].map;

        if (maps) {
            if (tokens[i].block && isOpenBlock) {
                previosTokenData.index = maps[0];
            } else {
                previosTokenData.index = maps[1];
            }
        }

        previosTokenData.blockName = normilize(tokens[i]).tag;

        if (isClosedBlock) {
            previosTokenData.index = (closedBlocks.at(-1) as EmptyTokenParserType).end;
            previosTokenData.blockName = (closedBlocks.at(-1) as EmptyTokenParserType).tag;
        }

        parsedTokens.push(tokens[i]);
    }

    return parsedTokens;
};
