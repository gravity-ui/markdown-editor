import {memo} from 'react';

import cloneDeep from 'lodash/cloneDeep';

import {
    MarkdownEditorView,
    logger,
    mGptToolbarItem,
    markupToolbarConfigs,
    useMarkdownEditor,
    wGptItemData,
    wysiwygToolbarConfigs,
} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

const wToolbarConfig = cloneDeep(wysiwygToolbarConfigs.wToolbarConfig);
wToolbarConfig.unshift([wGptItemData]);

const wCommandMenuConfig = cloneDeep(wysiwygToolbarConfigs.wCommandMenuConfig);
wCommandMenuConfig.unshift(wGptItemData);

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.unshift([mGptToolbarItem]);

export const MobileEditor = memo(() => {
    const editor = useMarkdownEditor({
        mobile: true,
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    className={className}
                    mobile
                />
            )}
        />
    );
});

MobileEditor.displayName = 'MobileEditor';
