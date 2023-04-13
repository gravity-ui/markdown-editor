import {toggleMark} from 'prosemirror-commands';
import {TextSelection} from 'prosemirror-state';
import type {MarkType} from 'prosemirror-model';
import type {ActionSpec, ExtensionDeps} from '../../../core';
import {isMarkActive} from '../../../utils/marks';
import {LinkAttr} from './LinkSpecs';
import {removeLink} from './commands';
import {normalizeUrlFactory} from './utils';

export type LinkActionParams = {
    href: string;
    title?: string;
    text?: string;
};

export type LinkActionMeta = {
    hasSelection: boolean;
    text(): string;
};

export function linkCommand(markType: MarkType, deps: ExtensionDeps): ActionSpec {
    const normalizeUrl = normalizeUrlFactory(deps);
    return {
        isActive(state) {
            return Boolean(isMarkActive(state, markType));
        },
        isEnable(state) {
            return toggleMark(markType)(state);
        },
        run(state, dispatch, view, attrs?: LinkActionParams) {
            if (removeLink(state, dispatch, view)) return;
            if (!attrs) return;

            const {text, title} = attrs;
            const normalizeResult = normalizeUrl(attrs.href);
            if (normalizeResult) {
                if (text && state.selection.empty) {
                    dispatch(
                        state.tr.replaceSelectionWith(
                            state.schema.text(text, [
                                markType.create({
                                    [LinkAttr.Href]: normalizeResult.url,
                                    [LinkAttr.Title]: title,
                                }),
                            ]),
                            false,
                        ),
                    );
                    return;
                }

                toggleMark(markType, {
                    [LinkAttr.Href]: normalizeResult.url,
                    [LinkAttr.Title]: title,
                })(state, dispatch);
            }
        },
        meta(state): LinkActionMeta {
            const {selection} = state;

            return {
                hasSelection: !selection.empty && selection instanceof TextSelection,
                text() {
                    const fragment = selection.content().content;
                    return fragment.textBetween(0, fragment.size);
                },
            };
        },
    };
}
