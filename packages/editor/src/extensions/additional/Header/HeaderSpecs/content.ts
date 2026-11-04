import {normalizeHeaderActionAttrs, serializeDirectiveValue} from './attrs';
import {
    type HeaderActionAttr,
    type HeaderActionColorValue,
    HeaderActionDefaults,
    type HeaderActionTypeValue,
    HeaderSlotDirective,
} from './const';

export type HeaderActionData = {
    [HeaderActionAttr.Type]: HeaderActionTypeValue;
    title: string;
    [HeaderActionAttr.Href]: string;
    [HeaderActionAttr.Color]?: HeaderActionColorValue;
};

export type HeaderContent = {
    title: string;
    description: string;
    actions: HeaderActionData[];
};

/** Keep action keys in a stable order when serializing. */
export function makeHeaderAction(attrs: Record<string, unknown>, title: string): HeaderActionData {
    const {type, href, color} = normalizeHeaderActionAttrs(attrs);
    return {type, title, href, ...(color === HeaderActionDefaults.color ? {} : {color})};
}

/** Encode delimiters and line breaks so plain text cannot introduce another directive. */
function escapeText(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/[\\[\]\r\n]/g, (char) => `&#${char.charCodeAt(0)};`);
}

export function serializeHeaderContent(content: HeaderContent): string {
    const lines: string[] = [];
    if (content.title) lines.push(`::${HeaderSlotDirective.Title}[${escapeText(content.title)}]`);
    if (content.description)
        lines.push(`::${HeaderSlotDirective.Description}[${escapeText(content.description)}]`);
    for (const action of content.actions) {
        const attrs: string[] = [];
        if (action.href) attrs.push(`href=${serializeDirectiveValue(action.href)}`);
        if (action.type !== HeaderActionDefaults.type) attrs.push(`type=${action.type}`);
        if (action.color && action.color !== HeaderActionDefaults.color)
            attrs.push(`color=${action.color}`);
        lines.push(
            `::${HeaderSlotDirective.Action}[${escapeText(action.title)}]${attrs.length ? ` {${attrs.join(' ')}}` : ''}`,
        );
    }
    return lines.join('\n');
}
