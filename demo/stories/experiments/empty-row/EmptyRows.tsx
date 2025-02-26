import {memo, useCallback, useLayoutEffect, useState} from 'react';

import {MarkdownEditorView, type RenderPreview, useMarkdownEditor} from 'src/index';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {plugins} from '../../../defaults/md-plugins';
import {useMarkdownEditorValue} from '../../../hooks/useMarkdownEditorValue';

const initialMarkup = `
&nbsp;

&nbsp;

&nbsp;

Example of usage empty row experiment

&nbsp;

&nbsp;

&nbsp;
`;

type PreserveEmptyRowsDemoProps = {
    preserveEmptyRows: boolean;
};

export const PreserveEmptyRowsDemo = memo<PreserveEmptyRowsDemoProps>((props) => {
    const {preserveEmptyRows} = props;

    const [mdMarkup, setMdMarkup] = useState(initialMarkup);

    const renderPreview = useCallback<RenderPreview>(
        ({getValue, md}) => (
            <SplitModePreview
                getValue={getValue}
                allowHTML={md.html}
                linkify={md.linkify}
                linkifyTlds={md.linkifyTlds}
                breaks={md.breaks}
                needToSanitizeHtml
                plugins={plugins}
            />
        ),
        [],
    );

    const editor = useMarkdownEditor(
        {
            initial: {markup: mdMarkup},
            experimental: {preserveEmptyRows},
            markupConfig: {renderPreview},
        },
        [preserveEmptyRows],
    );

    // for preserve edited content
    const value = useMarkdownEditorValue(editor);
    useLayoutEffect(() => {
        setMdMarkup(value);
    }, [value]);

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
});

PreserveEmptyRowsDemo.displayName = 'PreserveEmptyRows';
