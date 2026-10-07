import type {Colors} from '../../Color/const';

import {
    defaultStatusColor,
    statusCn,
    statusColorDomAttr,
    statusColors,
    statusNodeName,
} from './const';

const knownColors: ReadonlySet<string> = new Set(statusColors);

export const normalizeStatusColor = (color: unknown): Colors =>
    typeof color === 'string' && knownColors.has(color) ? (color as Colors) : defaultStatusColor;

export const escapeStatusText = (text: string): string => text.replace(/([\\\]])/g, '\\$1');

export const getStatusDomAttrs = (color: Colors): Record<string, string> => ({
    class: statusCn({color}),
    'data-qa': statusNodeName,
    [statusColorDomAttr]: color,
});
