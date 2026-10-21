import {beforeEach, describe, expect, it} from 'vitest';

import {
    YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY,
    mergeTemplatesById,
    readStoredTemplates,
    saveTemplates,
} from './storage';
import type {HtmlTemplate} from './types';

const tpl = (id: string, title = id, content = `<div>${id}</div>`): HtmlTemplate => ({
    id,
    title,
    content,
});

beforeEach(() => {
    window.localStorage.clear();
});

describe('mergeTemplatesById', () => {
    it('should keep order and override duplicates with the later source', () => {
        const result = mergeTemplatesById([tpl('a', 'option a'), tpl('b')], [tpl('a', 'stored a')]);

        expect(result).toEqual([tpl('a', 'stored a'), tpl('b')]);
    });
});

describe('readStoredTemplates', () => {
    it('should return an empty array when nothing is stored', () => {
        expect(readStoredTemplates()).toEqual([]);
    });

    it('should ignore malformed json', () => {
        window.localStorage.setItem(YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY, '{not json');
        expect(readStoredTemplates()).toEqual([]);
    });

    it('should filter out entries with the wrong shape', () => {
        window.localStorage.setItem(
            YFM_HTML_BLOCK_TEMPLATES_STORAGE_KEY,
            JSON.stringify([tpl('a'), {id: 'b'}, 42]),
        );
        expect(readStoredTemplates()).toEqual([tpl('a')]);
    });
});

describe('saveTemplates', () => {
    it('should persist templates and merge by id across calls', () => {
        saveTemplates([tpl('a', 'first')]);
        const result = saveTemplates([tpl('a', 'second'), tpl('b')]);

        expect(result).toEqual([tpl('a', 'second'), tpl('b')]);
        expect(readStoredTemplates()).toEqual([tpl('a', 'second'), tpl('b')]);
    });
});
