import type {HtmlConstructorTemplate} from '../types';

import {
    YFM_HTML_CONSTRUCTOR_STORAGE_KEY,
    clearStoredTemplates,
    mergeTemplatesById,
    readStoredTemplates,
    saveTemplates,
} from './storage';

const settings = {
    hasBackground: false,
    hasRound: false,
    hasBorder: false,
    hasTextColor: false,
    hasDelete: false,
    hasRaw: false,
    preset: 'default' as const,
};

const familyTpl = (id: string, title = id): HtmlConstructorTemplate => ({
    id,
    title,
    type: 'family',
    declarationIndex: 0,
});

const structureTpl = (id: string, title = id, family?: string): HtmlConstructorTemplate => ({
    id,
    title,
    family,
    type: 'structure',
    declarationIndex: 1,
    priority: 0,
    settings,
    styles: ['.g-md-hc-structure { display: grid; }'],
    content: `<section>${id}</section>`,
});

const blockTpl = (id: string, title = id, family?: string): HtmlConstructorTemplate => ({
    id,
    title,
    family,
    type: 'block',
    declarationIndex: 2,
    priority: 0,
    settings,
    styles: ['& { padding: 1px; }'],
    content: `<div>${id}</div>`,
});

const themeTpl = (id: string, title = id, family?: string): HtmlConstructorTemplate => ({
    id,
    title,
    family,
    type: 'theme',
    declarationIndex: 3,
    priority: 0,
    styles: ['.g-md-hc-block { color: red; }'],
});

beforeEach(() => {
    window.localStorage.clear();
});

describe('mergeTemplatesById', () => {
    it('keeps order and overrides duplicates with the later source', () => {
        const result = mergeTemplatesById(
            [blockTpl('a', 'option a'), structureTpl('b')],
            [blockTpl('a', 'stored a')],
        );

        expect(result).toEqual([blockTpl('a', 'stored a'), structureTpl('b')]);
    });
});

describe('readStoredTemplates', () => {
    it('returns an empty array when nothing is stored', () => {
        expect(readStoredTemplates()).toEqual([]);
    });

    it('ignores malformed json', () => {
        window.localStorage.setItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY, '{not json');
        expect(readStoredTemplates()).toEqual([]);
    });

    it('filters out entries with the wrong shape', () => {
        window.localStorage.setItem(
            YFM_HTML_CONSTRUCTOR_STORAGE_KEY,
            JSON.stringify([
                familyTpl('family', 'Family'),
                structureTpl('structure', 'Structure', 'family'),
                blockTpl('block', 'Block', 'family'),
                themeTpl('theme', 'Theme', 'family'),
                {id: 'missing-type', title: 'Missing type', content: '<div />'},
                {id: 'wrong-type', title: 'Wrong type', type: 'section', content: '<div />'},
                {...blockTpl('bad-styles'), styles: [1]},
                {...structureTpl('bad-settings'), settings: {preset: 'default'}},
                {...themeTpl('bad-priority'), priority: Number.NaN},
            ]),
        );

        expect(readStoredTemplates()).toEqual([
            familyTpl('family', 'Family'),
            structureTpl('structure', 'Structure', 'family'),
            blockTpl('block', 'Block', 'family'),
            themeTpl('theme', 'Theme', 'family'),
        ]);
    });
});

describe('saveTemplates', () => {
    it('persists templates and merges by id across calls', () => {
        saveTemplates([blockTpl('a', 'first')]);
        const result = saveTemplates([blockTpl('a', 'second'), structureTpl('b')]);

        expect(result).toEqual([blockTpl('a', 'second'), structureTpl('b')]);
        expect(readStoredTemplates()).toEqual([blockTpl('a', 'second'), structureTpl('b')]);
    });
});

describe('clearStoredTemplates', () => {
    it('removes saved templates from localStorage', () => {
        saveTemplates([blockTpl('a'), structureTpl('b')]);

        expect(clearStoredTemplates()).toEqual([]);
        expect(readStoredTemplates()).toEqual([]);
        expect(window.localStorage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY)).toBeNull();
    });
});
