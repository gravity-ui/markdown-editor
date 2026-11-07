import {useId} from 'react';

import {
    MarkdownEditorView,
    type RenderPreview,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {EditorView} from '@gravity-ui/markdown-editor/cm/view';
import {Flex, Text} from '@gravity-ui/uikit';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';
import {SplitModePreviewLazy} from '../../../components/SplitModePreviewLazy';

const renderPreview: RenderPreview = ({getValue, md}) => (
    <SplitModePreviewLazy
        getValue={getValue}
        allowHTML={md.html}
        linkify={md.linkify}
        linkifyTlds={md.linkifyTlds}
        breaks={md.breaks}
        needToSanitizeHtml
    />
);

export type ContenteditableAttributesProps = {
    contenteditableAttributes?: Record<string, string>;
};

export const ContenteditableAttributes = ({
    contenteditableAttributes,
}: ContenteditableAttributesProps) => {
    const id = useId();

    const attributes = {
        'aria-labelledby': `${id}-label`,
        'aria-required': 'true',
        'aria-describedby': `${id}-comment ${id}-hint`,
    };

    const editor = useMarkdownEditor(
        {
            initial: {mode: 'wysiwyg', markup: ''},
            wysiwygConfig: {
                extensionOptions: {
                    baseStyles: {attributes},
                },
            },
            markupConfig: {
                extensions: [EditorView.contentAttributes.of(attributes)],
                renderPreview,
            },
        },
        [id],
    );

    return (
        <PlaygroundLayout
            title="Contenteditable attributes"
            editor={editor}
            devTools={false}
            view={({className}) => (
                <Flex direction="column" gap={2}>
                    <Text id={`${id}-label`} variant="subheader-2">
                        Tell us about your project
                    </Text>
                    <MarkdownEditorView
                        autofocus
                        stickyToolbar
                        settingsVisible
                        editor={editor}
                        className={className}
                        contenteditableAttributes={contenteditableAttributes}
                    />
                    <Text id={`${id}-comment`}>Tell your team what this project is about.</Text>
                    <Text id={`${id}-hint`} color="secondary">
                        Include the goal, who it helps, and what happens next. You can use Markdown
                        to format your description.
                    </Text>
                </Flex>
            )}
        />
    );
};
