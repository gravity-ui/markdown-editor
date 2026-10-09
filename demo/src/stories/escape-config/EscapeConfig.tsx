import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {markup} from '../../defaults/content';

export type EscapeConfigProps = {
    commonEscapeRegexp: string;
    startOfLineEscapeRegexp: string;
};

export const EscapeConfig: React.FC<EscapeConfigProps> = ({
    startOfLineEscapeRegexp,
    commonEscapeRegexp,
}) => {
    const editor = useMarkdownEditor(
        {
            initial: {markup},
            wysiwygConfig: {
                escapeConfig: {
                    commonEscape: new RegExp(commonEscapeRegexp),
                    startOfLineEscape: new RegExp(startOfLineEscapeRegexp),
                },
            },
        },
        [commonEscapeRegexp, startOfLineEscapeRegexp],
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
