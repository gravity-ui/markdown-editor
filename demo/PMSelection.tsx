import React from 'react';

import type {EditorView} from 'prosemirror-view';

import {ClassNameProps, isNodeSelection, isTextSelection, isWholeSelection} from '../src';

export type PMSelectionProps = ClassNameProps & {
    view: EditorView;
};

export function PMSelection({view, className}: PMSelectionProps) {
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
