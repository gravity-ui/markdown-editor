import yfmPlugin from '@doc-tools/transform/lib/plugins/file';
import {
    FileClassName,
    FILE_TOKEN,
    LinkHtmlAttr,
    PREFIX,
} from '@doc-tools/transform/lib/plugins/file/const';

import type {Extension} from '../../../core';
import {nodeTypeFactory} from '../../../utils/schema';
import {fileNodeAttrsSpec, KNOWN_ATTRS, LINK_TO_FILE_ATTRS_MAP} from './const';

import './index.scss';

export const fileType = nodeTypeFactory(FILE_TOKEN);

export const YfmFile: Extension = (builder) => {
    builder.configureMd((md) => md.use(yfmPlugin));
    builder.addNode(FILE_TOKEN, () => ({
        spec: {
            group: 'inline',
            inline: true,
            attrs: fileNodeAttrsSpec,
            parseDOM: [
                {
                    tag: `a[class="${FileClassName.Link}"]`,
                    getAttrs(p) {
                        const elem = p as Element;
                        const attrs: Record<string, string> = {};
                        for (const name of KNOWN_ATTRS) {
                            const value = elem.getAttribute(name);
                            if (value) {
                                attrs[name] = value;
                            }
                        }
                        return attrs;
                    },
                    priority: 101,
                },
            ],
            toDOM(node) {
                const a = document.createElement('a');
                a.contentEditable = 'false';
                a.classList.add(FileClassName.Link);
                for (const [key, value] of Object.entries(node.attrs)) {
                    if (value) a.setAttribute(key, value);
                }
                const span = document.createElement('span');
                span.classList.add(FileClassName.Icon);
                a.appendChild(span);
                a.append(node.attrs[LinkHtmlAttr.Download]);
                return a;
            },
        },
        fromYfm: {
            tokenName: FILE_TOKEN,
            tokenSpec: {
                name: FILE_TOKEN,
                type: 'node',
                getAttrs: (tok) => {
                    return Object.fromEntries(tok.attrs ?? []);
                },
            },
        },
        toYfm: (state, node) => {
            const attrsStr = Object.entries(node.attrs)
                .reduce<string[]>((arr, [key, value]) => {
                    if (value) {
                        if (key in LINK_TO_FILE_ATTRS_MAP) {
                            key = LINK_TO_FILE_ATTRS_MAP[key];
                        }
                        arr.push(`${key}="${(value as string).replace(/"/g, '')}"`);
                    }
                    return arr;
                }, [])
                .join(' ');

            state.write(`${PREFIX}${attrsStr} %}`);
        },
    }));
};
