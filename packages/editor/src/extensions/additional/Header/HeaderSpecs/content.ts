import {JSON_SCHEMA, dump, load} from 'js-yaml';

import {normalizeHeaderActionAttrs} from './attrs';
import type {HeaderActionAttr, HeaderActionTypeValue} from './const';

export type HeaderActionData = {
    [HeaderActionAttr.Type]: HeaderActionTypeValue;
    title: string;
    [HeaderActionAttr.Href]: string;
};

export type HeaderContent = {
    title: string;
    description: string;
    actions: HeaderActionData[];
};

export const EMPTY_HEADER_CONTENT: HeaderContent = {title: '', description: '', actions: []};

/**
 * `JSON_SCHEMA`, а не дефолтная: она не поднимает `yes`/`on` в булевы и не разбирает даты,
 * так что заголовок `'2020-01-01'` остаётся строкой, какой его написали.
 */
const LOAD_OPTIONS = {schema: JSON_SCHEMA} as const;

/**
 * Кавычки везде и без переносов: значение — произвольный человеческий текст, и без кавычек
 * двоеточие или `#` в заголовке молча меняют структуру документа при следующем чтении.
 */
const DUMP_OPTIONS = {
    quotingType: "'",
    forceQuotes: true,
    lineWidth: -1,
    indent: 2,
    noRefs: true,
} as const;

function asText(raw: unknown): string {
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
    return '';
}

/** Единственный конструктор элемента `actions`: порядок ключей в yaml задаётся здесь. */
export function makeHeaderAction(attrs: Record<string, unknown>, title: string): HeaderActionData {
    const {type, href} = normalizeHeaderActionAttrs(attrs);
    return {type, title, href};
}

function asAction(raw: unknown): HeaderActionData | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const source = raw as Record<string, unknown>;
    return makeHeaderAction(source, asText(source.title));
}

/**
 * Тело директивы приходит из чужого документа, поэтому любая беда в нём — пустой блок, а не
 * исключение: сломанный yaml не должен ронять разбор всей страницы.
 */
export function parseHeaderContent(raw: string): HeaderContent {
    let data: unknown;
    try {
        data = load(raw, LOAD_OPTIONS);
    } catch {
        return EMPTY_HEADER_CONTENT;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) return EMPTY_HEADER_CONTENT;

    const source = data as Record<string, unknown>;
    const actions = Array.isArray(source.actions) ? source.actions : [];

    return {
        title: asText(source.title),
        description: asText(source.description),
        actions: actions
            .map(asAction)
            .filter((action): action is HeaderActionData => Boolean(action)),
    };
}

/** Пустые ключи опускаются: `description: ''` в разметке — это шум, а не состояние. */
export function serializeHeaderContent(content: HeaderContent): string {
    const data: Record<string, unknown> = {};
    if (content.title) data.title = content.title;
    if (content.description) data.description = content.description;
    if (content.actions.length) data.actions = content.actions;

    return Object.keys(data).length ? dump(data, DUMP_OPTIONS) : '';
}
