import React, {CSSProperties, useCallback, useEffect} from 'react';

import {defaultOptions} from '@diplodoc/transform/lib/sanitize';
import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {
    MarkdownEditorMode,
    MarkdownEditorPreset,
    MarkdownEditorView,
    MarkupString,
    RenderPreview,
    logger,
    useMarkdownEditor,
} from '../../../src';
import {FoldingHeading} from '../../../src/extensions/additional/FoldingHeading';
import {Math} from '../../../src/extensions/additional/Math';
import {Mermaid} from '../../../src/extensions/additional/Mermaid';
import {YfmHtmlBlock} from '../../../src/extensions/additional/YfmHtmlBlock';
import {getSanitizeYfmHtmlBlock} from '../../../src/extensions/additional/YfmHtmlBlock/utils';
import {ToolbarsPreset} from '../../../src/modules/toolbars/types';
import type {FileUploadHandler} from '../../../src/utils/upload';
import {VERSION} from '../../../src/version';
// ---
import {WysiwygSelection} from '../../components/PMSelection';
import {WysiwygDevTools} from '../../components/ProseMirrorDevTools';
import {SplitModePreview} from '../../components/SplitModePreview';
import {plugins} from '../../defaults/md-plugins';
import useYfmHtmlBlockStyles from '../../hooks/useYfmHtmlBlockStyles';
import {block} from '../../utils/cn';
import {randomDelay} from '../../utils/delay';
import {parseInsertedUrlAsImage} from '../../utils/imageUrl';

import '../../components/Playground.scss';

const b = block('playground');
const fileUploadHandler: FileUploadHandler = async (file) => {
    console.info('[PresetDemo] Uploading file: ' + file.name);
    await randomDelay(1000, 3000);
    return {url: URL.createObjectURL(file)};
};

export type PresetDemoProps = {
    preset: MarkdownEditorPreset;
    allowHTML?: boolean;
    settingsVisible?: boolean;
    breaks?: boolean;
    linkify?: boolean;
    linkifyTlds?: string | string[];
    splitModeOrientation?: 'horizontal' | 'vertical' | false;
    stickyToolbar?: boolean;
    height?: CSSProperties['height'];
    toolbarsPreset?: ToolbarsPreset;
};

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

export const Preset = React.memo<PresetDemoProps>((props) => {
    const {
        preset,
        settingsVisible,
        allowHTML,
        breaks,
        linkify,
        linkifyTlds,
        splitModeOrientation,
        stickyToolbar,
        height,
        toolbarsPreset,
    } = props;
    const [editorMode, setEditorMode] = React.useState<MarkdownEditorMode>('wysiwyg');
    const [mdRaw, setMdRaw] = React.useState<MarkupString>('');

    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md}) => (
            <SplitModePreview
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
                plugins={plugins}
            />
        ),
        [],
    );

    const mdEditor = useMarkdownEditor({
        preset,
        allowHTML,
        linkify,
        linkifyTlds,
        breaks: breaks ?? true,
        initialSplitModeEnabled: true,
        initialToolbarVisible: true,
        splitMode: splitModeOrientation,
        renderPreview,
        fileUploadHandler,
        wysiwygConfig: {
            extensionOptions: {
                imgSize: {
                    parseInsertedUrlAsImage,
                },
            },
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
            },
        },
        markupConfig: {
            parseInsertedUrlAsImage,
        },
    });

    useEffect(() => {
        function onChange() {
            setMdRaw(mdEditor.getValue());
        }
        function onChangeEditorType({mode}: {mode: MarkdownEditorMode}) {
            setEditorMode(mode);
        }

        mdEditor.on('change', onChange);
        mdEditor.on('change-editor-mode', onChangeEditorType);

        return () => {
            mdEditor.off('change', onChange);
            mdEditor.off('change-editor-mode', onChangeEditorType);
        };
    }, [mdEditor]);

    return (
        <div className={b()}>
            <div className={b('header')}>
                Markdown Editor ({preset} preset)
                <span className={b('version')}>{VERSION}</span>
            </div>
            <hr />
            <React.StrictMode>
                <div className={b('editor')} style={{height: height ?? 'initial'}}>
                    <MarkdownEditorView
                        autofocus
                        toolbarsPreset={toolbarsPreset}
                        toaster={toaster}
                        className={b('editor-view')}
                        stickyToolbar={Boolean(stickyToolbar)}
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

Preset.displayName = 'PresetDemo';
