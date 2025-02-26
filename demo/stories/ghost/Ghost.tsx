import {MarkdownEditorView, markupToolbarConfigs, useMarkdownEditor} from 'src/index';
import {cloneDeep} from 'src/lodash';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {useLogs} from '../../hooks/useLogs';

import {initialMdContent} from './content';
import {ghostPopupExtension, ghostPopupToolbarItem} from './ghostExtension';

const mToolbarConfig = cloneDeep(markupToolbarConfigs.mToolbarConfig);
mToolbarConfig.unshift([ghostPopupToolbarItem]);

export const Ghost = () => {
    const editor = useMarkdownEditor({
        initial: {markup: initialMdContent, mode: 'markup'},
        markupConfig: {extensions: [ghostPopupExtension]},
    });

    useLogs(editor.logger);

    return (
        <PlaygroundLayout
            editor={editor}
            view={() => (
                <MarkdownEditorView
                    stickyToolbar
                    settingsVisible
                    editor={editor}
                    markupToolbarConfig={mToolbarConfig}
                />
            )}
        />
    );
};
