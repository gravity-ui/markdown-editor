import {memo} from 'react';

import type {QAProps} from '@gravity-ui/uikit';

import {type ClassNameProps, cn} from '../classname';
import {ReactRendererComponent} from '../extensions';
import {globalLogger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import type {EditorInt} from './Editor';
import {MarkupEditorComponent} from './MarkupEditorComponent';
import {ToolbarView} from './ToolbarView';
import {MarkupToolbarContextProvider} from './toolbar/markup/context';
import type {MToolbarData, MToolbarItemData} from './toolbar/types';
import type {MarkdownEditorSplitMode} from './types';

import './MarkupEditorView.scss';

const b = cn('markup-editor');

export type MarkupEditorViewProps = ClassNameProps &
    QAProps & {
        editor: EditorInt;
        autofocus?: boolean;
        toolbarConfig: MToolbarData;
        settingsVisible?: boolean;
        toolbarVisible?: boolean;
        stickyToolbar?: boolean;
        toolbarClassName?: string;
        splitMode?: MarkdownEditorSplitMode;
        splitModeEnabled: boolean;
        hiddenActionsConfig?: MToolbarItemData[];
        children?: React.ReactNode;
        mobile?: boolean;
    };

export const MarkupEditorView = memo<MarkupEditorViewProps>((props) => {
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
        mobile,
    } = props;
    useRenderTime((time) => {
        globalLogger.metrics({
            component: 'markup-editor',
            event: 'render',
            duration: time,
        });
        editor.logger.metrics({
            component: 'markup-editor',
            event: 'render',
            duration: time,
        });
    });

    return (
        <div className={b({toolbar: toolbarVisible}, [className])} data-qa={qa}>
            {toolbarVisible ? (
                <MarkupToolbarContextProvider
                    value={{
                        uploadHandler: editor.fileUploadHandler,
                        needToSetDimensionsForUploadedImages:
                            editor.needToSetDimensionsForUploadedImages,
                    }}
                >
                    <ToolbarView
                        qa="g-md-toolbar"
                        editor={editor}
                        editorMode="markup"
                        toolbarEditor={editor}
                        hiddenActionsConfig={hiddenActionsConfig}
                        stickyToolbar={stickyToolbar}
                        toolbarConfig={toolbarConfig}
                        toolbarFocus={() => editor.focus()}
                        settingsVisible={settingsVisible}
                        className={b('toolbar', [toolbarClassName])}
                        mobile={mobile}
                    >
                        {children}
                    </ToolbarView>
                </MarkupToolbarContextProvider>
            ) : null}
            <MarkupEditorComponent
                autofocus={autofocus}
                editor={editor}
                className={b('editor', {'toolbar-visible': toolbarVisible})}
            >
                <ReactRendererComponent storage={editor.renderStorage} />
            </MarkupEditorComponent>
        </div>
    );
});
MarkupEditorView.displayName = 'MarkdownMarkupEditorView';
