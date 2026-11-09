import {isNodeSelection} from '@gravity-ui/markdown-editor';
import type {Keymap} from '@gravity-ui/markdown-editor/core';
import type {Command, EditorState} from '@gravity-ui/markdown-editor/pm/state';
import {headerTitleSizes} from '@gravity-ui/markdown-plugin-header';

import {headerNodeType, headerTitleNodeType} from '../HeaderSpecs';

import {setHeaderTitleAttrs} from './commands';

/** Position of the selected header or of the header whose title holds the selection. */
function titleHeaderPos(state: EditorState) {
    const {selection} = state;
    if (isNodeSelection(selection))
        return selection.node.type === headerNodeType(state.schema) ? selection.from : undefined;
    const {$from, $to} = selection;
    for (let depth = $from.sharedDepth($to.pos); depth > 0; depth--) {
        if ($from.node(depth).type === headerTitleNodeType(state.schema))
            return $from.before(depth - 1);
    }
    return undefined;
}

export const headerTitleKeymap = (): Keymap =>
    Object.fromEntries(
        headerTitleSizes.map((size) => [
            `Mod-Alt-${size}`,
            ((state, dispatch, view) => {
                const pos = titleHeaderPos(state);
                if (!view?.editable || pos === undefined) return false;
                return setHeaderTitleAttrs(pos, {size})(state, dispatch);
            }) satisfies Command,
        ]),
    );
