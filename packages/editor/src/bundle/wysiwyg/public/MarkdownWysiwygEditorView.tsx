import {forwardRef, useLayoutEffect, useMemo, useState} from 'react';

import {Button, TextArea} from '@gravity-ui/uikit';
import {ErrorBoundary} from 'react-error-boundary';
import {useUpdate} from 'react-use';

import type {MarkdownEditorViewProps} from 'src/bundle/MarkdownEditorView';
import {WysiwygEditorView} from 'src/bundle/WysiwygEditorView';
import {cnEditorComponent} from 'src/bundle/editor-classname';
import {SettingsLayout} from 'src/bundle/settings/SettingsLayout';
import type {WToolbarData} from 'src/bundle/toolbar/types';
import {createToolbarConfig} from 'src/bundle/toolbar/utils/createToolbarConfig';
import {flattenPreset} from 'src/bundle/toolbar/utils/flattenPreset';
import type {WysiwygContenteditableAttributes} from 'src/bundle/types';
import {type WysiwygEditorBinding, getWysiwygBinding} from 'src/bundle/wysiwyg/binding';
import {
    MarkdownWysiwygEditorProvider,
    useMarkdownWysiwygEditorContext,
} from 'src/bundle/wysiwyg/public/context';
import type {MarkdownWysiwygEditorInstance} from 'src/bundle/wysiwyg/public/types';
import {useContextualToolbars} from 'src/bundle/wysiwyg/useContextualToolbars';
import {i18n} from 'src/i18n/bundle';
import {globalLogger} from 'src/logger';
import {ToolbarName} from 'src/modules/toolbars/constants';
import {wysiwygToolbarsPresets} from 'src/modules/toolbars/wysiwyg/presets';

import '../../../styles/styles.scss';
import '../../MarkdownEditorView.scss';

const b = cnEditorComponent;

export type MarkdownWysiwygEditorViewProps = Pick<
    MarkdownEditorViewProps,
    'autofocus' | 'className' | 'qa' | 'stickyToolbar' | 'toolbarsPreset'
> & {
    /** Editor instance. Uses the WYSIWYG context by default. */
    editor?: MarkdownWysiwygEditorInstance;
    /** Settings to show. Defaults to the toolbar visibility control. */
    settingsVisible?: boolean | 'toolbar'[];
    /** Extra attributes for the editable element. Unset by default. */
    contenteditableAttributes?: WysiwygContenteditableAttributes;
};

export const MarkdownWysiwygEditorView = forwardRef<HTMLDivElement, MarkdownWysiwygEditorViewProps>(
    function MarkdownWysiwygEditorView(props, ref) {
        const context = useMarkdownWysiwygEditorContext();
        const editor = props.editor ?? context;
        if (!editor) {
            throw new Error(
                '[MarkdownWysiwygEditorView]: an instance of the editor must be passed through the props or context',
            );
        }
        const binding = getWysiwygBinding(editor);
        const [mounted, setMounted] = useState<WysiwygEditorBinding | null>(null);
        const rerender = useUpdate();

        useLayoutEffect(() => {
            const detach = binding.attachView();
            setMounted(binding);
            binding.on('rerender', rerender);
            return () => {
                binding.off('rerender', rerender);
                detach();
            };
        }, [binding, rerender]);

        const {className, qa, settingsVisible = true} = props;
        const areSettingsVisible =
            settingsVisible === true ||
            (Array.isArray(settingsVisible) && settingsVisible.length > 0);

        return (
            <MarkdownWysiwygEditorProvider value={editor}>
                <div
                    ref={ref}
                    data-qa={qa}
                    className={b({settings: areSettingsVisible}, [className])}
                >
                    {mounted === binding && (
                        <ErrorBoundary
                            onError={(error) => {
                                globalLogger.error(error);
                                binding.logger.error(error);
                            }}
                            fallbackRender={() => <Recovery binding={binding} />}
                        >
                            <EditorContent {...props} binding={binding} />
                        </ErrorBoundary>
                    )}
                </div>
            </MarkdownWysiwygEditorProvider>
        );
    },
);

function EditorContent({
    binding,
    autofocus,
    stickyToolbar,
    toolbarsPreset,
    contenteditableAttributes,
    settingsVisible = true,
}: MarkdownWysiwygEditorViewProps & {binding: WysiwygEditorBinding}) {
    useContextualToolbars(binding, true, toolbarsPreset);
    const {toolbarConfig, hiddenActionsConfig} = useMemo(() => {
        const preset = toolbarsPreset ?? wysiwygToolbarsPresets[binding.preset];
        return {
            toolbarConfig: createToolbarConfig<WToolbarData>(
                'wysiwyg',
                preset,
                ToolbarName.wysiwygMain,
            ),
            hiddenActionsConfig: flattenPreset(
                createToolbarConfig<WToolbarData>('wysiwyg', preset, ToolbarName.wysiwygHidden),
            ),
        };
    }, [binding, toolbarsPreset]);
    const settings = settingsVisible === true ? ['toolbar' as const] : settingsVisible;
    const areSettingsVisible = Array.isArray(settings) && settings.length > 0;
    const settingsProps = {
        mode: 'wysiwyg' as const,
        toolbarVisibility: binding.toolbarVisible,
        onToolbarVisibilityChange: (visible: boolean) => binding.changeToolbarVisibility({visible}),
        showPreview: false,
        stickyToolbar,
        disableMark: binding.mobile,
    };

    return (
        <div className={b('editor-wrapper')} data-qa="g-md-editor-mode" data-mode="wysiwyg">
            <WysiwygEditorView
                editor={binding}
                autofocus={autofocus}
                contenteditableAttributes={contenteditableAttributes}
                settingsVisible={areSettingsVisible}
                toolbarConfig={toolbarConfig}
                toolbarVisible={binding.toolbarVisible}
                hiddenActionsConfig={hiddenActionsConfig}
                className={b('editor', {mode: 'wysiwyg'})}
                toolbarClassName={b('toolbar')}
                stickyToolbar={stickyToolbar}
                toolbarDisplay={binding.mobile ? 'scroll' : 'shrink'}
            >
                <SettingsLayout
                    {...settingsProps}
                    settingsVisible={binding.toolbarVisible && settings}
                />
            </WysiwygEditorView>
            <SettingsLayout
                {...settingsProps}
                settingsVisible={!binding.toolbarVisible && settings}
            />
        </div>
    );
}

function Recovery({binding}: {binding: WysiwygEditorBinding}) {
    const [markup, setMarkup] = useState<string>();
    const [failed, setFailed] = useState(false);
    const recover = () => {
        try {
            setMarkup(binding.api.getValue());
            setFailed(false);
        } catch (error) {
            setFailed(true);
            setMarkup(undefined);
            binding.logger.error(error);
            globalLogger.error(error);
        }
    };

    return (
        <div data-qa="g-md-wysiwyg-error" role="alert">
            <p>{i18n('error-title')}</p>
            <Button onClick={recover} qa="g-md-recover-markdown">
                {i18n('recover-markdown')}
            </Button>
            {markup !== undefined && (
                <TextArea
                    value={markup}
                    readOnly
                    controlProps={{'aria-label': 'Markdown'}}
                    qa="g-md-recovered-markdown"
                />
            )}
            {failed && <p data-qa="g-md-recovery-error">{i18n('recovery-error')}</p>}
        </div>
    );
}
