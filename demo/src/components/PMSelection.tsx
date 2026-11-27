import {useLayoutEffect} from 'react';

import {
    type ClassNameProps,
    isNodeSelection,
    isTextSelection,
    isWholeSelection,
} from '@gravity-ui/markdown-editor';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import {useUpdate} from 'react-use';

import {useWysiwygEditorView} from '../hooks/useWysiwygEditorView';
import {type PlaygroundEditor, subscribeToSelection} from '../utils/editor';

export type WysiwygSelectionProps = ClassNameProps & {
    editor: PlaygroundEditor;
};

export function WysiwygSelection({editor, className}: WysiwygSelectionProps) {
    const view = useWysiwygEditorView(editor);
    const rerender = useUpdate();
    useLayoutEffect(() => subscribeToSelection(editor, rerender), [editor, rerender]);

    if (!view) return null;

    return <PMSelection view={view} className={className} />;
}

type PMSelectionProps = ClassNameProps & {
    view: EditorView;
};

function PMSelection({view, className}: PMSelectionProps) {
    const sel = view.state.selection;
    const renderFromTo = () => (
        <>
            From: {sel.from}
            <br />
            To: {sel.to}
        </>
    );

    if (isWholeSelection(sel)) {
        return (
            <div className={className}>
                AllSelection
                <br />
                {renderFromTo()}
            </div>
        );
    }

    if (isNodeSelection(sel)) {
        return (
            <div className={className}>
                NodeSelection
                <br />
                Node: {sel.node.type.name}
                <br />
                {renderFromTo()}
            </div>
        );
    }

    if (isTextSelection(sel)) {
        const {$cursor} = sel;
        if ($cursor) {
            return (
                <div className={className}>
                    CursorSelection
                    <br />
                    Cursor: {$cursor.pos}
                </div>
            );
        } else {
            return (
                <div className={className}>
                    TextSelection
                    <br />
                    {renderFromTo()}
                </div>
            );
        }
    }

    return (
        <div className={className}>
            Selection
            <br />
            {renderFromTo()}
        </div>
    );
}
