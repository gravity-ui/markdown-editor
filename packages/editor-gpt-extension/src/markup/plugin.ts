import {
    Decoration,
    type DecorationSet,
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
    WidgetType,
} from '@codemirror/view';

import {WIDGET_DECO_CLASS_NAME} from '../constants';
import type {MarkupGptHost} from '../host';
import type {CommonAnswer, GptWidgetOptions} from '../types';
import {isEmptyGptPrompts} from '../utils';

import {hideMarkupGpt} from './commands/gpt';
import {HideMarkupGptEffect, ShowMarkupGptEffect} from './effects';
import {renderPopup} from './popup';

class SpanWidget extends WidgetType {
    toDOM() {
        const span = document.createElement('span');
        span.className = WIDGET_DECO_CLASS_NAME;
        span.textContent = ' ';
        return span;
    }
}

export function mGptPlugin<A extends CommonAnswer = CommonAnswer, P = unknown>(
    props: GptWidgetOptions<A, P>,
    host: MarkupGptHost,
) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            readonly _view: EditorView;
            readonly _renderItem;
            _anchor: HTMLElement | null = null;
            _sessionId = 0;
            _selection: {from: number; to: number; markup: string} | null = null;
            decos: DecorationSet = Decoration.none;

            constructor(view: EditorView) {
                this._view = view;
                this._renderItem = host
                    .getRenderer(view.state)
                    .createItem('gpt-in-markup-mode', () => this.renderPopup());
            }

            update(update: ViewUpdate) {
                if (update.docChanged || !update.state.selection.eq(update.startState.selection)) {
                    this._close();
                    return;
                }
                for (const transaction of update.transactions) {
                    for (const effect of transaction.effects) {
                        if (effect.is(ShowMarkupGptEffect)) this._open();
                        if (effect.is(HideMarkupGptEffect)) this._close();
                    }
                }
            }

            docViewUpdate() {
                this._anchor = this._view.dom.querySelector(`.${WIDGET_DECO_CLASS_NAME}`);
                this._renderItem.rerender();
            }

            destroy() {
                this._selection = null;
                this._renderItem.remove();
            }

            _open() {
                const {from, to} = this._view.state.selection.main;
                if (isEmptyGptPrompts(props, from === to)) return;
                this._sessionId++;
                this._selection = {from, to, markup: this._view.state.doc.sliceString(from, to)};
                const decoration =
                    from === to
                        ? Decoration.widget({widget: new SpanWidget()})
                        : Decoration.mark({class: WIDGET_DECO_CLASS_NAME});
                this.decos = Decoration.set([decoration.range(from, to)]);
            }

            _close() {
                if (!this._selection) return;
                this._selection = null;
                this._anchor = null;
                this.decos = Decoration.none;
                this._renderItem.rerender();
            }

            renderPopup() {
                const selection = this._selection;
                if (!this._anchor || !selection) return null;
                const isCurrent = () => this._selection === selection;
                return renderPopup(this._anchor, {
                    ...props,
                    sessionKey: this._sessionId,
                    markup: selection.markup,
                    disablePromptPresets: selection.from === selection.to,
                    onUpdate: (answer) => {
                        if (isCurrent()) props.onUpdate?.(answer);
                    },
                    onClose: () => {
                        if (!isCurrent()) return;
                        hideMarkupGpt(this._view);
                        this._view.contentDOM.focus({preventScroll: true});
                        props.onClose?.();
                    },
                    onApplyResult: (markup) => {
                        if (!isCurrent()) return;
                        this._view.dispatch({
                            changes: {from: selection.from, to: selection.to, insert: markup},
                            effects: HideMarkupGptEffect.of(null),
                        });
                        this._view.contentDOM.focus({preventScroll: true});
                        props.onApplyResult?.(markup);
                    },
                });
            }
        },
        {decorations: (value) => value.decos},
    );
}
