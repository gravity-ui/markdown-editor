/**
 * @jest-environment jsdom
 */

import {EditorView} from 'prosemirror-view';
import {schema} from 'prosemirror-test-builder';
import {EditorState} from 'prosemirror-state';

import {bindActions} from './actions';

describe('bindActions', () => {
    it('should bind actions', () => {
        const view = new EditorView(null, {
            state: EditorState.create({schema}),
        });

        const action1 = 'action1';
        const action2 = 'action2';

        const isActive1 = jest.fn((_a1) => false);
        const isEnable1 = jest.fn((_a1) => true);
        const run1 = jest.fn((_a1, _a2, _a3, _a4) => {});

        const actions = bindActions<string>({
            [action1]: {
                isActive: isActive1,
                isEnable: isEnable1,
                run: run1,
            },
            [action2]: {
                isActive: jest.fn((_a1) => true),
                isEnable: jest.fn((_a1) => false),
                run: jest.fn((_a1, _a2, _a3, _a4) => {}),
            },
        })(view);

        expect(action1 in actions).toBe(true);
        expect(action2 in actions).toBe(true);

        expect(actions[action1].isActive()).toBe(false);
        expect(actions[action1].isEnable()).toBe(true);

        expect(run1.mock.calls.length).toBe(0);
        expect(isActive1.mock.calls.length).toBe(1);
        expect(isEnable1.mock.calls.length).toBe(1);
        expect(isActive1.mock.calls[0][0] instanceof EditorState).toBe(true);
        expect(isEnable1.mock.calls[0][0] instanceof EditorState).toBe(true);

        actions.action1.run(
            // @ts-expect-error
            'test',
        );
        expect(run1.mock.calls.length).toBe(1);
        expect(run1.mock.calls[0][0] instanceof EditorState).toBe(true);
        expect(typeof run1.mock.calls[0][1] === 'function').toBe(true);
        expect(run1.mock.calls[0][2] instanceof EditorView).toBe(true);
        expect(run1.mock.calls[0][3]).toBe('test');
    });
});
