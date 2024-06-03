import React from 'react';

import {EditorView} from 'prosemirror-view';
import {useEffectOnce, useUpdate} from 'react-use';

import {type ClassNameProps, isNodeSelection, isTextSelection, isWholeSelection} from '../src';
import type {Editor} from '../src/bundle';

export type WysiwygSelectionProps = ClassNameProps & {
    editor: Editor;
};

export function WysiwygSelection({editor, className}: WysiwygSelectionProps) {
    const rerender = useUpdate();
    useEffectOnce(() => {
        rerender();
    });

    const view = editor?.currentMode === 'wysiwyg' && editor._wysiwygView;

    React.useLayoutEffect(() => {
        if (!editor) return undefined;
        editor.on(
            // @ts-expect-error TODO: add public event for selection change
            'rerender-toolbar',
            rerender,
        );
        editor.on('change-editor-mode', rerender);
        return () => {
            editor.off(
                // @ts-expect-error TODO: add public event for selection change
                'rerender-toolbar',
                rerender,
            );
            editor.off('change-editor-mode', rerender);
        };
    }, [editor, rerender]);

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
