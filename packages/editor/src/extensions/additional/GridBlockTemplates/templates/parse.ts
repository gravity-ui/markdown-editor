import {v4 as uuidv4} from 'uuid';

import {inlineToRule} from '../css';
import type {
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
    GridBlockTemplateType,
} from '../types';

const genId = () => 'grid-block-template-' + uuidv4();
const htmlTemplateTagName = 'grid-template-html';

const isTemplateType = (value: string | null): value is GridBlockTemplateType =>
    value === 'block' || value === 'container';

const parseHtml = (value: string): Document | null => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return null;
    return new DOMParser().parseFromString(value, 'text/html');
};

const getStyle = (element: Element | null) =>
    element instanceof HTMLElement ? element.getAttribute('style')?.trim() || '' : '';

const joinCss = (...parts: string[]) =>
    parts
        .map((part) => part.trim())
        .filter(Boolean)
        .join('\n\n');

const normalizeStyleCss = (css: string) =>
    css
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n');

const isElementWithTag = (node: ChildNode, tagName: string): node is Element =>
    node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName.toLowerCase() === tagName;

const normalizeTemplateHtmlTag = (content: string) =>
    content
        .replace(/<\/html\s*>/gi, `</${htmlTemplateTagName}>`)
        .replace(/<html(\s[^>]*)?>/gi, `<${htmlTemplateTagName}$1>`);

const consumeElements = (elements: Element[]) => {
    elements.forEach((element) => element.remove());

    return elements;
};

const consumeDirectElements = (node: ParentNode, tagName: string) =>
    consumeElements(
        Array.from(node.childNodes).filter((child): child is Element =>
            isElementWithTag(child, tagName),
        ),
    );

const consumeStyleCss = (node: ParentNode) =>
    joinCss(
        ...consumeElements(Array.from(node.querySelectorAll('style'))).map((style) =>
            normalizeStyleCss(style.textContent ?? ''),
        ),
    );

const consumeLegacyDirectStyleCss = (node: ParentNode) =>
    joinCss(
        ...consumeDirectElements(node, 'style').map((style) =>
            normalizeStyleCss(style.textContent ?? ''),
        ),
    );

const createTemplateFragment = (content: string): DocumentFragment | null => {
    const doc = parseHtml(`<template>${normalizeTemplateHtmlTag(content)}</template>`);
    const template = doc?.querySelector('template');

    return typeof HTMLTemplateElement !== 'undefined' && template instanceof HTMLTemplateElement
        ? (template.content.cloneNode(true) as DocumentFragment)
        : null;
};

const getFragmentHtml = (fragment: DocumentFragment) => {
    const host = document.createElement('div');
    host.append(...Array.from(fragment.childNodes).map((node) => node.cloneNode(true)));

    return host.innerHTML.trim();
};

const getTemplateParts = (content: string) => {
    const fragment = createTemplateFragment(content);
    if (!fragment) return {css: '', hasExplicitParts: false, html: content};

    const css = consumeStyleCss(fragment);
    const htmlElements = consumeDirectElements(fragment, htmlTemplateTagName);
    const hasExplicitParts = Boolean(css || htmlElements.length);
    const html = htmlElements.length
        ? htmlElements
              .map((element) => element.innerHTML.trim())
              .filter(Boolean)
              .join('\n')
        : getFragmentHtml(fragment);

    return {css, hasExplicitParts, html};
};

const resolveCss = ({
    styleCss,
    inlineCss,
    inlineSelector,
}: {
    styleCss: string;
    inlineCss: string;
    inlineSelector?: string;
}) => {
    if (!styleCss) return inlineCss;

    return joinCss(styleCss, inlineCss ? inlineToRule(inlineCss, inlineSelector) : '');
};

export const parseTemplateBlock = (content: string): GridBlockTemplateBlock => {
    const {css: templateCss, hasExplicitParts, html} = getTemplateParts(content);

    if (hasExplicitParts) {
        return {css: templateCss, content: html};
    }

    const doc = parseHtml(html);
    const root = doc?.body.firstElementChild ?? null;

    if (!root) {
        return {css: templateCss, content: doc?.body.innerHTML.trim() || html};
    }

    const rootCss = consumeLegacyDirectStyleCss(root);
    const inlineCss = getStyle(root);

    return {
        css: resolveCss({styleCss: joinCss(templateCss, rootCss), inlineCss}),
        content: root.innerHTML.trim(),
    };
};

/** Keeps user HTML verbatim inside the block; the block div only carries grid CSS. */
export const parseRawBlock = (content: string): GridBlockTemplateBlock => ({
    css: '',
    content: content.trim(),
});

const parseContainerTemplate = (
    id: string,
    title: string,
    group: string | undefined,
    content: string,
): GridBlockContainerTemplate => {
    const {css: templateCss, html} = getTemplateParts(content);
    const doc = parseHtml(html);
    const root = doc?.body.firstElementChild ?? null;
    const rootCss = root ? consumeLegacyDirectStyleCss(root) : '';
    const children = root ? Array.from(root.children) : [];
    const styleCss = joinCss(templateCss, rootCss);

    return {
        id,
        title,
        group,
        type: 'container',
        content,
        containerCss: resolveCss({
            styleCss,
            inlineCss: getStyle(root),
            inlineSelector: '.grid',
        }),
        blocks: children.map((child) => {
            const childStyleCss = consumeLegacyDirectStyleCss(child);

            return {
                css: resolveCss({styleCss: childStyleCss, inlineCss: getStyle(child)}),
                content: child.innerHTML.trim(),
            };
        }),
    };
};

const parseBlockTemplate = (
    id: string,
    title: string,
    group: string | undefined,
    content: string,
): GridBlockBlockTemplate => ({
    id,
    title,
    group,
    type: 'block',
    content,
    block: parseTemplateBlock(content),
});

/**
 * Parses one or more `<template id="..." title="..." type="block|container" group="...">...</template>`
 * blocks. Templates without a valid type are ignored.
 */
export function parseTemplates(input: string): GridBlockTemplate[] {
    const value = input.trim();
    if (!value) return [];

    const doc = parseHtml(normalizeTemplateHtmlTag(value));
    if (!doc) return [];

    return Array.from(doc.querySelectorAll('template')).flatMap((el) => {
        const type = el.getAttribute('type')?.trim() ?? null;
        if (!isTemplateType(type)) return [];

        const id = el.getAttribute('id')?.trim() || genId();
        const title = el.getAttribute('title')?.trim() || id;
        const group = el.getAttribute('group')?.trim() || undefined;
        const content = el.innerHTML.trim();

        return type === 'container'
            ? parseContainerTemplate(id, title, group, content)
            : parseBlockTemplate(id, title, group, content);
    });
}
