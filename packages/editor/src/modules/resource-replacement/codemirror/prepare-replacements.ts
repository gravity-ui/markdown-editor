import type {EditorState} from '@codemirror/state';

import {resourceKey} from '../controller.utils';
import {prepareResourceUrl} from '../urls';

import {collectMarkupResources} from './collect-resources';
import type {ResourceSyntaxMatch} from './handlers';
import type {CodeMirrorResourceReplacementOptions} from './options';

/**
 * Готовит изменения всего текущего документа, не применяя их. Подробности — в resources.md.
 * Values are prepared and serialized for every match before the caller dispatches.
 */
export function prepareResourceChanges(
    state: EditorState,
    replacements: ReadonlyMap<string, string>,
    options: Pick<CodeMirrorResourceReplacementOptions, 'resources' | 'urls'>,
    requestedUrlKeys: ReadonlySet<string> = new Set(),
) {
    const urls = new Map<string, string>();
    for (const [key, value] of replacements) {
        if (requestedUrlKeys.has(key)) urls.set(key, prepareResourceUrl(options.urls, value));
    }
    const changes: Array<{from: number; to: number; insert: string}> = [];
    // Без ranges: ответ обновляет и вставленные, и ранее существовавшие совпадения.
    for (const {syntax, resource, isUrl} of collectMarkupResources(state, options)) {
        const key = resourceKey(resource);
        let value = replacements.get(key);
        if (value === undefined) continue;
        if (isUrl) {
            value = urls.get(key) ?? prepareResourceUrl(options.urls, value);
            urls.set(key, value);
        }
        const {from, to, insert} = serializeResourceChange(syntax, value);
        if (state.sliceDoc(from, to) !== insert) changes.push({from, to, insert});
    }
    // Все позиции относятся к state.doc: изменения применятся вместе, без ручного
    // сдвига координат и повторного поиска по новым адресам (каскадной замены).
    return changes;
}

function serializeResourceChange(syntax: ResourceSyntaxMatch, value: string) {
    const reference = syntax.reference;
    const from = reference?.labelTo ?? syntax.valueRange.from;
    const to = reference ? syntax.range.to : syntax.valueRange.to;
    let insert = syntax.serialize(value);
    if (typeof insert !== 'string') throw new Error('Invalid resource serialization');
    if (reference) {
        // Заменяем [photo] у изображения на (новый URL "title"). Общее определение
        // не меняем, чтобы сохранить адрес обычных ссылок на ту же метку.
        const title = reference.title?.replace(
            /[&"\\\r\n]/g,
            (char) => '&#' + char.charCodeAt(0) + ';',
        );
        insert = '(' + insert + (title ? ' "' + title + '"' : '') + ')';
    }
    return {from, to, insert};
}
