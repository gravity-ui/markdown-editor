import React from 'react';

import {ClassNameProps, cn} from '../classname';
import {ReactRendererComponent} from '../extensions';
import {logger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import type {EditorInt} from './Editor';
import {ToolbarView} from './ToolbarView';
import {WysiwygEditorComponent} from './WysiwygEditorComponent';
import type {WToolbarData, WToolbarItemData} from './config/wysiwyg';

import './WysiwygEditorView.scss';

const b = cn('wysiwyg-editor');

export type WysiwygEditorViewProps = ClassNameProps & {
    editor: EditorInt;
    autofocus?: boolean;
    settingsVisible?: boolean;
    toolbarConfig: WToolbarData;
    toolbarVisible?: boolean;
    stickyToolbar?: boolean;
    toolbarClassName?: string;
    hiddenActionsConfig?: WToolbarItemData[];
    children?: React.ReactNode;
};

export const WysiwygEditorView = React.memo<WysiwygEditorViewProps>((props) => {
    const {
        editor,
        autofocus,
        settingsVisible,
        toolbarVisible,
        toolbarConfig,
        hiddenActionsConfig,
        className,
        toolbarClassName,
        children,
        stickyToolbar = true,
    } = props;
    useRenderTime((time) => {
        logger.metrics({
            component: 'wysiwyg-editor',
            event: 'render',
            duration: time,
        });
    });
    return (
        <div className={b({toolbar: toolbarVisible}, [className])}>
            {toolbarVisible ? (
                <ToolbarView
                    editor={editor}
                    editorType="wysiwyg"
                    toolbarEditor={editor}
                    stickyToolbar={stickyToolbar}
                    toolbarConfig={toolbarConfig}
                    toolbarFocus={() => editor.focus()}
                    hiddenActionsConfig={hiddenActionsConfig}
                    settingsVisible={settingsVisible}
                    className={b('toolbar', [toolbarClassName])}
                >
                    {children}
                </ToolbarView>
            ) : null}
            <WysiwygEditorComponent autofocus={autofocus} editor={editor} className={b('editor')}>
                <ReactRendererComponent storage={editor.renderStorage} />
            </WysiwygEditorComponent>
        </div>
    );
});
WysiwygEditorView.displayName = 'YfmWysiwgEditorView';
