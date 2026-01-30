import {ReactRendererFacet} from '@gravity-ui/markdown-editor';
import {
    Decoration,
    type DecorationSet,
    type EditorView,
    type PluginValue,
    ViewPlugin,
    type ViewUpdate,
    WidgetType,
} from '@gravity-ui/markdown-editor/cm/view';

import {hideGhostPopup} from './commands';
import {HideGhostPopupEffect, ShowGhostPopupEffect} from './effects';
import {renderPopup} from './popup';

const DECO_CLASS_NAME = 'ghost-example';

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

export const GhostPopupPlugin = ViewPlugin.fromClass(
    class implements PluginValue {
        decos: DecorationSet = Decoration.none;
        readonly _view: EditorView;
        readonly _renderItem;
        _anchor: Element | null = null;

        constructor(view: EditorView) {
            this._view = view;
            this._renderItem = view.state
                .facet(ReactRendererFacet)
                .createItem('ghost-popup-example-in-markup-mode', () => this.renderPopup());
        }

        update(update: ViewUpdate) {
            if (update.docChanged || update.selectionSet) {
                this.decos = Decoration.none;
                return;
            }

            this.decos = this.decos.map(update.changes);
            const {from, to} = update.state.selection.main;

            for (const tr of update.transactions) {
                for (const eff of tr.effects) {
                    if (eff.is(ShowGhostPopupEffect)) {
                        if (from === to) {
                            const decorationWidget = Decoration.widget({
                                widget: new SpanWidget(DECO_CLASS_NAME, ''),
                            });

                            this.decos = Decoration.set([decorationWidget.range(from)]);

                            return;
                        }

                        this.decos = Decoration.set([
                            {
                                from,
                                to,
                                value: Decoration.mark({class: DECO_CLASS_NAME}),
                            },
                        ]);
                    }

                    if (eff.is(HideGhostPopupEffect)) {
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
            this._renderItem.remove();
        }

        renderPopup() {
            return this._anchor
                ? renderPopup(this._anchor as HTMLElement, {
                      onClose: () => hideGhostPopup(this._view),
                  })
                : null;
        }
    },
    {
        decorations: (value) => value.decos,
    },
);
