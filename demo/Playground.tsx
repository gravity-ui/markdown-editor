import React, {CSSProperties, useCallback, useEffect} from 'react';

import sanitize from '@diplodoc/transform/lib/sanitize';
import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {
    MarkdownEditorMode,
    MarkdownEditorView,
    MarkupString,
    RenderPreview,
    logger,
    markupToolbarConfigs,
    useMarkdownEditor,
    wysiwygToolbarConfigs,
} from '../src';
import type {ToolbarActionData} from '../src/bundle/Editor';
import {FoldingHeading} from '../src/extensions/yfm/FoldingHeading';
import {Math} from '../src/extensions/yfm/Math';
import {Mermaid} from '../src/extensions/yfm/Mermaid';
import {YfmHtmlBlock} from '../src/extensions/yfm/YfmHtmlBlock';
import {cloneDeep} from '../src/lodash';
import type {FileUploadHandler} from '../src/utils/upload';
import {VERSION} from '../src/version';

import {WysiwygSelection} from './PMSelection';
import {WysiwygDevTools} from './ProseMirrorDevTools';
import {SplitModePreview} from './SplitModePreview';
import {block} from './cn';
import {randomDelay} from './delay';
import useYfmHtmlBlockStyles from './hooks/useYfmHtmlBlockStyles';
import {debouncedUpdateLocation as updateLocation} from './location';
import {plugins} from './md-plugins';

import './Playground.scss';

const b = block('playground');
const fileUploadHandler: FileUploadHandler = async (file) => {
    console.info('[Playground] Uploading file: ' + file.name);
    await randomDelay(1000, 3000);
    return {url: URL.createObjectURL(file)};
};

const mToolbarConfig = [
    ...markupToolbarConfigs.mToolbarConfig,
    [markupToolbarConfigs.mMermaidButton, markupToolbarConfigs.mYfmHtmlBlockButton],
];
mToolbarConfig[2].push(markupToolbarConfigs.mMathListItem);

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig[2].push(wysiwygToolbarConfigs.wMathListItem);

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
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    sanitizeHtml?: boolean;
    prepareRawMarkup?: boolean;
    splitModeOrientation?: 'horizontal' | 'vertical' | false;
    stickyToolbar?: boolean;
    initialSplitModeEnabled?: boolean;
    renderPreviewDefined?: boolean;
    height?: CSSProperties['height'];
    onChangeEditorType?: (mode: MarkdownEditorMode) => void;
    onChangeSplitModeEnabled?: (splitModeEnabled: boolean) => void;
};

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

export const Playground = React.memo<PlaygroundProps>((props) => {
    const {
        initial,
        initialEditor,
        initialSplitModeEnabled,
        settingsVisible,
        allowHTML,
        breaks,
        linkify,
        linkifyTlds,
        sanitizeHtml,
        prepareRawMarkup,
        splitModeOrientation,
        stickyToolbar,
        renderPreviewDefined,
        height,
    } = props;
    const [editorMode, setEditorMode] = React.useState<MarkdownEditorMode>(
        initialEditor ?? 'wysiwyg',
    );
    const [mdRaw, setMdRaw] = React.useState<MarkupString>(initial || '');

    React.useEffect(() => {
        updateLocation(mdRaw);
    }, [mdRaw]);

    const renderPreview = useCallback<RenderPreview>(
        ({getValue}) => (
            <SplitModePreview
                getValue={getValue}
                allowHTML={allowHTML}
                linkify={linkify}
                linkifyTlds={linkifyTlds}
                breaks={breaks}
                needToSanitizeHtml={sanitizeHtml}
                plugins={plugins}
            />
        ),
        [allowHTML, breaks, linkify, linkifyTlds, sanitizeHtml],
    );

    const mdEditor = useMarkdownEditor({
        allowHTML,
        linkify,
        linkifyTlds,
        initialMarkup: mdRaw,
        breaks: breaks ?? true,
        initialEditorMode: editorMode,
        initialSplitModeEnabled: initialSplitModeEnabled,
        initialToolbarVisible: true,
        splitMode: splitModeOrientation,
        renderPreview: renderPreviewDefined ? renderPreview : undefined,
        fileUploadHandler,
        prepareRawMarkup: prepareRawMarkup
            ? (value) => '**prepare raw markup**\n\n' + value
            : undefined,
        extensionOptions: {
            commandMenu: {actions: wCommandMenuConfig},
        },
        extraExtensions: (builder) =>
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
                .use(YfmHtmlBlock, {
                    useConfig: useYfmHtmlBlockStyles,
                    sanitize,
                })
                .use(FoldingHeading),
    });

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
        <div className={b()}>
            <div className={b('header')}>
                Markdown Editor Playground
                <span className={b('version')}>{VERSION}</span>
            </div>
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
            <hr />
            <React.StrictMode>
                <div className={b('editor')} style={{height: height ?? 'initial'}}>
                    <MarkdownEditorView
                        autofocus
                        toaster={toaster}
                        className={b('editor-view')}
                        stickyToolbar={Boolean(stickyToolbar)}
                        wysiwygToolbarConfig={wToolbarConfig}
                        markupToolbarConfig={mToolbarConfig}
                        settingsVisible={settingsVisible}
                        editor={mdEditor}
                    />
                    <WysiwygDevTools editor={mdEditor} />
                    <WysiwygSelection editor={mdEditor} className={b('pm-selection')} />
                </div>
            </React.StrictMode>

            <hr />

            <div className={b('preview')}>
                {editorMode === 'wysiwyg' && <pre className={b('markup')}>{mdRaw}</pre>}
            </div>
        </div>
    );
});

Playground.displayName = 'Playground';
