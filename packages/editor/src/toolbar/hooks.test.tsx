import {type Root, createRoot} from 'react-dom/client';
import {act} from 'react-dom/test-utils';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';

import {EventEmitter} from 'src/utils/event-emitter';

import {type ToolbarEvents, ToolbarProvider} from './context';
import {type ToolbarAction, type UseActionStateReturn, useActionState} from './hooks';

type Editor = {active: boolean; enabled: boolean};

const action: ToolbarAction<Editor> = {
    isActive: (editor) => editor.active,
    isEnable: (editor) => editor.enabled,
};

describe('useActionState', () => {
    let root: Root;
    let rendered: {editor: Editor; state: UseActionStateReturn}[];
    const eventBus = new EventEmitter<ToolbarEvents>();

    function Probe({editor}: {editor: Editor}) {
        rendered.push({editor, state: useActionState(editor, action)});
        return null;
    }

    function render(editor: Editor) {
        act(() => {
            root.render(
                <ToolbarProvider value={{editor, eventBus}}>
                    <Probe editor={editor} />
                </ToolbarProvider>,
            );
        });
    }

    beforeEach(() => {
        (globalThis as {IS_REACT_ACT_ENVIRONMENT?: boolean}).IS_REACT_ACT_ENVIRONMENT = true;
        rendered = [];
        root = createRoot(document.createElement('div'));
    });

    afterEach(() => {
        act(() => root.unmount());
    });

    it('should render the editor state on the first render', () => {
        render({active: true, enabled: false});

        expect(rendered[0].state).toEqual({active: true, enabled: false});
    });

    it('should render the new editor state on the first render after a change', () => {
        render({active: false, enabled: true});
        rendered = [];
        const editor = {active: true, enabled: false};
        render(editor);

        expect(rendered[0]).toEqual({editor, state: {active: true, enabled: false}});
    });

    it('should rerender with the new state on an update event', () => {
        const editor = {active: false, enabled: true};
        render(editor);
        editor.active = true;
        act(() => eventBus.emit('update', null));

        expect(rendered.at(-1)?.state).toEqual({active: true, enabled: true});
    });
});
