import {memo, useState} from 'react';

import {
    MarkdownEditorView,
    getMGptToolbarItem,
    getWGptItemData,
    gptExtension,
    mGptExtension,
    markupToolbarConfigs,
    useMarkdownEditor,
    wysiwygToolbarConfigs,
} from 'src/index';
import {cloneDeep} from 'src/lodash';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {useLogs} from '../../hooks/useLogs';

import {initialMdContent} from './content';
import {gptWidgetProps} from './gptWidgetOptions';

const wGptItem = getWGptItemData({
    hotkey: 'Mod+m',
});

const mGptItem = getMGptToolbarItem({
    hotkey: 'Mod+m',
});

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.unshift([wGptItem]);

const wCommandMenuConfig = cloneDeep(wysiwygToolbarConfigs.wCommandMenuConfig);
wCommandMenuConfig.unshift(wGptItem);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.unshift([mGptItem]);

export const GPT = memo(() => {
    const [showedAlertGpt, setShowedAlertGpt] = useState(true);

    const gptExtensionProps = gptWidgetProps({
        showedGptAlert: Boolean(showedAlertGpt),
        onCloseGptAlert: () => {
            setShowedAlertGpt(false);
        },
    });

    const markupExtension = mGptExtension(gptExtensionProps);
    const wSelectionMenuConfig = [[wGptItem], ...wysiwygToolbarConfigs.wSelectionMenuConfig];

    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent},
        markupConfig: {extensions: markupExtension},
        wysiwygConfig: {
            extensions: (builder) => builder.use(gptExtension, gptExtensionProps),
            extensionOptions: {
                commandMenu: {
                    actions: wCommandMenuConfig,
                },
                selectionContext: {
                    config: wSelectionMenuConfig,
                },
            },
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
                    markupToolbarConfig={mToolbarConfig}
                    wysiwygToolbarConfig={wToolbarConfig}
                />
            )}
        />
    );
});

GPT.displayName = 'GPT';
