import {memo} from 'react';

import {ArrowUp} from '@gravity-ui/icons';
import {Button, Icon} from '@gravity-ui/uikit';

import {MarkdownEditorView, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';

import {toolbarPreset} from './preset';

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
                    settingsVisible={false}
                    editor={editor}
                    className={className}
                    toolbarsPreset={toolbarPreset}
                    mobile
                    toolbarEnd={
                        <Button view="action" pin="round-round">
                            <Icon data={ArrowUp} size={16} />
                        </Button>
                    }
                />
            )}
        />
    );
});

MobileEditor.displayName = 'MobileEditor';
