import {memo} from 'react';

import {MarkdownEditorView, useMarkdownEditor} from '@gravity-ui/markdown-editor';

import {PlaygroundLayout} from '../../../components/PlaygroundLayout';

import {DemoSections} from './sections';

const initialMarkup = `
Text before the layout

{% layout gap=l %}

{% block col=8 %}

Responsibilities

{% layout gap=l %}

{% block %}

Analytics

{% endblock %}

{% endlayout %}

{% layout gap=l %}

{% block %}

Planning

{% endblock %}

{% endlayout %}

{% endblock %}

{% endlayout %}

Text after the layout
`.trim();

export const NestedSections = memo(() => {
    const editor = useMarkdownEditor({
        preset: 'full',
        initial: {markup: initialMarkup, mode: 'wysiwyg'},
        wysiwygConfig: {
            extensions: (builder) => builder.use(DemoSections, {}),
        },
    });

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

NestedSections.displayName = 'NestedSections';
