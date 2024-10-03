import {EditorState} from '@codemirror/state';
import {WidgetType} from '@codemirror/view';

import {GptWidgetOptions} from '../../..';
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
} from '../../../../cm/view';
import {ReactRendererFacet} from '../../../../markup';

import {hideMarkupGptExample} from './commands';
import {HideMarkupGptExampleEffect, ShowMarkupGptExampleEffect} from './effects';
import {renderPopup} from './popup';

const DECO_CLASS_NAME = 'react-popup-example-deco';

class SpanWidget extends WidgetType {
    private className = '';
    private textContent = '';

    constructor(className: string, textContent: string) {
        super();
        this.className = className;
        this.textContent = textContent;
    }

    toDOM() {
        const spanElem = document.createElement('span');
        spanElem.className = this.className;
        spanElem.textContent = this.textContent;
        return spanElem;
    }
}

export function mGptExamplePlugin(gptProps: GptWidgetOptions) {
    return ViewPlugin.fromClass(
        class implements PluginValue {
            readonly _view: EditorView;
            readonly _renderItem;

            decos: DecorationSet = Decoration.none;
            _anchor: Element | null = null;
            disablePromptPresets = true;
            markup: string | null = null;
            state: null | EditorState = null;

            selectedPosition = {
                from: 0,
                to: 0,
            };

            constructor(view: EditorView) {
                this._view = view;
                this._renderItem = view.state
                    .facet(ReactRendererFacet)
                    .createItem('react-popup-example-in-markup-mode', () => this.renderPopup());
            }

            update(update: ViewUpdate) {
                if (update.docChanged || update.selectionSet) {
                    this.decos = Decoration.none;
                    return;
                }

                this.decos = this.decos.map(update.changes);
                this.state = update.state;

                const {from, to} = update.state.selection.main;

                for (const tr of update.transactions) {
                    for (const eff of tr.effects) {
                        if (eff.is(ShowMarkupGptExampleEffect)) {
                            this._setSelectedText(this._getDecorationText(update));

                            if (from === to) {
                                this.disablePromptPresets = true;

                                const decorationWidget = Decoration.widget({
                                    widget: new SpanWidget(DECO_CLASS_NAME, ' '),
                                });

                                this.decos = Decoration.set([decorationWidget.range(from)]);

                                return;
                            }

                            this.disablePromptPresets = false;

                            this.decos = Decoration.set([
                                {
                                    from,
                                    to,
                                    value: Decoration.mark({class: DECO_CLASS_NAME}),
                                },
                            ]);
                        }

                        if (eff.is(HideMarkupGptExampleEffect)) {
                            this.decos = Decoration.none;
                        }
                    }
                }
            }

            docViewUpdate() {
                this._anchor = this._view.dom.getElementsByClassName(DECO_CLASS_NAME).item(0);
                this._renderItem.rerender();
            }

            destroy() {
                this._clearSelectedText();
                this._renderItem.remove();
            }

            renderPopup() {
                if (!this._anchor || this.markup === null) {
                    return null;
                }

                return renderPopup(this._anchor as HTMLElement, {
                    ...gptProps,
                    disablePromptPresets: this.disablePromptPresets,
                    onClose: () => hideMarkupGptExample(this._view),
                    markup: this.markup,
                    onApplyResult: (changedMarkup) => this._onApplyResult(changedMarkup),
                });
            }

            _getDecorationText(update: ViewUpdate): string {
                const {from, to} = update.state.selection.main;
                return update.state.doc.sliceString(from, to);
            }

            _clearSelectedText() {
                this.markup = null;
            }

            _setSelectedText(str: string) {
                this.markup = str;
            }

            _onApplyResult(changedMarkup: string) {
                if (!this.state) {
                    hideMarkupGptExample(this._view);
                    return;
                }
                const {from, to} = this.state.selection.main;
                const changes = [{from: from, to: to, insert: changedMarkup}];
                const transaction = this.state.update({
                    changes: changes,
                });

                this._view.dispatch(transaction);
                hideMarkupGptExample(this._view);
            }
        },
        {
            decorations: (value) => value.decos,
        },
    );
}
