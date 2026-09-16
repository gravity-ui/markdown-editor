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

// Preserve unquoted dates as strings.
const LOAD_OPTIONS = {schema: JSON_SCHEMA} as const;

// Quote text to preserve YAML punctuation and avoid line wrapping.
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

/** Keep action keys in a stable order when serializing. */
export function makeHeaderAction(attrs: Record<string, unknown>, title: string): HeaderActionData {
    const {type, href} = normalizeHeaderActionAttrs(attrs);
    return {type, title, href};
}

function asAction(raw: unknown): HeaderActionData | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

    const source = raw as Record<string, unknown>;
    return makeHeaderAction(source, asText(source.title));
}

/** Invalid YAML produces an empty header. */
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

export function serializeHeaderContent(content: HeaderContent): string {
    const data: Record<string, unknown> = {};
    if (content.title) data.title = content.title;
    if (content.description) data.description = content.description;
    if (content.actions.length) data.actions = content.actions;

    return Object.keys(data).length ? dump(data, DUMP_OPTIONS) : '';
}
