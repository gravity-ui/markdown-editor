import {StrictMode, memo, useCallback, useEffect, useState} from 'react';

import {
    type FileUploadHandler,
    type MarkdownEditorMarkupConfig,
    type MarkdownEditorMode,
    type MarkdownEditorPreset,
    MarkdownEditorView,
    type MarkdownEditorWysiwygConfig,
    type MarkupString,
    type RenderPreview,
    type ToolbarsPreset,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {VERSION} from '@gravity-ui/markdown-editor/_/version.js';

import {WysiwygSelection} from '../../components/PMSelection';
import {WysiwygDevTools} from '../../components/ProseMirrorDevTools';
import {SplitModePreview} from '../../components/SplitModePreview';
import {plugins} from '../../defaults/md-plugins';
import {useLogs} from '../../hooks/useLogs';
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
    height?: React.CSSProperties['height'];
    toolbarsPreset?: ToolbarsPreset;
    wysiwygConfig?: MarkdownEditorWysiwygConfig;
    markupConfig?: MarkdownEditorMarkupConfig;
};

export const Preset = memo<PresetDemoProps>((props) => {
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
        wysiwygConfig,
        markupConfig,
    } = props;
    const [editorMode, setEditorMode] = useState<MarkdownEditorMode>('wysiwyg');
    const [mdRaw, setMdRaw] = useState<MarkupString>('');

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
        md: {
            html: allowHTML,
            linkify,
            linkifyTlds,
            breaks: breaks ?? true,
        },
        handlers: {
            uploadFile: fileUploadHandler,
        },
        initial: {
            toolbarVisible: true,
            splitModeEnabled: true,
        },
        wysiwygConfig: {
            disableMarkdownAttrs: true,
            extensionOptions: {
                imgSize: {
                    parseInsertedUrlAsImage,
                },
            },
            ...wysiwygConfig,
        },
        markupConfig: {
            splitMode: splitModeOrientation,
            renderPreview,
            parseInsertedUrlAsImage,
            ...markupConfig,
        },
    });

    useLogs(mdEditor.logger);

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
            <div className={b('editor-markup')}>
                <StrictMode>
                    <div className={b('editor')} style={{height: height ?? 'initial'}}>
                        <MarkdownEditorView
                            autofocus
                            toolbarsPreset={toolbarsPreset}
                            className={b('editor-view')}
                            stickyToolbar={Boolean(stickyToolbar)}
                            settingsVisible={settingsVisible}
                            editor={mdEditor}
                        />
                        <WysiwygDevTools editor={mdEditor} />
                        <WysiwygSelection editor={mdEditor} className={b('pm-selection')} />
                    </div>
                </StrictMode>

                <hr />

                <div className={b('preview')}>
                    {editorMode === 'wysiwyg' && <pre className={b('markup')}>{mdRaw}</pre>}
                </div>
            </div>
        </div>
    );
});

Preset.displayName = 'PresetDemo';
