import type {InlineContext, MarkdownConfig} from '@lezer/markdown' with {
    'resolution-mode': 'import',
};

import {inlineDestination} from './inline-destination';

export const ImageSizeExtension: MarkdownConfig = {
    defineNodes: ['SizedResourceImage', 'ResourceURL', 'ResourceLabel'],
    parseInline: [
        {
            name: 'SizedResourceImage',
            before: 'Image',
            parse(cx: InlineContext, next: number, pos: number) {
                if (next !== 33 || cx.char(pos + 1) !== 91) return -1;
                const match = inlineDestination(cx, pos, 2, true);
                if (!match?.sized) return -1;
                return cx.addElement(
                    cx.elt('SizedResourceImage', pos, match.end, [
                        cx.elt('ResourceLabel', pos + 2, match.labelEnd),
                        cx.elt('ResourceURL', match.urlStart, match.urlEnd),
                    ]),
                );
            },
        },
    ],
};
