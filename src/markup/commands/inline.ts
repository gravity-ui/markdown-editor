import {snippet} from '@codemirror/autocomplete';
import type {StateCommand} from '@codemirror/state';

import {DirectiveSyntaxFacet} from '../codemirror';

const defaultLinkSnippet = snippet(`[#{2:link}](#{1:url} "#{3:title}")`);
export const insertLink: StateCommand = ({state, dispatch}) => {
    const {from, to, empty} = state.selection.main;
    const linkSnippet = empty
        ? defaultLinkSnippet
        : snippet(`[#{2:${state.sliceDoc(from, to)}}](#{1:url} "#{3:title}")`);
    linkSnippet({state, dispatch}, null, from, to);
    return true;
};

export type ImageItem = {
    url?: string;
    title?: string;
    alt?: string;
    width?: string;
    height?: string;
};
export function insertImages(images: ImageItem[]): StateCommand {
    return ({state, dispatch}) => {
        const markup = images
            .map(({title, url, alt, width, height}) => {
                let result = `![${alt ?? ''}](${url ?? ''}`;

                if (title) {
                    result += ` "${title}"`;
                }

                if (
                    (width !== undefined && width.length > 0) ||
                    (height !== undefined && height.length > 0)
                ) {
                    result += ` =${width ?? ''}x${height ?? ''}`;
                }

                result += ')';

                return result;
            })
            .join(' ');

        const tr = state.changeByRange((range) => {
            const changes = state.changes({from: range.from, to: range.to, insert: markup});
            return {changes, range: range.map(changes)};
        });
        dispatch(state.update(tr));
        return true;
    };
}

export type FileItem = {src: string; name: string; type?: string};
const fileToCurlySyntax = (file: FileItem): string => {
    const attrsStr = Object.entries(file)
        .map(([key, value]) => `${key}="${value.replace('"', '')}"`)
        .join(' ');
    return `{% file ${attrsStr} %}`;
};
const fileToDirectiveSyntax = (file: FileItem): string => {
    const {src, name, type} = file;
    let markup = `:file[${name}](${src})`;
    if (type) markup += `{type="${type}"}`;
    return markup;
};
export const insertFiles = (files: FileItem[]): StateCommand => {
    return ({state, dispatch}) => {
        const serializer = state.facet(DirectiveSyntaxFacet).shouldInsertDirectiveMarkup('yfmFile')
            ? fileToDirectiveSyntax
            : fileToCurlySyntax;

        const markup = files.map(serializer).join(' ');
        const tr = state.changeByRange((range) => {
            const changes = state.changes({from: range.from, to: range.to, insert: markup});
            return {changes, range: range.map(changes)};
        });
        dispatch(state.update(tr));
        return true;
    };
};
