import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {HtmlConstructorTemplate} from '../types';

import {
    YFM_HTML_CONSTRUCTOR_STORAGE_KEY,
    clearStoredTemplates,
    mergeTemplatesById,
    readStoredTemplates,
    saveTemplates,
    subscribeStoredTemplates,
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
    styles: [],
    content: '',
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
    vi.restoreAllMocks();
    window.localStorage.clear();
    clearStoredTemplates();
});

afterEach(() => vi.restoreAllMocks());

describe('mergeTemplatesById', () => {
    it('should keep order and override duplicates with the later source', () => {
        const result = mergeTemplatesById(
            [blockTpl('a', 'option a'), structureTpl('b')],
            [blockTpl('a', 'stored a')],
        );

        expect(result).toEqual([blockTpl('a', 'stored a'), structureTpl('b')]);
    });
});

describe('readStoredTemplates', () => {
    it('should return an empty array when nothing is stored', () => {
        expect(readStoredTemplates()).toEqual([]);
    });

    it('should ignore malformed json', () => {
        window.localStorage.setItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY, '{not json');
        expect(readStoredTemplates()).toEqual([]);
    });

    it('should filter out entries with the wrong shape', () => {
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
    it('should persist templates and merge by id across calls', () => {
        saveTemplates([blockTpl('a', 'first')]);
        const result = saveTemplates([blockTpl('a', 'second'), structureTpl('b')]);

        expect(result).toEqual([blockTpl('a', 'second'), structureTpl('b')]);
        expect(readStoredTemplates()).toEqual([blockTpl('a', 'second'), structureTpl('b')]);
    });

    it('should keep successive imports in memory when writes fail, then persist on retry', () => {
        saveTemplates([blockTpl('stored')]);
        const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('Storage is full', 'QuotaExceededError');
        });

        saveTemplates([blockTpl('first')]);
        saveTemplates([blockTpl('second')]);

        const expected = [blockTpl('stored'), blockTpl('first'), blockTpl('second')];
        expect(readStoredTemplates()).toEqual(expected);
        write.mockRestore();
        saveTemplates([]);
        expect(JSON.parse(window.localStorage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY)!)).toEqual(
            expected,
        );
    });

    it('should share templates even when access to localStorage is denied', () => {
        vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
            throw new DOMException('Storage is blocked', 'SecurityError');
        });

        saveTemplates([blockTpl('first')]);
        saveTemplates([blockTpl('second')]);

        expect(readStoredTemplates()).toEqual([blockTpl('first'), blockTpl('second')]);
    });
});

describe('clearStoredTemplates', () => {
    it('should remove saved templates from localStorage', () => {
        saveTemplates([blockTpl('a'), structureTpl('b')]);

        expect(clearStoredTemplates()).toEqual([]);
        expect(readStoredTemplates()).toEqual([]);
        expect(window.localStorage.getItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY)).toBeNull();
    });

    it('should not resurrect cleared templates when removing persisted data fails', () => {
        saveTemplates([blockTpl('old')]);
        vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
            throw new DOMException('Storage is blocked', 'SecurityError');
        });

        clearStoredTemplates();

        expect(readStoredTemplates()).toEqual([]);
        expect(saveTemplates([blockTpl('new')])).toEqual([blockTpl('new')]);
    });
});

describe('template subscriptions', () => {
    it('should notify all active subscribers on import and clear', () => {
        const first = vi.fn();
        const second = vi.fn();
        const unsubscribeFirst = subscribeStoredTemplates(first);
        const unsubscribeSecond = subscribeStoredTemplates(second);

        try {
            saveTemplates([blockTpl('shared')]);
            expect(first).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenCalledTimes(1);
            unsubscribeFirst();
            clearStoredTemplates();
            expect(first).toHaveBeenCalledTimes(1);
            expect(second).toHaveBeenCalledTimes(2);
        } finally {
            unsubscribeFirst();
            unsubscribeSecond();
        }
    });

    it('should refresh templates after another tab saves or clears localStorage', () => {
        const listener = vi.fn();
        const unsubscribe = subscribeStoredTemplates(listener);

        try {
            const value = JSON.stringify([blockTpl('other-tab')]);
            window.localStorage.setItem(YFM_HTML_CONSTRUCTOR_STORAGE_KEY, value);
            window.dispatchEvent(
                new StorageEvent('storage', {
                    key: YFM_HTML_CONSTRUCTOR_STORAGE_KEY,
                    newValue: value,
                    storageArea: window.localStorage,
                }),
            );
            expect(readStoredTemplates()).toEqual([blockTpl('other-tab')]);
            expect(listener).toHaveBeenCalledTimes(1);

            window.localStorage.clear();
            window.dispatchEvent(new StorageEvent('storage', {key: null}));
            expect(readStoredTemplates()).toEqual([]);
            expect(listener).toHaveBeenCalledTimes(2);
        } finally {
            unsubscribe();
        }
    });
});
