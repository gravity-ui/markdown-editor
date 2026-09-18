import {
    FILE_MARKUP_PREFIX,
    FileClassName,
    FileHtmlAttr,
    transform as fileTransform,
} from '@diplodoc/file-extension';
import type {Node} from 'prosemirror-model';

import type {Extension} from '../../../../core';
import {nodeTypeFactory} from '../../../../utils/schema';

import {
    KNOWN_ATTRS,
    LINK_TO_FILE_ATTRS_MAP,
    YFM_FILE_DIRECTIVE_ATTRS,
    YfmFileAttr,
    fileNodeAttrsSpec,
    yfmFileNodeName,
} from './const';

export {yfmFileNodeName, YfmFileAttr} from './const';
export const fileType = nodeTypeFactory(yfmFileNodeName);

declare global {
    namespace MarkdownEditor {
        interface DirectiveSyntaxAdditionalSupportedExtensions {
            // Mark in global types that YfmFile has support for directive syntax
            yfmFile: true;
        }
    }
}

export const YfmFileSpecs: Extension = (builder) => {
    const directiveContext = builder.context.get('directiveSyntax');

    builder.configureMd((md) =>
        md.use(
            fileTransform({
                bundle: false,
                directiveSyntax: directiveContext?.mdPluginValueFor('yfmFile'),
            }),
        ),
    );
    builder.addNode(yfmFileNodeName, () => ({
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
                a.append(node.attrs[FileHtmlAttr.Download]);
                return a;
            },
        },
        fromMd: {
            tokenName: yfmFileNodeName,
            tokenSpec: {
                name: yfmFileNodeName,
                type: 'node',
                getAttrs: (tok) => {
                    const attrs = Object.fromEntries(tok.attrs || []);
                    attrs[YfmFileAttr.Markup] = tok.markup;
                    return attrs;
                },
            },
        },
        toMd: (state, node) => {
            if (
                directiveContext?.shouldSerializeToDirective(
                    'yfmFile',
                    node.attrs[YfmFileAttr.Markup],
                )
            ) {
                state.write(serializeToDirective(node));
                return;
            }

            const attrsStr = Object.entries(node.attrs)
                .reduce<string[]>((arr, [key, value]) => {
                    if (key !== YfmFileAttr.Markup && value) {
                        if (key in LINK_TO_FILE_ATTRS_MAP) {
                            key = LINK_TO_FILE_ATTRS_MAP[key];
                        }
                        arr.push(`${key}="${(value as string).replace(/"/g, '')}"`);
                    }
                    return arr;
                }, [])
                .join(' ');

            state.write(`${FILE_MARKUP_PREFIX}${attrsStr} %}`);
        },
    }));
};

function serializeToDirective(node: Node): string {
    const filename: string = node.attrs[YfmFileAttr.Name] || '';
    const filelink: string = node.attrs[YfmFileAttr.Link] || '';

    let fileMarkup = `:file[${filename}](${filelink})`;
    const attrs = YFM_FILE_DIRECTIVE_ATTRS.reduce<string[]>((acc, key) => {
        const value = node.attrs[key];
        if (value) acc.push(`${key}="${value}"`);
        return acc;
    }, []);
    if (attrs.length) fileMarkup += `{${attrs.join(' ')}}`;

    return fileMarkup;
}
