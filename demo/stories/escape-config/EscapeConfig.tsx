import {MarkdownEditorView, useMarkdownEditor} from '../../../src';
import {PlaygroundLayout} from '../../components/PlaygroundLayout';
import {markup} from '../../defaults/content';
import {toaster} from '../../utils/toaster';

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
                    toaster={toaster}
                    className={className}
                />
            )}
        />
    );
};
