import React, {useEffect, useRef} from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {BaseNode} from '../../src';
import {YfmEditor, YfmEditorRef} from '../../src/bundle';
import {VERSION} from '../../src/version';
import {block} from '../cn';

import {
    EditorInEditor,
    EditorInEditorAttr,
    editorInEditorNodeName,
} from './EditorInEditorExtension';

const b = block('playground');

export const PlaygroundEditorInEditor: React.FC = () => {
    const editorRef = useRef<YfmEditorRef>(null);

    useEffect(() => {
        if (editorRef.current) {
            const view = editorRef.current._wysiwygView;
            if (view) {
                const {schema} = view.state;
                const tr = view.state.tr;
                tr.insert(0, [
                    schema.node(
                        BaseNode.Paragraph,
                        null,
                        schema.text('This is for development only'),
                    ),
                    schema.node(editorInEditorNodeName, {
                        [EditorInEditorAttr.Markup]: 'Editor-in-Editor content',
                    }),
                    schema.node(BaseNode.Paragraph, null, schema.text('After editor')),
                ]);
                view.dispatch(tr);
            }
        }
    }, []);

    return (
        <div className={b()}>
            <div className={b('header')}>
                Markdown Editor Playground
                <span className={b('version')}>{VERSION}</span>
            </div>
            <hr />
            <div className={b('editor')}>
                <YfmEditor
                    ref={editorRef}
                    toaster={toaster}
                    className={b('editor-view')}
                    initialContent={''}
                    initialEditorType={'wysiwyg'}
                    wysiwygAllowHTML={false}
                    wysiwygLinkify={true}
                    wysiwygBreaks={true}
                    settingsVisible={false}
                    extensionOptions={{}}
                    wysiwygExtraExtensions={(builder) =>
                        builder.use(EditorInEditor, {
                            toaster,
                        })
                    }
                />
            </div>
        </div>
    );
};
