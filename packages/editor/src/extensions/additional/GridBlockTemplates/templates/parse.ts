import {v4 as uuidv4} from 'uuid';

import type {
    GridBlockBlockTemplate,
    GridBlockContainerTemplate,
    GridBlockTemplate,
    GridBlockTemplateBlock,
    GridBlockTemplateType,
} from '../types';

const genId = () => 'grid-block-template-' + uuidv4();

const isTemplateType = (value: string | null): value is GridBlockTemplateType =>
    value === 'block' || value === 'container';

const parseHtml = (value: string): Document | null => {
    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') return null;
    return new DOMParser().parseFromString(value, 'text/html');
};

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

const consumeElements = (elements: Element[]) => {
    elements.forEach((element) => element.remove());

    return elements;
};

const consumeStyleCss = (node: ParentNode) =>
    joinCss(
        ...consumeElements(Array.from(node.querySelectorAll('style'))).map((style) =>
            normalizeStyleCss(style.textContent ?? ''),
        ),
    );

const createTemplateFragment = (content: string): DocumentFragment | null => {
    const doc = parseHtml(`<template>${content}</template>`);
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
    if (!fragment) return {css: '', html: content};

    const css = consumeStyleCss(fragment);
    const html = getFragmentHtml(fragment);

    return {css, html};
};

export const parseTemplateBlock = (content: string): GridBlockTemplateBlock => {
    const {css, html} = getTemplateParts(content);

    return {
        css,
        content: html,
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
    const {css, html} = getTemplateParts(content);
    const doc = parseHtml(html);
    const root = doc?.body.firstElementChild ?? null;
    const children = root ? Array.from(root.children) : [];

    return {
        id,
        title,
        group,
        type: 'container',
        content,
        containerCss: css,
        blocks: children.map((child) => ({
            css: '',
            content: child.innerHTML.trim(),
        })),
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

    const doc = parseHtml(value);
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
