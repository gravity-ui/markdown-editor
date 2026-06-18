import type {
    HtmlConstructorBlockTemplate,
    HtmlConstructorFamilyTemplate,
    HtmlConstructorStructureTemplate,
    HtmlConstructorTemplate,
    HtmlConstructorTemplateBlock,
    HtmlConstructorTemplatePreset,
    HtmlConstructorTemplateSettings,
    HtmlConstructorTemplateType,
    HtmlConstructorThemeTemplate,
} from '../types';

const TEMPLATE_TYPES: HtmlConstructorTemplateType[] = ['family', 'structure', 'block', 'theme'];
const DATA_PRESETS: HtmlConstructorTemplatePreset[] = ['default', 'none', 'disabled'];
const BOOLEAN_SETTING_ATTRS = [
    'data-has-background',
    'data-has-round',
    'data-has-border',
    'data-has-text-color',
    'data-has-delete',
    'data-has-raw',
] as const;
const COMMON_ATTRS = new Set([
    'type',
    'id',
    'title',
    'family',
    'structure',
    'block',
    'priority',
    'data-preset',
    ...BOOLEAN_SETTING_ATTRS,
]);
const FAMILY_ATTRS = new Set(['type', 'id', 'title']);
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

export class HtmlConstructorTemplateParseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'HtmlConstructorTemplateParseError';
    }
}

const parseHtml = (value: string): Document | null => {
    if (typeof document !== 'undefined') {
        const doc = document.implementation.createHTMLDocument('');
        doc.body.innerHTML = value;

        return doc;
    }

    if (typeof DOMParser !== 'undefined') {
        return new DOMParser().parseFromString(`<body>${value}</body>`, 'text/html');
    }

    if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
        return new window.DOMParser().parseFromString(`<body>${value}</body>`, 'text/html');
    }

    return null;
};

const fail = (message: string): never => {
    throw new HtmlConstructorTemplateParseError(message);
};

const isElementWithTag = <TElement extends Element>(
    node: ChildNode,
    tagName: string,
): node is TElement =>
    node.nodeType === ELEMENT_NODE &&
    (node as Element).tagName.toLowerCase() === tagName.toLowerCase();

const isTemplateElement = (node: ChildNode): node is HTMLTemplateElement =>
    isElementWithTag<HTMLTemplateElement>(node, 'template');

const getAttr = (template: HTMLTemplateElement, name: string) =>
    template.getAttribute(name)?.trim() ?? undefined;

const hasAttr = (template: HTMLTemplateElement, name: string) => template.hasAttribute(name);

const requireAttr = (template: HTMLTemplateElement, name: string) => {
    const value = getAttr(template, name);
    if (!value) fail(`Template is missing required "${name}" attribute.`);
    return value as string;
};

const isTemplateType = (value: string): value is HtmlConstructorTemplateType =>
    TEMPLATE_TYPES.includes(value as HtmlConstructorTemplateType);

const parsePriority = (template: HTMLTemplateElement) => {
    const value = getAttr(template, 'priority');
    if (value === undefined) return 0;

    const priority = Number(value);
    if (value === '' || !Number.isFinite(priority)) {
        fail(`Template "${getAttr(template, 'id') ?? ''}" has invalid priority.`);
    }

    return priority;
};

const parsePreset = (template: HTMLTemplateElement): HtmlConstructorTemplatePreset => {
    const value = getAttr(template, 'data-preset');
    if (value === undefined) return 'default';
    if (!DATA_PRESETS.includes(value as HtmlConstructorTemplatePreset)) {
        fail(`Template "${getAttr(template, 'id') ?? ''}" has invalid data-preset.`);
    }
    return value as HtmlConstructorTemplatePreset;
};

const parseSettings = (template: HTMLTemplateElement): HtmlConstructorTemplateSettings => ({
    hasBackground: hasAttr(template, 'data-has-background'),
    hasRound: hasAttr(template, 'data-has-round'),
    hasBorder: hasAttr(template, 'data-has-border'),
    hasTextColor: hasAttr(template, 'data-has-text-color'),
    hasDelete: hasAttr(template, 'data-has-delete'),
    hasRaw: hasAttr(template, 'data-has-raw'),
    preset: parsePreset(template),
});

const normalizeStyleCss = (css: string) =>
    css
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n');

const getFragmentHtml = (fragment: DocumentFragment) => {
    const host = fragment.ownerDocument.createElement('div');
    host.append(...Array.from(fragment.childNodes).map((node) => node.cloneNode(true)));

    return host.innerHTML.trim();
};

const extractTopLevelStyles = (fragment: DocumentFragment) => {
    const styles: string[] = [];

    for (const node of Array.from(fragment.childNodes)) {
        if (isElementWithTag<HTMLStyleElement>(node, 'style')) {
            const css = normalizeStyleCss(node.textContent ?? '');
            if (css) styles.push(css);
            node.remove();
        }
    }

    return styles;
};

const removeNestedStyles = (fragment: DocumentFragment) => {
    for (const style of Array.from(fragment.querySelectorAll('style'))) {
        style.remove();
    }
};

const getTemplateParts = (template: HTMLTemplateElement) => {
    const fragment = template.content.cloneNode(true) as DocumentFragment;
    const styles = extractTopLevelStyles(fragment);
    removeNestedStyles(fragment);

    return {
        styles,
        content: getFragmentHtml(fragment),
    };
};

const validateAttributes = (template: HTMLTemplateElement, type: HtmlConstructorTemplateType) => {
    for (const attr of Array.from(template.attributes)) {
        if (!COMMON_ATTRS.has(attr.name)) fail(`Unknown template attribute "${attr.name}".`);
        if (type === 'family' && !FAMILY_ATTRS.has(attr.name)) {
            fail(`Family template "${getAttr(template, 'id') ?? ''}" has invalid attribute.`);
        }
        if (
            type === 'theme' &&
            (attr.name === 'data-preset' ||
                BOOLEAN_SETTING_ATTRS.includes(attr.name as (typeof BOOLEAN_SETTING_ATTRS)[number]))
        ) {
            fail(`Theme template "${getAttr(template, 'id') ?? ''}" has settings attributes.`);
        }
    }
};

const readReference = (template: HTMLTemplateElement, name: 'family' | 'structure' | 'block') => {
    if (!template.hasAttribute(name)) return undefined;
    const value = getAttr(template, name);
    if (!value) fail(`Template "${getAttr(template, 'id') ?? ''}" has empty "${name}".`);
    return value;
};

export const parseTemplateBlock = (content: string): HtmlConstructorTemplateBlock => {
    const doc = parseHtml(`<template>${content}</template>`);
    const template = doc?.body.firstElementChild;
    if (!template || !isTemplateElement(template)) return {css: '', content: content.trim()};

    const {styles, content: html} = getTemplateParts(template);
    return {css: styles.join('\n\n'), content: html};
};

/** Keeps user HTML verbatim inside the block; the block div only carries constructor classes. */
export const parseRawBlock = (content: string): HtmlConstructorTemplateBlock => ({
    css: '',
    content: content.trim(),
});

const byTemplateOrder = <
    T extends
        | HtmlConstructorStructureTemplate
        | HtmlConstructorBlockTemplate
        | HtmlConstructorThemeTemplate,
>(
    left: T,
    right: T,
) => left.priority - right.priority || left.declarationIndex - right.declarationIndex;

/**
 * Parses one or more top-level HTML Constructor `<template>` elements.
 * Blank input returns an empty list; invalid nonblank input throws HtmlConstructorTemplateParseError.
 */
export function parseTemplates(input: string): HtmlConstructorTemplate[] {
    const value = input.trim();
    if (!value) return [];

    const doc = parseHtml(value) ?? fail('Template parser requires a DOM implementation.');

    const familyTemplates: HtmlConstructorFamilyTemplate[] = [];
    const structureTemplates: HtmlConstructorStructureTemplate[] = [];
    const blockTemplates: HtmlConstructorBlockTemplate[] = [];
    const themeTemplates: HtmlConstructorThemeTemplate[] = [];
    const byId = new Map<string, HtmlConstructorTemplate>();

    let declarationIndex = 0;

    for (const node of Array.from(doc.body.childNodes)) {
        if (node.nodeType === TEXT_NODE && !node.textContent?.trim()) continue;
        const templateElement = isTemplateElement(node)
            ? node
            : fail('Template set contains a non-template top-level node.');

        const rawTypeValue = requireAttr(templateElement, 'type');
        if (!isTemplateType(rawTypeValue)) fail(`Unknown template type "${rawTypeValue}".`);
        const typeValue = rawTypeValue as HtmlConstructorTemplateType;
        validateAttributes(templateElement, typeValue);

        const id = requireAttr(templateElement, 'id');
        if (byId.has(id)) fail(`Duplicate template id "${id}".`);

        const title = getAttr(templateElement, 'title');
        const base = {id, type: typeValue, title, declarationIndex};
        declarationIndex += 1;

        let template: HtmlConstructorTemplate;

        if (typeValue === 'family') {
            const familyTitle = title || fail(`Family template "${id}" is missing title.`);
            const familyTemplate: HtmlConstructorFamilyTemplate = {
                ...base,
                type: 'family',
                title: familyTitle,
            };
            template = familyTemplate;
            familyTemplates.push(familyTemplate);
        } else {
            const referencedBase = {
                ...base,
                family: readReference(templateElement, 'family'),
                structure: readReference(templateElement, 'structure'),
                block: readReference(templateElement, 'block'),
                priority: parsePriority(templateElement),
            };

            if (typeValue === 'structure') {
                const {styles, content} = getTemplateParts(templateElement);
                template = {
                    ...referencedBase,
                    type: 'structure',
                    settings: parseSettings(templateElement),
                    styles,
                    content,
                };
                structureTemplates.push(template);
            } else if (typeValue === 'block') {
                const {styles, content} = getTemplateParts(templateElement);
                template = {
                    ...referencedBase,
                    type: 'block',
                    settings: parseSettings(templateElement),
                    styles,
                    content,
                };
                blockTemplates.push(template);
            } else {
                const {styles} = getTemplateParts(templateElement);
                template = {...referencedBase, type: 'theme', styles};
                themeTemplates.push(template);
            }
        }

        byId.set(id, template);
    }

    for (const template of [...structureTemplates, ...blockTemplates, ...themeTemplates]) {
        if (template.family && byId.get(template.family)?.type !== 'family') {
            fail(`Template "${template.id}" references missing family "${template.family}".`);
        }
        if (template.structure && byId.get(template.structure)?.type !== 'structure') {
            fail(`Template "${template.id}" references missing structure "${template.structure}".`);
        }
        if (template.block && byId.get(template.block)?.type !== 'block') {
            fail(`Template "${template.id}" references missing block "${template.block}".`);
        }
    }

    return [
        ...familyTemplates,
        ...structureTemplates.sort(byTemplateOrder),
        ...blockTemplates.sort(byTemplateOrder),
        ...themeTemplates.sort(byTemplateOrder),
    ];
}
