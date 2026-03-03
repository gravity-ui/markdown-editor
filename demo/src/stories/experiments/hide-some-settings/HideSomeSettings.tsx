import {memo, useCallback} from 'react';

import {
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import type {SettingItems} from '@gravity-ui/markdown-editor/_/bundle/settings/index.js';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {plugins} from '../../../defaults/md-plugins';

type HideSomeSettingsDemoProps = {
    settingsVisilbe: SettingItems[];
};

export const HideSomeSettingsDemo = memo<HideSomeSettingsDemoProps>((props) => {
    const {settingsVisilbe} = props;

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
