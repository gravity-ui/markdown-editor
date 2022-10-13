import React from 'react';
import block from 'bem-cn-lite';
import {RadioButton, TextInput} from '@gravity-ui/uikit';

import {
    BasePreset,
    BehaviorPreset,
    MarkdownBlocksPreset,
    MarkdownMarksPreset,
    MarkupString,
    YfmEditorComponent,
    useYfmEditor,
    YfmPreset,
    Extension,
} from '../src';
import {PlaygroundHtmlPreview} from './HtmlPreview';
import {logger} from '../src/index';

import './Playground.scss';
import {keys} from './keys';

const b = block('playground');

export type PlaygroundProps = {
    initial?: MarkupString;
    allowHTML?: boolean;
    breaks?: boolean;
    linkify?: boolean;
};

const enum PreviewType {
    Markup = 'markup',
    Html = 'html',
}

logger.setLogger({
    metrics: console.info,
    ...console,
});

export const Playground = React.memo<PlaygroundProps>((props) => {
    const {initial, allowHTML, breaks, linkify} = props;
    const [previewType, setPreviewType] = React.useState<string>(PreviewType.Markup);
    const [yfmRaw, setYfmRaw] = React.useState<MarkupString>(initial || '');

    const extensions = React.useMemo<Extension>(
        () => (builder) =>
            builder
                .use(BasePreset, {})
                .use(BehaviorPreset, {
                    history: {
                        undoKey: keys.undo,
                        redoKey: keys.redo,
                    },
                })
                .use(MarkdownBlocksPreset, {
                    image: false,
                    heading: false,
                    breaks: {preferredBreak: breaks ? 'soft' : 'hard'},
                })
                .use(MarkdownMarksPreset, {
                    bold: {boldKey: keys.bold},
                    italic: {italicKey: keys.italic},
                    strike: {strikeKey: keys.strike},
                    underline: {underlineKey: keys.underline},
                    code: {codeKey: keys.code},
                })
                .use(YfmPreset, {}),
        [breaks],
    );

    const editor = useYfmEditor({
        linkify,
        allowHTML,
        extensions,
        initialContent: yfmRaw,
        onDocChange: (e) => setYfmRaw(e.getValue()),
    });

    return (
        <div className={b()}>
            <div className={b('header')}>
                YFM Editor Playground
                <span className={b('preview-type')}>
                    <RadioButton size="s" value={previewType} onUpdate={setPreviewType}>
                        <RadioButton.Option value={PreviewType.Markup}>Markup</RadioButton.Option>
                        <RadioButton.Option value={PreviewType.Html}>HTML</RadioButton.Option>
                    </RadioButton>
                </span>
            </div>
            <div className={b('editor')}>
                <YfmEditorComponent editor={editor} autofocus className={b('editor')} />
            </div>

            <hr />

            <div className={b('preview')}>
                {previewType === PreviewType.Markup && (
                    <TextInput
                        size="s"
                        multiline
                        minRows={10}
                        value={yfmRaw}
                        onUpdate={(value) => {
                            editor.replace(value);
                            setYfmRaw(value);
                        }}
                        className={b('markup')}
                    />
                )}

                {previewType === PreviewType.Html && (
                    <PlaygroundHtmlPreview
                        className={b('html', 'yfm yfm_no-list-reset')}
                        allowHTML={allowHTML}
                        breaks={breaks}
                        linkify={linkify}
                        value={yfmRaw}
                    />
                )}
            </div>
        </div>
    );
});

Playground.displayName = 'Playground';

// const fileUploadHandler: FileUploadHandler = async (file) => {
//     console.info('[Playground] Uploading file: ' + file.name);
//     await randomDelay(1000, 3000);
//     return {url: URL.createObjectURL(file)};
// };
