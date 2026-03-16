import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';

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
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    event: jest.fn(),
    action: jest.fn(),
    metrics: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    nested: jest.fn().mockReturnThis(),
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
