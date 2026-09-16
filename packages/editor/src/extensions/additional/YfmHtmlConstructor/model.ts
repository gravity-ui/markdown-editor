import type {Node} from 'prosemirror-model';

import {YfmHtmlConstructorConsts} from './YfmHtmlConstructorSpecs/const';
import {normalizeHtmlConstructorQuickStyle} from './quickStyle';
import {normalizeHtmlConstructorTemplateSettings} from './settings';
import type {HtmlConstructorBlock, HtmlConstructorStructure} from './types';

export const emptyHtmlConstructorStructure = (): HtmlConstructorStructure => ({
    css: '',
    content: '',
    themeIds: [],
});

export const readStructure = (node: Node): HtmlConstructorStructure => {
    const value = node.attrs[YfmHtmlConstructorConsts.NodeAttrs.structure];
    if (!value || typeof value !== 'object') return emptyHtmlConstructorStructure();

    return {
        templateId: typeof value.templateId === 'string' ? value.templateId : undefined,
        css: typeof value.css === 'string' ? value.css : '',
        content: typeof value.content === 'string' ? value.content : '',
        themeIds: Array.isArray(value.themeIds)
            ? value.themeIds.filter((id: unknown): id is string => typeof id === 'string')
            : [],
        settings: normalizeHtmlConstructorTemplateSettings(value.settings),
        quickStyle: normalizeHtmlConstructorQuickStyle(value.quickStyle),
    };
};

export const readBlocks = (node: Node): HtmlConstructorBlock[] => {
    const value = node.attrs[YfmHtmlConstructorConsts.NodeAttrs.blocks];
    if (!Array.isArray(value)) return [];

    return value.flatMap((block): HtmlConstructorBlock[] => {
        if (!block || typeof block !== 'object') return [];

        return [
            {
                id: typeof block.id === 'string' ? block.id : '',
                templateId: typeof block.templateId === 'string' ? block.templateId : undefined,
                css: typeof block.css === 'string' ? block.css : '',
                content: typeof block.content === 'string' ? block.content : '',
                themeIds: Array.isArray(block.themeIds)
                    ? block.themeIds.filter((id: unknown): id is string => typeof id === 'string')
                    : [],
                settings: normalizeHtmlConstructorTemplateSettings(block.settings),
                quickStyle: normalizeHtmlConstructorQuickStyle(block.quickStyle),
            },
        ];
    });
};

export const createHtmlConstructorBlockId = () => Math.random().toString(36).slice(2, 10);

const ID_REF_ATTRS = ['aria-labelledby', 'aria-controls', 'aria-describedby', 'aria-owns'];

/** Give duplicated HTML fresh IDs while preserving its internal links and labels. */
export const regenerateHtmlIds = (html: string): string => {
    if (!html.trim() || typeof document === 'undefined') return html;

    const template = document.createElement('template');
    template.innerHTML = html;

    const idMap = new Map<string, string>();
    template.content.querySelectorAll('[id]').forEach((element) => {
        const oldId = element.getAttribute('id');
        if (!oldId) return;

        const newId = `${oldId}-${createHtmlConstructorBlockId()}`;
        idMap.set(oldId, newId);
        element.setAttribute('id', newId);
    });

    if (idMap.size === 0) return html;

    template.content.querySelectorAll('*').forEach((element) => {
        const forAttr = element.getAttribute('for');
        if (forAttr && idMap.has(forAttr)) element.setAttribute('for', idMap.get(forAttr)!);

        const href = element.getAttribute('href');
        if (href?.startsWith('#') && idMap.has(href.slice(1))) {
            element.setAttribute('href', `#${idMap.get(href.slice(1))!}`);
        }

        for (const attr of ID_REF_ATTRS) {
            const value = element.getAttribute(attr);
            if (!value) continue;

            const mapped = value
                .split(/\s+/)
                .map((token) => idMap.get(token) ?? token)
                .join(' ');
            if (mapped !== value) element.setAttribute(attr, mapped);
        }
    });

    return template.innerHTML;
};

export const cloneHtmlConstructorBlock = (block: HtmlConstructorBlock): HtmlConstructorBlock => ({
    ...block,
    id: createHtmlConstructorBlockId(),
    content: regenerateHtmlIds(block.content),
});
