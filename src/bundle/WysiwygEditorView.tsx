import {memo} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import {type ClassNameProps, cn} from '../classname';
import {ReactRendererComponent} from '../extensions';
import {globalLogger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import type {EditorInt} from './Editor';
import {ToolbarView} from './ToolbarView';
import {WysiwygEditorComponent} from './WysiwygEditorComponent';
import type {WToolbarData, WToolbarItemData} from './toolbar/types';

import './WysiwygEditorView.scss';

const b = cn('wysiwyg-editor');

export type WysiwygEditorViewProps = ClassNameProps &
    QAProps & {
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

export const WysiwygEditorView = memo<WysiwygEditorViewProps>((props) => {
    const {
        editor,
        autofocus,
        settingsVisible,
        toolbarVisible,
        toolbarConfig,
        hiddenActionsConfig,
        qa,
        className,
        toolbarClassName,
        children,
        stickyToolbar = true,
    } = props;

    useRenderTime((time) => {
        globalLogger.metrics({
            component: 'wysiwyg-editor',
            event: 'render',
            duration: time,
        });
        editor.logger.metrics({
            component: 'wysiwyg-editor',
            event: 'render',
            duration: time,
        });
    });

    return (
        <div className={b({toolbar: toolbarVisible}, [className])} data-qa={qa}>
            {toolbarVisible ? (
                <ToolbarView
                    qa="g-md-toolbar-main"
                    editor={editor}
                    editorMode="wysiwyg"
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
WysiwygEditorView.displayName = 'MarkdownWysiwgEditorView';
