import {
    type StatusColor,
    defaultStatusColor,
    statusCn,
    statusColorDomAttr,
    statusColors,
    statusNodeName,
} from './const';

const knownColors: ReadonlySet<string> = new Set(statusColors);

export const normalizeStatusColor = (color: unknown): StatusColor =>
    typeof color === 'string' && knownColors.has(color)
        ? (color as StatusColor)
        : defaultStatusColor;

export const escapeStatusText = (text: string): string => text.replace(/([\\\]])/g, '\\$1');

export const getStatusDomAttrs = (color: StatusColor): Record<string, string> => ({
    class: statusCn({color}),
    'data-qa': statusNodeName,
    [statusColorDomAttr]: color,
});
