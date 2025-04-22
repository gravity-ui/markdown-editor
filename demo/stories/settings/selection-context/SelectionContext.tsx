import {PlaygroundLayout} from 'demo/components/PlaygroundLayout';
import {loremIpsum} from 'demo/defaults/content';
import {MarkdownEditorView, type SelectionContextOptions, useMarkdownEditor} from 'src/index';

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
