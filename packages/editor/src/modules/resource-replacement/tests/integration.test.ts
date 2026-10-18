import {history as cmHistory, redo as cmRedo, undo as cmUndo} from '@codemirror/commands';
import {EditorView as CMView} from '@codemirror/view';
import {FILE_TOKEN} from '@diplodoc/file-extension';
import {expect, test, vi} from 'vitest';

import {BundlePreset} from '../../../bundle/wysiwyg-preset';
import {createEditorExtensionsManager} from '../../../core/createEditorExtensionsManager';
import {ReactRenderStorage} from '../../../extensions';
import {codeMirrorResourceReplacement} from '../../../markup/codemirror/resource-replacement-plugin';
import {DirectiveSyntaxContext} from '../../../utils/directive';
import {ResourceReplacementController} from '../controller';
import type {ResourceReplacementResult} from '../types';

const flush = async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
};
const result = (
    oldValue = '/old.png',
    newValue = '/new.png',
    kind = 'image',
): ResourceReplacementResult => ({replacements: [{kind, oldValue, newValue}]});

test('CodeMirror standalone precomputation is pure and raw commands respect the busy lock', async () => {
    const callback = vi.fn(
        () =>
            new Promise<ResourceReplacementResult>((resolve) => {
                complete = resolve;
            }),
    );
    let complete!: (result: ResourceReplacementResult) => void;
    const controller = new ResourceReplacementController({resolve: callback});
    const {markupParser: parser, serializer} = createEditorExtensionsManager({
        extensions: (builder) => {
            builder.use(BundlePreset, {
                preset: 'full',
                searchPanel: false,
                directiveSyntax: new DirectiveSyntaxContext('enabled'),
                reactRenderer: new ReactRenderStorage(),
            });
            builder.overrideNodeSpec('image', (spec) => ({
                ...spec,
                _resource: {kind: 'image', valueAttribute: 'src', nameAttribute: 'alt'},
            }));
            builder.overrideNodeSpec(FILE_TOKEN, (spec) => ({
                ...spec,
                _resource: {kind: 'file', valueAttribute: 'href', nameAttribute: 'download'},
            }));
        },
    }).buildDeps();
    const view = new CMView({
        doc: 'before',
        extensions: [
            cmHistory(),
            codeMirrorResourceReplacement({
                parser,
                serializer,
                controller,
                shouldProcessTransaction: (tr) => tr.isUserEvent('input.paste'),
            }),
        ],
    });
    try {
        const tr = view.state.update({
            changes: {from: 0, to: 6, insert: '![B](/old.png)'},
            userEvent: 'input.paste',
        });
        expect(tr.state.doc.toString()).toContain('/old.png');
        expect(callback).not.toHaveBeenCalled();
        view.dispatch(tr);
        expect(callback).toHaveBeenCalledTimes(1);
        cmUndo(view);
        expect(view.state.doc.toString()).toContain('/old.png');
        complete(result());
        await flush();
        cmUndo(view);
        expect(view.state.doc.toString()).toBe('![B](/old.png)');
        cmRedo(view);
        expect(view.state.doc.toString()).toBe('![B](/new.png)');
    } finally {
        controller.destroy();
        view.destroy();
    }
});
