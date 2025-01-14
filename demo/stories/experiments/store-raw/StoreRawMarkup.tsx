import React, {useCallback, useLayoutEffect, useState} from 'react';

import {toaster} from '@gravity-ui/uikit/toaster-singleton-react-18';

import {MarkdownEditorView, type RenderPreview, useMarkdownEditor} from '../../../../src';
import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {plugins} from '../../../defaults/md-plugins';
import {useMarkdownEditorValue} from '../../../hooks/useMarkdownEditorValue';

const initialMarkup = `
## YFM Table

### Simple table

#|
|| **Header1** | **Header2** ||
|| Text        | Text        ||
|#

### Multiline content

#|
||
Text
on two lines
|
- Potatoes
- Carrot
- Onion
- Cucumber
||
|#

### Nested tables

#|
|| 1  | Text before other table

#|
|| 5  | 6 ||
|| 7  | 8 ||
|#

Text after other table

||
|| 3 | 4 ||
|#
`;

type StoreRawMarkupDemoProps = {};

export const StoreRawMarkupDemo = React.memo<StoreRawMarkupDemoProps>(() => {
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
            markupConfig: {renderPreview},
        },
        [],
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

StoreRawMarkupDemo.displayName = 'Experiments / StoreRawMarkup';
