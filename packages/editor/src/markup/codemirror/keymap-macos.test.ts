import type {EditorView} from '@codemirror/view';

import type {ReactRenderStorage as ReactRenderStorageClass} from '../../extensions';
import type {Logger2 as Logger2Class} from '../../logger';
import type {DirectiveSyntaxContext as DirectiveSyntaxContextClass} from '../../utils/directive';

import type {createCodemirror as createCodemirrorFn} from './create';

// @codemirror/view and w3c-keyname both read navigator.platform once, at module evaluation time,
// to decide how a key combination is resolved. It has to be stubbed before the module graph is
// loaded, hence the explicit requires below instead of top-level imports.
Object.defineProperty(window.navigator, 'platform', {value: 'MacIntel', configurable: true});

/* eslint-disable @typescript-eslint/no-var-requires */
const ReactRenderStorage: typeof ReactRenderStorageClass =
    require('../../extensions').ReactRenderStorage;
const Logger2: typeof Logger2Class = require('../../logger').Logger2;
const DirectiveSyntaxContext: typeof DirectiveSyntaxContextClass =
    require('../../utils/directive').DirectiveSyntaxContext;

const createCodemirror: typeof createCodemirrorFn = require('./create').createCodemirror;
/* eslint-enable @typescript-eslint/no-var-requires */

function createView(doc: string): EditorView {
    return createCodemirror({
        doc,
        placeholder: '',
        logger: new Logger2(),
        onCancel: () => undefined,
        onSubmit: () => undefined,
        onChange: () => undefined,
        onDocChange: () => undefined,
        onScroll: () => undefined,
        reactRenderer: new ReactRenderStorage(),
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        preserveEmptyRows: false,
        searchPanel: false,
    });
}

describe('markup editor keymap on macOS', () => {
    it('should leave Opt+Shift+A to the browser: it types "Å" on macOS layouts', () => {
        const view = createView('text');
        view.focus();

        // macOS reports the composed character in event.key, so CodeMirror resolves Alt
        // combinations by key code instead. That turns this event into the "Alt-A" binding of
        // defaultKeymap (toggleBlockComment) and inserts an HTML comment over the character.
        const event = new KeyboardEvent('keydown', {
            key: 'Å',
            code: 'KeyA',
            keyCode: 65,
            altKey: true,
            shiftKey: true,
            bubbles: true,
            cancelable: true,
        });

        view.contentDOM.dispatchEvent(event);

        expect(view.state.sliceDoc()).toBe('text');
        expect(event.defaultPrevented).toBe(false);

        view.destroy();
    });
});
