import React from 'react';

import {ClassNameProps, cn} from '../classname';
import {ReactRendererComponent} from '../extensions';
import {logger} from '../logger';
import {useRenderTime} from '../react-utils/hooks';

import type {EditorInt, SplitMode} from './Editor';
import {MarkupEditorComponent} from './MarkupEditorComponent';
import {ToolbarView} from './ToolbarView';
import type {MToolbarData, MToolbarItemData} from './config/markup';
import {MarkupToolbarContextProvider} from './toolbar/markup/context';

import './MarkupEditorView.scss';

const b = cn('markup-editor');

export type MarkupEditorViewProps = ClassNameProps & {
    editor: EditorInt;
    autofocus?: boolean;
    toolbarConfig: MToolbarData;
    settingsVisible?: boolean;
    toolbarVisible?: boolean;
    stickyToolbar?: boolean;
    toolbarClassName?: string;
    splitMode?: SplitMode;
    splitModeEnabled: boolean;
    hiddenActionsConfig?: MToolbarItemData[];
    children?: React.ReactNode;
};

export const MarkupEditorView = React.memo<MarkupEditorViewProps>((props) => {
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
            component: 'markup-editor',
            event: 'render',
            duration: time,
        });
    });

    return (
        <div className={b({toolbar: toolbarVisible}, [className])}>
            {toolbarVisible ? (
                <MarkupToolbarContextProvider
                    value={{
                        uploadHandler: editor.fileUploadHandler,
                        needToSetDimensionsForUploadedImages:
                            editor.needToSetDimensionsForUploadedImages,
                    }}
                >
                    <ToolbarView
                        editor={editor}
                        editorMode="markup"
                        toolbarEditor={editor}
                        hiddenActionsConfig={hiddenActionsConfig}
                        stickyToolbar={stickyToolbar}
                        toolbarConfig={toolbarConfig}
                        toolbarFocus={() => editor.focus()}
                        settingsVisible={settingsVisible}
                        className={b('toolbar', [toolbarClassName])}
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
