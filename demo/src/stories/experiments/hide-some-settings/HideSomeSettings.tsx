import {memo, useCallback} from 'react';

import {
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import type {SettingItems} from '@gravity-ui/markdown-editor/_/bundle/settings/index.js';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../../components/SplitModePreviewLazy';

type HideSomeSettingsDemoProps = {
    settingsVisilbe: SettingItems[];
};

export const HideSomeSettingsDemo = memo<HideSomeSettingsDemoProps>((props) => {
    const {settingsVisilbe} = props;

    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md}) => (
            <SplitModePreviewLazy
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
            />
        ),
        [],
    );

    const editor = useMarkdownEditor(
        {
            initial: {markup: ''},
            markupConfig: {renderPreview},
        },
        [],
    );

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible={settingsVisilbe}
                    editor={editor}
                    className={className}
                />
            )}
        />
    );
});

HideSomeSettingsDemo.displayName = 'HideSomeSettingsDemo';
