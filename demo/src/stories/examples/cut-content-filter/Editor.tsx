import {memo, useCallback, useMemo} from 'react';

import {
    CutNode,
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {
    PreservedMarkupSpecs,
    preservedMarkupNodeName,
} from '@gravity-ui/markdown-editor/extensions/additional/PreservedMarkup/index.js';
import type {BlockContentSlotsParams} from '@gravity-ui/markdown-editor/markdown-it/block-content-slots';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../../components/SplitModePreviewLazy';

import {markup} from './markup';
import {cutContentSlots} from './slots';

export type EditorWithCutContentFilterProps = {
    unmatched: BlockContentSlotsParams['unmatched'];
};

export const EditorWithCutContentFilter = memo<EditorWithCutContentFilterProps>(
    function EditorWithCutContentFilter({unmatched}) {
        const slotsPlugin = useMemo(() => cutContentSlots(unmatched), [unmatched]);
        const extraPlugins = useMemo(() => [slotsPlugin], [slotsPlugin]);

        const renderPreview = useCallback<RenderPreview>(
            ({getValue, md}) => (
                <SplitModePreviewLazy
                    getValue={getValue}
                    extraPlugins={extraPlugins}
                    breaks={md.breaks}
                    linkify={md.linkify}
                />
            ),
            [extraPlugins],
        );

        const editor = useMarkdownEditor(
            {
                initial: {mode: 'wysiwyg', markup},
                markupConfig: {renderPreview, splitMode: 'horizontal'},
                wysiwygConfig: {
                    extensions: (builder) =>
                        builder
                            .use(PreservedMarkupSpecs)
                            .configureMd(slotsPlugin)
                            // Editable content matches what the filter keeps
                            .overrideNodeSpec(CutNode.CutContent, (spec) => ({
                                ...spec,
                                content: `(paragraph | ${preservedMarkupNodeName})*`,
                            })),
                },
            },
            [slotsPlugin, renderPreview],
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
