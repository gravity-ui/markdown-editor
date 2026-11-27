import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {Fragment, Slice} from '@gravity-ui/markdown-editor/pm/model';
import {Plugin} from '@gravity-ui/markdown-editor/pm/state';
import {composeStories} from '@storybook/react';

import * as stories from '../../../src/stories/examples/table-cell-selection/TableCellSelection.stories';

export const TableCellSelectionStories = composeStories(stories);

export function CopyAsTextEditor() {
    const editor = useMarkdownEditor({
        initial: {mode: 'wysiwyg', markup: '| Header A | Header B |\n| --- | --- |\n| One | Two |'},
        wysiwygConfig: {
            tableCellSelection: true,
            extensions: (builder) =>
                builder.addPlugin(
                    () =>
                        new Plugin({
                            props: {
                                transformCopied(_slice, view) {
                                    return new Slice(
                                        Fragment.from(view.state.schema.text('replacement')),
                                        0,
                                        0,
                                    );
                                },
                            },
                        }),
                ),
        },
    });
    return <MarkdownEditorView editor={editor} qa="demo-md-editor" stickyToolbar={false} />;
}
