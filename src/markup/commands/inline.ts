import {snippet} from '@codemirror/autocomplete';
import type {StateCommand} from '@codemirror/state';

const defaultLinkSnippet = snippet(`[#{2:link}](#{1:url} "#{3:title}")`);
export const insertLink: StateCommand = ({state, dispatch}) => {
    const {from, to, empty} = state.selection.main;
    const linkSnippet = empty
        ? defaultLinkSnippet
        : snippet(`[#{2:${state.sliceDoc(from, to)}}](#{1:url} "#{3:title}")`);
    linkSnippet({state, dispatch}, null, from, to);
    return true;
};

const defaultAnchorSnippet = snippet(`#[#{2:text}](#{1:anchor} "#{3:title}")`);
export const insertAnchor: StateCommand = ({state, dispatch}) => {
    const {from, to, empty} = state.selection.main;
    const anchorSnippet = empty
        ? defaultAnchorSnippet
        : snippet(`#[#{2:${state.sliceDoc(from, to)}}](#{1:anchor} "#{3:title}")`);
    anchorSnippet({state, dispatch}, null, from, to);
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
                const titleStr = title ? ` "${title}"` : '';
                const sizeStr = width ?? height ? ` =${width ?? ''}x${height ?? ''}` : '';
                return `![${alt ?? ''}](${url ?? ''}${titleStr}${sizeStr})`;
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
export const insertFiles = (files: FileItem[]): StateCommand => {
    return ({state, dispatch}) => {
        const markup = files
            .map((attrs) => {
                const attrsStr = Object.entries(attrs)
                    .map(([key, value]) => `${key}="${value.replace('"', '')}"`)
                    .join(' ');
                return `{% file ${attrsStr} %}`;
            })
            .join(' ');

        const tr = state.changeByRange((range) => {
            const changes = state.changes({from: range.from, to: range.to, insert: markup});
            return {changes, range: range.map(changes)};
        });
        dispatch(state.update(tr));
        return true;
    };
};
