import {useEffect} from 'react';

import {BaseNode, MarkdownEditorView, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {toaster} from '../../utils/toaster';

import {
    EditorInEditorAttr,
    editorInEditorNodeName,
    EditorInEditor as extension,
} from './EditorInEditorExtension';

export const EditorInEditor: React.FC = () => {
    const editor = useMarkdownEditor({
        md: {
            html: false,
            linkify: true,
            breaks: true,
        },
        initial: {
            mode: 'wysiwyg',
            toolbarVisible: true,
        },
        wysiwygConfig: {
            extensions: (builder) =>
                builder.use(extension, {
                    toaster,
                }),
        },
    });

    useEffect(() => {
        const view = editor._wysiwygView;
        if (view) {
            const {schema} = view.state;
            const tr = view.state.tr;
            tr.insert(0, [
                schema.node(BaseNode.Paragraph, null, schema.text('This is for development only')),
                schema.node(editorInEditorNodeName, {
                    [EditorInEditorAttr.Markup]: 'Editor-in-Editor content',
                }),
                schema.node(BaseNode.Paragraph, null, schema.text('After editor')),
            ]);
            view.dispatch(tr);
        }
    }, []);

    return (
        <PlaygroundLayout
            editor={editor}
            title="Editor In Editor Playground"
            view={({className}) => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    toaster={toaster}
                    className={className}
                />
            )}
        />
    );
};
