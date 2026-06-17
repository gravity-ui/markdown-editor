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

const getStyle = (element: Element | null) =>
    element instanceof HTMLElement ? element.getAttribute('style')?.trim() || '' : '';

export const parseTemplateBlock = (content: string): GridBlockTemplateBlock => {
    const doc = parseHtml(content);
    const root = doc?.body.firstElementChild ?? null;

    if (!root) {
        return {css: '', content};
    }

    return {
        css: getStyle(root),
        content: root.innerHTML.trim(),
    };
};

const parseContainerTemplate = (
    id: string,
    title: string,
    content: string,
): GridBlockContainerTemplate => {
    const doc = parseHtml(content);
    const root = doc?.body.firstElementChild ?? null;
    const children = root ? Array.from(root.children) : [];

    return {
        id,
        title,
        type: 'container',
        content,
        containerCss: getStyle(root),
        blocks: children.map((child) => ({
            css: getStyle(child),
            content: child.innerHTML.trim(),
        })),
    };
};

const parseBlockTemplate = (
    id: string,
    title: string,
    content: string,
): GridBlockBlockTemplate => ({
    id,
    title,
    type: 'block',
    content,
    block: parseTemplateBlock(content),
});

/**
 * Parses one or more `<template id="..." title="..." type="block|container">...</template>`
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
        const content = el.innerHTML.trim();

        return type === 'container'
            ? parseContainerTemplate(id, title, content)
            : parseBlockTemplate(id, title, content);
    });
}
