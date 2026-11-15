import {useMemo, useState} from 'react';

import {
    type GptWidgetOptions,
    MarkdownEditorView,
    gptExtension,
    mGptExtension,
    useMarkdownEditor,
} from '@gravity-ui/markdown-editor';
import {
    ActionName,
    ToolbarName,
    gptItemMarkup,
    gptItemView,
    gptItemWysiwyg,
} from '@gravity-ui/markdown-editor/toolbars';

import {useEditorHandle} from '../../src/hooks/useEditorHandle';

const toolbarsPreset = {
    items: {[ActionName.gpt]: {view: gptItemView, wysiwyg: gptItemWysiwyg, markup: gptItemMarkup}},
    orders: {
        [ToolbarName.wysiwygMain]: [[ActionName.gpt]],
        [ToolbarName.markupMain]: [[ActionName.gpt]],
    },
};

export function GptEditor({slow = false}: {slow?: boolean}) {
    const [applied, setApplied] = useState('');
    const [completed, setCompleted] = useState(0);
    const [updates, setUpdates] = useState(0);
    const options = useMemo<GptWidgetOptions>(() => {
        const request: NonNullable<GptWidgetOptions['onCustomPromptApply']> = async ({
            markup,
            customPrompt,
        }) => {
            await new Promise((resolve) => setTimeout(resolve, slow ? 1000 : 100));
            setCompleted((count) => count + 1);
            if (customPrompt === 'fail') throw new Error('Expected test failure');
            return {
                rawText:
                    customPrompt === 'long'
                        ? 'Long answer. '.repeat(600)
                        : markup.trim().toUpperCase(),
            };
        };
        return {
            answerRender: (answer) => <div>{answer.rawText}</div>,
            customPromptPlaceholder: 'Edit selected text',
            disabledPromptPlaceholder: 'Generate text',
            promptPresets: [{key: 'uppercase', display: 'Uppercase', data: 'uppercase'}],
            onCustomPromptApply: request,
            onPromptPresetClick: request,
            onTryAgain: async () => ({rawText: 'retried'}),
            onApplyResult: setApplied,
            onUpdate: () => setUpdates((count) => count + 1),
            onLike: async () => {},
        };
    }, [slow]);
    const editor = useMarkdownEditor({
        initial: {markup: 'original text'},
        markupConfig: {extensions: mGptExtension(options)},
        wysiwygConfig: {extensions: (builder) => builder.use(gptExtension, options)},
    });
    useEditorHandle(editor);
    return (
        <>
            <MarkdownEditorView
                editor={editor}
                stickyToolbar={false}
                toolbarsPreset={toolbarsPreset}
            />
            <output data-qa="gpt-applied" hidden>
                {applied}
            </output>
            <output data-qa="gpt-completed" hidden>
                {completed}
            </output>
            <output data-qa="gpt-updates" hidden>
                {updates}
            </output>
        </>
    );
}
