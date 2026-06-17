import type {GridBlockTemplate} from '../types';

import {
    GRID_BLOCK_TEMPLATES_STORAGE_KEY,
    clearStoredTemplates,
    mergeTemplatesById,
    readStoredTemplates,
    saveTemplates,
} from './storage';

const blockTpl = (id: string, title = id): GridBlockTemplate => ({
    id,
    title,
    type: 'block',
    content: `<div>${id}</div>`,
    block: {css: 'padding:1px', content: id},
});

const containerTpl = (id: string, title = id): GridBlockTemplate => ({
    id,
    title,
    type: 'container',
    content: `<div><div>${id}</div></div>`,
    containerCss: 'display:grid',
    blocks: [{css: 'padding:1px', content: id}],
});

beforeEach(() => {
    window.localStorage.clear();
});

describe('mergeTemplatesById', () => {
    it('keeps order and overrides duplicates with the later source', () => {
        const result = mergeTemplatesById(
            [blockTpl('a', 'option a'), containerTpl('b')],
            [blockTpl('a', 'stored a')],
        );

        expect(result).toEqual([blockTpl('a', 'stored a'), containerTpl('b')]);
    });
});

describe('readStoredTemplates', () => {
    it('returns an empty array when nothing is stored', () => {
        expect(readStoredTemplates()).toEqual([]);
    });

    it('ignores malformed json', () => {
        window.localStorage.setItem(GRID_BLOCK_TEMPLATES_STORAGE_KEY, '{not json');
        expect(readStoredTemplates()).toEqual([]);
    });

    it('filters out entries with the wrong shape', () => {
        window.localStorage.setItem(
            GRID_BLOCK_TEMPLATES_STORAGE_KEY,
            JSON.stringify([
                blockTpl('a'),
                containerTpl('b'),
                {id: 'missing-type', title: 'Missing type', content: '<div />'},
                {id: 'wrong-type', title: 'Wrong type', type: 'section', content: '<div />'},
                {id: 'bad-block', title: 'Bad block', type: 'block', content: '<div />'},
                {
                    id: 'bad-container',
                    title: 'Bad container',
                    type: 'container',
                    content: '<div />',
                    containerCss: '',
                    blocks: [{css: 1, content: 'x'}],
                },
            ]),
        );

        expect(readStoredTemplates()).toEqual([blockTpl('a'), containerTpl('b')]);
    });
});

describe('saveTemplates', () => {
    it('persists templates and merges by id across calls', () => {
        saveTemplates([blockTpl('a', 'first')]);
        const result = saveTemplates([blockTpl('a', 'second'), containerTpl('b')]);

        expect(result).toEqual([blockTpl('a', 'second'), containerTpl('b')]);
        expect(readStoredTemplates()).toEqual([blockTpl('a', 'second'), containerTpl('b')]);
    });
});

describe('clearStoredTemplates', () => {
    it('removes saved templates from localStorage', () => {
        saveTemplates([blockTpl('a'), containerTpl('b')]);

        expect(clearStoredTemplates()).toEqual([]);
        expect(readStoredTemplates()).toEqual([]);
        expect(window.localStorage.getItem(GRID_BLOCK_TEMPLATES_STORAGE_KEY)).toBeNull();
    });
});
