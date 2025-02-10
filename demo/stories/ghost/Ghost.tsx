import React from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';
import cloneDeep from 'lodash/cloneDeep';

import {MarkdownEditorView, logger, markupToolbarConfigs, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';

import {initialMdContent} from './content';
import {ghostPopupExtension, ghostPopupToolbarItem} from './ghostExtension';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.unshift([ghostPopupToolbarItem]);

export const Ghost = () => {
    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent, mode: 'markup'},
        markupConfig: {extensions: [ghostPopupExtension]},
    });

    return (
        <PlaygroundLayout
            editor={editor}
            view={() => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    toaster={toaster}
                    markupToolbarConfig={mToolbarConfig}
                />
            )}
        />
    );
};
