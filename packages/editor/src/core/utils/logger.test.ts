import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {describe, expect, it, vi} from 'vitest';

import type {Logger2} from '../../logger';

import {LoggerFacet, getLoggerFromState} from './logger';

const schema = new Schema({
    nodes: {
        doc: {content: 'block+'},
        paragraph: {content: 'inline*', group: 'block'},
        text: {group: 'inline'},
    },
    marks: {},
});

const mockLogger: Logger2.ILogger = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    event: vi.fn(),
    action: vi.fn(),
    metrics: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    nested: vi.fn().mockReturnThis(),
};

describe('getLoggerFromState', () => {
    it('returns the logger when LoggerFacet plugin is present', () => {
        const state = EditorState.create({schema, plugins: [LoggerFacet.of(mockLogger)]});
        expect(getLoggerFromState(state)).toBe(mockLogger);
    });

    it('returns undefined when LoggerFacet plugin is absent', () => {
        const state = EditorState.create({schema});
        expect(getLoggerFromState(state)).toBeUndefined();
    });
});
