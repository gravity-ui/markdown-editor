export const buttonNodeName = 'button';
export const buttonClassName = 'g-md-button';
export const buttonViews = ['action', 'normal', 'outlined', 'flat'] as const;
export const buttonColors = [
    'default',
    'gray',
    'blue',
    'green',
    'yellow',
    'orange',
    'red',
    'violet',
] as const;
export const buttonDefaults = {
    label: '',
    href: '',
    view: 'action',
    color: 'default',
    enabled: true,
    'new-tab': false,
};
export type ButtonAttrs = typeof buttonDefaults;

export function safeLink(raw: unknown): string {
    const value = typeof raw === 'string' ? raw.trim() : '';
    const normalized = [...value]
        .filter((char) => char.charCodeAt(0) > 32 && char.charCodeAt(0) !== 127)
        .join('');
    return /^(?:javascript|vbscript|data|file):/i.test(normalized) ? '' : value;
}

export function normalizeButtonAttrs(raw: Readonly<Record<string, unknown>> = {}): ButtonAttrs {
    const view = buttonViews.includes(raw.view as never) ? String(raw.view) : 'action';
    const color = buttonColors.includes(raw.color as never) ? String(raw.color) : 'default';
    return {
        label: typeof raw.label === 'string' ? raw.label : '',
        href: safeLink(raw.href),
        view,
        color: ['normal', 'outlined'].includes(view) && color === 'default' ? 'gray' : color,
        enabled: raw.enabled !== false && raw.enabled !== 'false',
        'new-tab': raw['new-tab'] === true || raw['new-tab'] === 'true',
    };
}

export function buttonDomAttrs(raw: Readonly<Record<string, unknown>>): Record<string, string> {
    const attrs = normalizeButtonAttrs(raw);
    return {
        class: buttonClassName,
        href: attrs.href,
        'data-view': attrs.view,
        'data-color': attrs.color,
        'data-enabled': String(attrs.enabled),
        ...(attrs['new-tab'] ? {target: '_blank', rel: 'noopener noreferrer'} : {}),
    };
}

export function serializeAttrs(
    raw: Readonly<Record<string, unknown>>,
    defaults: Readonly<Record<string, unknown>>,
): string {
    const pairs = Object.entries(defaults).flatMap(([name, fallback]) => {
        const value = raw[name];
        return value === fallback || value === undefined || value === ''
            ? []
            : [`${name}="${String(value).replace(/[\\"]/g, '\\$&')}"`];
    });
    return pairs.length ? `{${pairs.join(' ')}}` : '';
}

export const escapePlainContent = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/\\/g, '&#92;')
        .replace(/^([ \t]*):/gm, '$1&#58;');
