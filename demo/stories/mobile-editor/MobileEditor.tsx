import React from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';
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

export const MobileEditor = React.memo(() => {
    const editor = useMarkdownEditor({
        mobile: true,
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={({className}) => (
                <MarkdownEditorView
                    autofocus
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    toaster={toaster}
                    className={className}
                    mobile
                />
            )}
        />
    );
});

MobileEditor.displayName = 'MobileEditor';
