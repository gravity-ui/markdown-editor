import {StrictMode, useEffect} from 'react';

import type {MarkdownEditorInstance} from '@gravity-ui/markdown-editor';
import {VERSION} from '@gravity-ui/markdown-editor/_/version.js';
import {useUpdate} from 'react-use';

import {useEditorHandle} from '../hooks/useEditorHandle';
import {useMarkdownEditorValue} from '../hooks/useMarkdownEditorValue';
import {block} from '../utils/cn';

import {WysiwygSelection} from './PMSelection';
import {WysiwygDevTools} from './ProseMirrorDevTools';

import './Playground.scss';

export const b = block('playground');

export type RenderFn = (props: {className?: string}) => React.ReactNode;

export type PlaygroundLayoutProps = {
    title?: string;
    editor: MarkdownEditorInstance;
    devTools?: boolean;
    view: RenderFn;
    viewHeight?: React.CSSProperties['height'];
    viewWidth?: React.CSSProperties['width'];
    actions?: RenderFn;
    style?: React.CSSProperties;
};

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = function PlaygroundLayout(props) {
    const {editor, devTools = true} = props;

    const forceRender = useUpdate();
    const mdMarkup = useMarkdownEditorValue(editor);

    useEditorHandle(editor);

    useEffect(() => {
        editor.on('change-editor-mode', forceRender);
        return () => {
            editor.off('change-editor-mode', forceRender);
        };
    }, [editor, forceRender]);

    return (
        <div className={b()} style={props.style}>
            <div className={b('header')}>
                {props.title ?? 'Markdown Editor Playground'}
                <span className={b('version')}>{VERSION}</span>
            </div>

            <div className={b('actions')}>{props.actions?.({})}</div>

            <hr />
            <div className={b('editor-markup')}>
                <StrictMode>
                    <div
                        className={b('editor')}
                        style={{
                            height: props.viewHeight ?? 'initial',
                            width: props.viewWidth ?? 'initial',
                        }}
                    >
                        {props.view({className: b('editor-view')})}

                        {devTools && <WysiwygDevTools editor={editor} />}
                        <WysiwygSelection editor={editor} className={b('pm-selection')} />
                    </div>
                </StrictMode>

                <hr />

                <div className={b('preview')} style={{width: props.viewWidth ?? 'initial'}}>
                    {editor.currentMode === 'wysiwyg' && (
                        <pre className={b('markup')}>{mdMarkup}</pre>
                    )}
                </div>
            </div>
        </div>
    );
};
