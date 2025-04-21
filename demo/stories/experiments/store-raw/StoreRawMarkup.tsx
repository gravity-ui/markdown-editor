import {memo, useCallback, useLayoutEffect, useState} from 'react';

import {MarkdownEditorView, type RenderPreview, useMarkdownEditor} from 'src/index';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {plugins} from '../../../defaults/md-plugins';
import {useMarkdownEditorValue} from '../../../hooks/useMarkdownEditorValue';
import { HiddenCommentBlock } from 'src/extensions/additional/HiddenCommentBlock';

const initialMarkup = `
## YFM Table
### Simple table
#|
|| **Header1** | **Header2** ||
|| Text        | Text        ||
|#
### Multiline content
#|
|| Text
on two lines |
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

### Table inside quote
> #|
> || **Header1** | **Header2** ||
> || Text        | Text        ||
> |#

### Table inside tabs

{% list tabs %}

- tab1

  #|
    || **Header1** | **Header2** ||
    || Text        | Text        ||
    |#

- tab2

  #|
    || Text
    on two lines |
    - Potatoes
    - Carrot
    - Onion
    - Cucumber
    ||
    |#


{% endlist %}
`;

type StoreRawMarkupDemoProps = {
    preserveMarkupFormattingFeatures: string[];
};

export const StoreRawMarkupDemo = memo<StoreRawMarkupDemoProps>((props) => {
    const {preserveMarkupFormattingFeatures} = props;
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
            experimental: {preserveMarkupFormattingFeatures},
            wysiwygConfig: {extensions: (builder) => builder.use(HiddenCommentBlock)}
        },
        [preserveMarkupFormattingFeatures],
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

StoreRawMarkupDemo.displayName = 'Experiments / StoreRawMarkup';
