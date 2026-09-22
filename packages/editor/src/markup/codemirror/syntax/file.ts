import type {InlineContext, MarkdownConfig} from '@lezer/markdown' with {
    'resolution-mode': 'import',
};

import {inlineDestination} from './inline-destination';

export const FileExtension: MarkdownConfig = {
    defineNodes: ['ResourceFile', 'ResourceFileDirective', 'FileResourceURL', 'FileResourceName'],
    parseInline: [
        {
            name: 'ResourceFile',
            before: 'Link',
            parse(cx: InlineContext, next: number, pos: number) {
                if (next === 58 && cx.slice(pos, pos + 6) === ':file[') {
                    const match = inlineDestination(cx, pos, 6);
                    if (!match) return -1;
                    return cx.addElement(
                        cx.elt('ResourceFileDirective', pos, match.end, [
                            cx.elt('FileResourceName', pos + 6, match.labelEnd),
                            cx.elt('FileResourceURL', match.urlStart, match.urlEnd),
                        ]),
                    );
                }
                if (next !== 123 || cx.slice(pos, pos + 7) !== '{% file') return -1;
                const text = cx.slice(pos, cx.end);
                const match = /^\{% file((?:\s*\w+=(?:"[^"]+"|'[^']+')\s)+)\s*%}/.exec(text);
                if (!match) return -1;
                const attrs = new Map<string, {from: number; to: number}>();
                for (const attr of match[0].matchAll(/(\w+)=("[^"]+"|'[^']+')/g)) {
                    const from = pos + attr.index! + attr[1].length + 2;
                    attrs.set(attr[1], {from, to: from + attr[2].length - 2});
                }
                const src = attrs.get('src'),
                    name = attrs.get('name');
                if (!src || !name) return -1;
                const children = [
                    cx.elt('FileResourceURL', src.from, src.to),
                    cx.elt('FileResourceName', name.from, name.to),
                ].sort((a, b) => a.from - b.from);
                return cx.addElement(cx.elt('ResourceFile', pos, pos + match[0].length, children));
            },
        },
    ],
};
