import {type CSSProperties, memo, useCallback, useEffect, useMemo, useState} from 'react';

import {defaultOptions} from '@diplodoc/transform/lib/sanitize';
import {Button, DropdownMenu} from '@gravity-ui/uikit';

import type {ToolbarActionData} from 'src/bundle/Editor';
import type {Extension} from 'src/cm/state';
import {FoldingHeading} from 'src/extensions/additional/FoldingHeading';
import {Math} from 'src/extensions/additional/Math';
import {Mermaid} from 'src/extensions/additional/Mermaid';
import {YfmHtmlBlock} from 'src/extensions/additional/YfmHtmlBlock';
import {getSanitizeYfmHtmlBlock} from 'src/extensions/additional/YfmHtmlBlock/utils';
import {
    type DirectiveSyntaxValue,
    type FileUploadHandler,
    Logger2,
    type MarkdownEditorMode,
    MarkdownEditorView,
    type MarkdownEditorViewProps,
    type MarkupString,
    NumberInput,
    type RenderPreview,
    type ToolbarGroupData,
    type UseMarkdownEditorProps,
    type WysiwygPlaceholderOptions,
    logger,
    useMarkdownEditor,
    wysiwygToolbarConfigs,
} from 'src/index';
import type {CodeEditor} from 'src/markup';
import type {ToolbarsPreset} from 'src/modules/toolbars/types';

import {getPlugins} from '../defaults/md-plugins';
import {useLogs} from '../hooks/useLogs';
import useYfmHtmlBlockStyles from '../hooks/useYfmHtmlBlockStyles';
import {randomDelay} from '../utils/delay';
import {parseInsertedUrlAsImage} from '../utils/imageUrl';
import {debouncedUpdateLocation as updateLocation} from '../utils/location';

import {PlaygroundLayout, b} from './PlaygroundLayout';
import {SplitModePreview} from './SplitModePreview';

const fileUploadHandler: FileUploadHandler = async (file) => {
    console.info('[Playground] Uploading file: ' + file.name);
    await randomDelay(1000, 3000);
    return {url: URL.createObjectURL(file)};
};

const wCommandMenuConfig = wysiwygToolbarConfigs.wCommandMenuConfig.concat(
    wysiwygToolbarConfigs.wMathInlineItemData,
    wysiwygToolbarConfigs.wMathBlockItemData,
    wysiwygToolbarConfigs.wMermaidItemData,
    wysiwygToolbarConfigs.wYfmHtmlBlockItemData,
);

export type PlaygroundProps = {
    initial?: MarkupString;
    allowHTML?: boolean;
    settingsVisible?: boolean;
    initialEditor?: MarkdownEditorMode;
    preserveEmptyRows?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    placeholderOptions?: WysiwygPlaceholderOptions;
    sanitizeHtml?: boolean;
    prepareRawMarkup?: boolean;
    splitModeOrientation?: 'horizontal' | 'vertical' | false;
    stickyToolbar?: boolean;
    initialSplitModeEnabled?: boolean;
    renderPreviewDefined?: boolean;
    height?: CSSProperties['height'];
    markupConfigExtensions?: Extension[];
    wysiwygCommandMenuConfig?: wysiwygToolbarConfigs.WToolbarItemData[];
    markupToolbarConfig?: ToolbarGroupData<CodeEditor>[];
    toolbarsPreset?: ToolbarsPreset;
    onChangeEditorType?: (mode: MarkdownEditorMode) => void;
    onChangeSplitModeEnabled?: (splitModeEnabled: boolean) => void;
    directiveSyntax?: DirectiveSyntaxValue;
} & Pick<UseMarkdownEditorProps, 'experimental' | 'wysiwygConfig'> &
    Pick<
        MarkdownEditorViewProps,
        | 'markupHiddenActionsConfig'
        | 'wysiwygHiddenActionsConfig'
        | 'markupToolbarConfig'
        | 'wysiwygToolbarConfig'
        | 'enableSubmitInPreview'
        | 'hidePreviewAfterSubmit'
    >;

logger.setLogger({
    log: (...data) => console.log('[Deprecated logger]', ...data),
    info: (...data) => console.info('[Deprecated logger]', ...data),
    warn: (...data) => console.warn('[Deprecated logger]', ...data),
    error: (...data) => console.error('[Deprecated logger]', ...data),
    metrics: (...data) => console.info('[Deprecated logger]', ...data),
    action: (data) => console.info(`[Deprecated logger] Action: ${data.action}`, data),
});

export const Playground = memo<PlaygroundProps>((props) => {
    const {
        initial,
        initialEditor,
        initialSplitModeEnabled,
        settingsVisible,
        allowHTML,
        breaks,
        linkify,
        preserveEmptyRows,
        linkifyTlds,
        sanitizeHtml,
        prepareRawMarkup,
        splitModeOrientation,
        stickyToolbar,
        renderPreviewDefined,
        height,
        wysiwygConfig,
        toolbarsPreset,
        wysiwygToolbarConfig,
        wysiwygCommandMenuConfig,
        markupConfigExtensions,
        markupToolbarConfig,
        placeholderOptions,
        enableSubmitInPreview,
        hidePreviewAfterSubmit,
        experimental,
        directiveSyntax,
    } = props;
    const [editorMode, setEditorMode] = useState<MarkdownEditorMode>(initialEditor ?? 'wysiwyg');
    const [mdRaw, setMdRaw] = useState<MarkupString>(initial || '');

    useEffect(() => {
        updateLocation(mdRaw);
    }, [mdRaw]);

    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md, directiveSyntax}) => (
            <SplitModePreview
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml={sanitizeHtml}
                plugins={getPlugins({directiveSyntax})}
            />
        ),
        [sanitizeHtml],
    );

    const logger = useMemo(() => new Logger2().nested({env: 'playground'}), []);
    useLogs(logger);

    const mdEditor = useMarkdownEditor(
        {
            logger,
            preset: 'full',
            wysiwygConfig: {
                placeholderOptions: placeholderOptions,
                extensions: (builder) => {
                    builder
                        .use(Math, {
                            loadRuntimeScript: () => {
                                import(
                                    /* webpackChunkName: "latex-runtime" */ '@diplodoc/latex-extension/runtime'
                                );
                                import(
                                    // @ts-expect-error // no types for styles
                                    /* webpackChunkName: "latex-styles" */ '@diplodoc/latex-extension/runtime/styles'
                                );
                            },
                        })
                        .use(Mermaid, {
                            loadRuntimeScript: () => {
                                import(
                                    /* webpackChunkName: "mermaid-runtime" */ '@diplodoc/mermaid-extension/runtime'
                                );
                            },
                        })
                        .use(FoldingHeading)
                        .use(YfmHtmlBlock, {
                            useConfig: useYfmHtmlBlockStyles,
                            sanitize: getSanitizeYfmHtmlBlock({options: defaultOptions}),
                            head: `
                        <base target="_blank" />
                        <style>
                            html, body {
                                margin: 0;
                                padding: 0;
                            }
                        </style
                    `,
                        });
                    if (wysiwygConfig?.extensions) builder.use(wysiwygConfig.extensions);
                },
                extensionOptions: {
                    commandMenu: {actions: wysiwygCommandMenuConfig ?? wCommandMenuConfig},
                    imgSize: {
                        parseInsertedUrlAsImage,
                    },
                    ...wysiwygConfig?.extensionOptions,
                },
            },
            md: {
                html: allowHTML,
                linkify,
                linkifyTlds,
                breaks: breaks ?? true,
            },
            initial: {
                markup: mdRaw,
                mode: editorMode,
                toolbarVisible: true,
                splitModeEnabled: initialSplitModeEnabled,
            },
            handlers: {
                uploadFile: fileUploadHandler,
            },
            experimental: {
                ...experimental,
                directiveSyntax,
                preserveEmptyRows,
                prepareRawMarkup: prepareRawMarkup
                    ? (value) => '**prepare raw markup**\n\n' + value
                    : undefined,
            },
            markupConfig: {
                extensions: markupConfigExtensions,
                parseInsertedUrlAsImage,
                renderPreview,
                splitMode: splitModeOrientation,
            },
        },
        [
            allowHTML,
            linkify,
            linkifyTlds,
            breaks,
            splitModeOrientation,
            renderPreviewDefined,
            renderPreview,
            experimental?.needToSetDimensionsForUploadedImages,
            initial,
            experimental?.enableNewImageSizeCalculation,
            experimental?.needToSetDimensionsForUploadedImages,
            experimental?.beforeEditorModeChange,
            experimental?.prepareRawMarkup,
            directiveSyntax,
        ],
    );

    useEffect(() => {
        function onCancel() {
            alert('Editor: cancel');
            return true;
        }
        function onSubmit() {
            alert('Editor: submit');
            return true;
        }
        function onChange() {
            setMdRaw(mdEditor.getValue());
        }
        function onChangeEditorType({mode}: {mode: MarkdownEditorMode}) {
            props.onChangeEditorType?.(mode);
            setEditorMode(mode);
        }
        const onToolbarAction = ({id, editorMode: type}: ToolbarActionData) => {
            console.info(`The '${id}' action is performed in the ${type}-editor.`);
        };
        function onChangeSplitModeEnabled({splitModeEnabled}: {splitModeEnabled: boolean}) {
            props.onChangeSplitModeEnabled?.(splitModeEnabled);
            console.info(`Split mode enabled: ${splitModeEnabled}`);
        }
        function onChangeToolbarVisibility({visible}: {visible: boolean}) {
            console.info('Toolbar visible: ' + visible);
        }

        mdEditor.on('cancel', onCancel);
        mdEditor.on('submit', onSubmit);
        mdEditor.on('change', onChange);
        mdEditor.on('toolbar-action', onToolbarAction);
        mdEditor.on('change-editor-mode', onChangeEditorType);
        mdEditor.on('change-split-mode-enabled', onChangeSplitModeEnabled);
        mdEditor.on('change-toolbar-visibility', onChangeToolbarVisibility);

        return () => {
            mdEditor.off('cancel', onCancel);
            mdEditor.off('submit', onSubmit);
            mdEditor.off('change', onChange);
            mdEditor.off('toolbar-action', onToolbarAction);
            mdEditor.off('change-editor-mode', onChangeEditorType);
            mdEditor.off('change-split-mode-enabled', onChangeSplitModeEnabled);
            mdEditor.off('change-toolbar-visibility', onChangeToolbarVisibility);
        };
    }, [mdEditor]);

    return (
        <PlaygroundLayout
            editor={mdEditor}
            viewHeight={height}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    className={className}
                    stickyToolbar={Boolean(stickyToolbar)}
                    toolbarsPreset={toolbarsPreset}
                    wysiwygToolbarConfig={wysiwygToolbarConfig}
                    markupToolbarConfig={markupToolbarConfig}
                    settingsVisible={settingsVisible}
                    editor={mdEditor}
                    enableSubmitInPreview={enableSubmitInPreview}
                    hidePreviewAfterSubmit={hidePreviewAfterSubmit}
                />
            )}
            actions={() => (
                <>
                    <DropdownMenu
                        size="s"
                        switcher={
                            <Button size="s" view="flat">
                                isEmpty: {String(mdEditor.isEmpty())}
                            </Button>
                        }
                    >
                        <DropdownMenu.Item
                            text="Clear"
                            action={() => {
                                mdEditor.clear();
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Append"
                            action={() => {
                                mdEditor.append('> append');
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Prepend"
                            action={() => {
                                mdEditor.prepend('> prepend');
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Replace"
                            action={() => {
                                mdEditor.replace('> replace');
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Move cursor to start"
                            action={() => {
                                mdEditor.moveCursor('start');
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Move cursor to end"
                            action={() => {
                                mdEditor.moveCursor('end');
                                mdEditor.focus();
                            }}
                        />
                        <DropdownMenu.Item
                            text="Move to line"
                            action={() => {
                                mdEditor.moveCursor({line: 115});
                                mdEditor.focus();
                            }}
                        />
                    </DropdownMenu>
                    {mdEditor.currentMode === 'markup' && (
                        <MoveToLine
                            onClick={(line) => {
                                if (typeof line !== 'number' || Number.isNaN(line)) return;
                                mdEditor.moveCursor({line});
                                mdEditor.focus();
                            }}
                        />
                    )}
                </>
            )}
        />
    );
});

Playground.displayName = 'Playground';

function MoveToLine({onClick}: {onClick: (value: number | undefined) => void}) {
    const [line, setLine] = useState<number | undefined>(0);

    return (
        <div className={b('move-to-line')}>
            <NumberInput
                size="s"
                value={line}
                onUpdate={setLine}
                min={0}
                className={b('move-to-line-input')}
            />
            <Button size="s" onClick={() => onClick(line)}>
                Move to line
            </Button>
        </div>
    );
}
