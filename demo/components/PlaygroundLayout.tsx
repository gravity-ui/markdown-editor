import {StrictMode, useEffect} from 'react';

import {useUpdate} from 'react-use';

import type {MarkdownEditorInstance} from 'src/index';
import {VERSION} from 'src/version';

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
    view: RenderFn;
    viewHeight?: React.CSSProperties['height'];
    actions?: RenderFn;
    style?: React.CSSProperties;
};

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = function PlaygroundLayout(props) {
    const {editor} = props;

    const forceRender = useUpdate();
    const mdMarkup = useMarkdownEditorValue(editor);

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

            <StrictMode>
                <div className={b('editor')} style={{height: props.viewHeight ?? 'initial'}}>
                    {props.view({className: b('editor-view')})}

                    <WysiwygDevTools editor={editor} />
                    <WysiwygSelection editor={editor} className={b('pm-selection')} />
                </div>
            </StrictMode>

            <hr />

            <div className={b('preview')}>
                {editor.currentMode === 'wysiwyg' && <pre className={b('markup')}>{mdMarkup}</pre>}
            </div>
        </div>
    );
};
