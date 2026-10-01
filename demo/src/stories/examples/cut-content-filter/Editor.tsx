import {memo, useCallback} from 'react';

import {
    CutNode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreview} from '../../../components/SplitModePreview';
import {getPlugins} from '../../../defaults/md-plugins';

import {markup} from './markup';
import {cutContentSlots} from './slots';

const previewPlugins = [...getPlugins(), cutContentSlots];

export type EditorWithCutContentFilterProps = {};

export const EditorWithCutContentFilter = memo<EditorWithCutContentFilterProps>(
    function EditorWithCutContentFilter() {
        const renderPreview = useCallback<RenderPreview>(
            ({getValue, md}) => (
                <SplitModePreview
                    getValue={getValue}
                    plugins={previewPlugins}
                    breaks={md.breaks}
                    linkify={md.linkify}
                />
            ),
            [],
        );

        const editor = useMarkdownEditor(
            {
                initial: {mode: 'wysiwyg', markup},
                markupConfig: {renderPreview, splitMode: 'horizontal'},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder
                            .configureMd(cutContentSlots)
                            // Editable content matches what the filter keeps
                            .overrideNodeSpec(CutNode.CutContent, (spec) => ({
                                ...spec,
                                content: 'paragraph*',
                            })),
                },
            },
            [renderPreview],
        );

        return (
            <PlaygroundLayout
                title="Cut content filter"
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
    },
);
