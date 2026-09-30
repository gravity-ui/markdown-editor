import {memo, useState} from 'react';

import {
    MarkdownEditorView,
    type ToolbarsPreset,
    gptExtension,
    mGptExtension,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
    full,
    gptItemMarkup,
    gptItemView,
    gptItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {useLogs} from '../../hooks/useLogs';

import {initialMdContent} from './content';
import {gptWidgetProps} from './gptWidgetOptions';

const toolbarsPreset: ToolbarsPreset = {
    items: {
        ...full.items,
        [Action.gpt]: {view: gptItemView, wysiwyg: gptItemWysiwyg, markup: gptItemMarkup},
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygMain]: [[Action.gpt], ...full.orders[Toolbar.wysiwygMain]],
        [Toolbar.markupMain]: [[Action.gpt], ...full.orders[Toolbar.markupMain]],
        [Toolbar.wysiwygSelection]: [[Action.gpt], ...full.orders[Toolbar.wysiwygSelection]],
        [Toolbar.wysiwygSlash]: [[Action.gpt, ...full.orders[Toolbar.wysiwygSlash].flat()]],
    },
};

export const GPT = memo(() => {
    const [showedAlertGpt, setShowedAlertGpt] = useState(true);

    const gptExtensionProps = gptWidgetProps({
        showedGptAlert: Boolean(showedAlertGpt),
        onCloseGptAlert: () => {
            setShowedAlertGpt(false);
        },
    });

    const markupExtension = mGptExtension(gptExtensionProps);

    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent},
        markupConfig: {extensions: markupExtension},
        wysiwygConfig: {
            extensions: (builder) => builder.use(gptExtension, gptExtensionProps),
        },
    });

    useLogs(editor.logger);

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                    toolbarsPreset={toolbarsPreset}
                />
            )}
        />
    );
});

GPT.displayName = 'GPT';
