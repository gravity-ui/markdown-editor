import {memo} from 'react';

import {MarkdownEditorView, logger, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';

logger.setLogger({
    metrics: console.info,
    action: (data) => console.info(`Action: ${data.action}`, data),
    ...console,
});

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
