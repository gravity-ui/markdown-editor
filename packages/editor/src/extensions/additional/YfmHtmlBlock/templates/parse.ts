import {v4 as uuidv4} from 'uuid';

import type {HtmlTemplate} from './types';

const genId = () => 'yfm-html-template-' + uuidv4();

/**
 * Parses one or more `<template id="..." title="...">…</template>` blocks.
 * When the input has no `<template>` tag, the whole string is treated as a single template.
 */
export function parseTemplates(input: string): HtmlTemplate[] {
    const value = input.trim();
    if (!value) return [];

    if (typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
        return [{id: genId(), title: genId(), content: value}];
    }

    const doc = new DOMParser().parseFromString(value, 'text/html');
    const templates = Array.from(doc.querySelectorAll('template'));

    if (templates.length === 0) {
        return [{id: genId(), title: value.slice(0, 40), content: value}];
    }

    return templates.map((el) => {
        const id = el.getAttribute('id')?.trim() || genId();
        const title = el.getAttribute('title')?.trim() || id;
        return {id, title, content: el.innerHTML.trim()};
    });
}
