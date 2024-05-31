import React, {CSSProperties, useCallback} from 'react';

import {Button, DropdownMenu} from '@gravity-ui/uikit';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {MarkupString, logger} from '../src';
import {
    YfmEditor,
    YfmEditorProps,
    YfmEditorRef,
    YfmEditorType,
    markupToolbarConfigs,
    wysiwygToolbarConfigs,
} from '../src/bundle';
import {RenderPreview} from '../src/bundle/Editor';
import {Math} from '../src/extensions/yfm/Math';
import {Mermaid} from '../src/extensions/yfm/Mermaid';
import {cloneDeep} from '../src/lodash';
import type {FileUploadHandler} from '../src/utils/upload';
import {VERSION} from '../src/version';

import {WysiwygSelection} from './PMSelection';
import {WysiwygDevTools} from './ProseMirrorDevTools';
import {SplitModePreview} from './SplitModePreview';
import {block} from './cn';
import {randomDelay} from './delay';
import {debouncedUpdateLocation as updateLocation} from './location';
import {plugins} from './md-plugins';

import './Playground.scss';

const b = block('playground');
const onAction: YfmEditorProps['onMenuBarAction'] = ({action, editorType}) => {
    console.info(`The '${action}' action is performed in the ${editorType}-editor.`);
};

const mToolbarConfig = [
    ...markupToolbarConfigs.mToolbarConfig,
    [markupToolbarConfigs.mMermaidButton],
];
mToolbarConfig[2].push(markupToolbarConfigs.mMathListItem);

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig[2].push(wysiwygToolbarConfigs.wMathListItem);

const wCommandMenuConfig = wysiwygToolbarConfigs.wCommandMenuConfig.concat(
    wysiwygToolbarConfigs.wMathInlineItemData,
    wysiwygToolbarConfigs.wMathBlockItemData,
    wysiwygToolbarConfigs.wMermaidItemData,
);

export type PlaygroundProps = {
    initial?: MarkupString;
    allowHTML?: boolean;
    settingsVisible?: boolean;
    initialEditor?: YfmEditorType;
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
    const [editorType, setEditorType] = React.useState<YfmEditorType>(initialEditor ?? 'wysiwyg');
    const [mdRaw, setMdRaw] = React.useState<MarkupString>(initial || '');
    const editorRef = React.useRef<YfmEditorRef>(null);

    React.useEffect(() => {
        updateLocation(mdRaw);
    }, [mdRaw]);

    React.useEffect(() => {
        console.log('[Playground] MarkdownEditor domElem:', editorRef.current?.domElem());
    }, []);

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
                        isEmpty: {String(editorRef.current?.isEmpty())}
                    </Button>
                }
            >
                <DropdownMenu.Item
                    text="Clear"
                    action={() => {
                        editorRef.current?.clear();
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Append"
                    action={() => {
                        editorRef.current?.append('> append');
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Prepend"
                    action={() => {
                        editorRef.current?.prepend('> prepend');
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Replace"
                    action={() => {
                        editorRef.current?.replace('> replace');
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Move cursor to start"
                    action={() => {
                        editorRef.current?.moveCursor('start');
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Move cursor to end"
                    action={() => {
                        editorRef.current?.moveCursor('end');
                        editorRef.current?.focus();
                    }}
                />
                <DropdownMenu.Item
                    text="Move to line"
                    action={() => {
                        editorRef.current?.moveCursor({line: 115});
                        editorRef.current?.focus();
                    }}
                />
            </DropdownMenu>
            <hr />
            <React.StrictMode>
                <div className={b('editor')} style={{height: height ?? 'initial'}}>
                    <YfmEditor
                        autofocus
                        splitMode={splitModeOrientation}
                        ref={editorRef}
                        renderPreview={renderPreviewDefined ? renderPreview : undefined}
                        toaster={toaster}
                        stickyToolbar={stickyToolbar}
                        className={b('editor-view')}
                        initialContent={mdRaw}
                        initialEditorType={editorType}
                        initialSplitModeEnabled={initialSplitModeEnabled}
                        wysiwygAllowHTML={allowHTML}
                        wysiwygLinkify={linkify}
                        wysiwygLinkifyTlds={linkifyTlds}
                        wysiwygBreaks={breaks}
                        wysiwygMenubarData={wToolbarConfig}
                        markupMenubarData={mToolbarConfig}
                        onMarkupChange={(e) => setMdRaw(e.getValue())}
                        onEditorTypeChange={setEditorType}
                        onMenuBarAction={onAction}
                        onFileUpload={fileUploadHandler}
                        settingsVisible={settingsVisible}
                        onSplitModeEnabledChange={(splitModeEnabled) => {
                            console.log(`Split mode enabled: ${splitModeEnabled}`);
                        }}
                        onMenuVisibleChange={(isMenuVisible) => {
                            console.log('Menubar visible: ' + isMenuVisible);
                        }}
                        prepareRawMarkup={
                            prepareRawMarkup
                                ? (value) => '**prepare raw markup**\n\n' + value
                                : undefined
                        }
                        onCancel={() => {
                            alert('Editor: cancel');
                            return true;
                        }}
                        onSubmit={() => {
                            alert('Editor: submit');
                            return true;
                        }}
                        extensionOptions={{
                            commandMenu: {actions: wCommandMenuConfig},
                        }}
                        wysiwygExtraExtensions={(builder) =>
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
                        }
                    />
                    <WysiwygDevTools editorRef={editorRef} />
                    <WysiwygSelection editorRef={editorRef} className={b('pm-selection')} />
                </div>
            </React.StrictMode>

            <hr />

            <div className={b('preview')}>
                {editorType === 'wysiwyg' && <pre className={b('markup')}>{mdRaw}</pre>}
            </div>
        </div>
    );
});

Playground.displayName = 'Playground';

const fileUploadHandler: FileUploadHandler = async (file) => {
    console.info('[Playground] Uploading file: ' + file.name);
    await randomDelay(1000, 3000);
    return {url: URL.createObjectURL(file)};
};
