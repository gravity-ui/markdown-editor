import {memo, useCallback, useLayoutEffect, useState} from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {MarkdownEditorView, type RenderPreview, useMarkdownEditor} from '../../../../src';
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
                    toaster={toaster}
                    className={className}
                />
            )}
        />
    );
});

PreserveEmptyRowsDemo.displayName = 'PreserveEmptyRows';
