import {AllSelection} from 'prosemirror-state';

import {DataTransferMock} from '../../tests/event-mock';
import {ReactRenderStorage} from '../extensions';
import {Logger2} from '../logger';
import type {ResourceReplacementConfig} from '../modules/resource-replacement';
import {DirectiveSyntaxContext} from '../utils/directive';

import {EditorImpl} from './Editor';
import {BundlePreset} from './wysiwyg-preset';

type Mode = 'wysiwyg' | 'markup';
type Resolve = NonNullable<ResourceReplacementConfig['resolve']>;
const sourceType = 'application/x-markdown-editor-source';
const sourceMarkup = '![label](/old.png)';
const flush = async () => {
    for (let i = 0; i < 5; i++) await Promise.resolve();
};

function createEditor(resolve?: ResourceReplacementConfig['resolve']) {
    return new EditorImpl({
        logger: new Logger2(),
        renderStorage: new ReactRenderStorage(),
        preset: 'full',
        directiveSyntax: new DirectiveSyntaxContext('enabled'),
        pmTransformers: [],
        initial: {markup: sourceMarkup},
        resourceReplacement: resolve && {
            resources: {image: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'}},
            triggers: ['paste'],
            resolve,
        },
        wysiwygConfig: {
            extensions: (builder) =>
                builder.use(BundlePreset, {
                    preset: 'full',
                    searchPanel: false,
                    directiveSyntax: new DirectiveSyntaxContext('enabled'),
                    reactRenderer: new ReactRenderStorage(),
                }),
        },
    });
}

function contentDOM(editor: EditorImpl, mode: Mode) {
    return mode === 'wysiwyg' ? editor.wysiwygEditor.dom : editor.markupEditor.cm.contentDOM;
}

function sendClipboardEvent(dom: HTMLElement, type: string, clipboardData: DataTransfer) {
    const event = new Event(type, {bubbles: true, cancelable: true});
    Object.defineProperty(event, 'clipboardData', {value: clipboardData});
    dom.dispatchEvent(event);
    return event;
}

function copy(editor: EditorImpl, mode: Mode, type: 'copy' | 'cut' = 'copy') {
    if (mode === 'wysiwyg') {
        const view = editor.wysiwygEditor.view;
        view.dispatch(view.state.tr.setSelection(new AllSelection(view.state.doc)));
    } else {
        const view = editor.markupEditor.cm;
        view.dispatch({selection: {anchor: 0, head: view.state.doc.length}});
    }
    const data = new DataTransferMock();
    expect(sendClipboardEvent(contentDOM(editor, mode), type, data).defaultPrevented).toBe(true);
    expect(data.types).toContain('text/plain');
    // An image-only PM selection has no plain text, but retains its Markdown representation.
    expect(data.getData(mode === 'wysiwyg' ? 'text/yfm' : 'text/plain')).not.toBe('');
    return data;
}

const modes: Mode[] = ['wysiwyg', 'markup'];
const cases = modes.flatMap((from) =>
    modes.flatMap((to) =>
        (['copy', 'cut'] as const).flatMap((event) =>
            [true, false].map((sameEditor) => ({from, to, event, sameEditor})),
        ),
    ),
);

test.each(cases)(
    '$event $from → $to, sameEditor=$sameEditor',
    async ({from, to, event, sameEditor}) => {
        const resolve = jest.fn<ReturnType<Resolve>, Parameters<Resolve>>(async (resources) => ({
            replacements: resources.map((resource) => ({
                kind: resource.kind,
                oldValue: resource.value,
                newValue: '/new.png',
            })),
        }));
        const source = createEditor(sameEditor ? resolve : undefined);
        const target = sameEditor ? source : createEditor(resolve);
        try {
            const data = copy(source, from, event);
            expect(data.getData(sourceType)).toBe('');
            sendClipboardEvent(contentDOM(target, to), 'paste', data);
            expect(resolve).toHaveBeenCalledTimes(1);
            expect(resolve.mock.calls[0][1]).not.toHaveProperty('source');
            await flush();
            const value =
                to === 'wysiwyg' ? target.wysiwygEditor.getValue() : target.markupEditor.getValue();
            expect(value).toContain('/new.png');
        } finally {
            target.destroy();
            if (source !== target) source.destroy();
        }
    },
);
