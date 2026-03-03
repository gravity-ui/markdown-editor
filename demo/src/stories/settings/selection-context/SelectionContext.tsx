import {
    MarkdownEditorView,
    type SelectionContextOptions,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {loremIpsum} from '../../../defaults/content';

export type SelectionContextProps = Pick<SelectionContextOptions, 'flip' | 'placement'>;

export const SelectionContext: React.FC<SelectionContextProps> = ({flip, placement}) => {
    const editor = useMarkdownEditor(
        {
            initial: {markup: loremIpsum},
            wysiwygConfig: {
                extensionOptions: {
                    selectionContext: {
                        flip,
                        placement,
                    },
                },
            },
        },
        [flip, placement],
    );

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
                />
            )}
        />
    );
};
