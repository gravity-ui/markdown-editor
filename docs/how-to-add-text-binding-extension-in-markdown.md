# Develop / Extension with popup

## How to create an extension with popup for Markdown mode with text binding

Let's consider connecting an extension with text binding based on the Ghost extension — this is a test extension.

To begin with, we need the plugin itself, which we can implement as follows:

```ts
// plugin.ts

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

// We'll talk about it later
import {hideGhostPopup} from './commands';
import {HideGhostPopupEffect, ShowGhostPopupEffect} from './effects';
import {renderPopup} from './popup';

const DECO_CLASS_NAME = 'ghost-example';

// The class that will return the span element to the decoration
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

// Using ViewPlugin.fromClass imported from CodeMirror
// It accepts an anonymous class and PluginSpec
export const GhostPopupPlugin = ViewPlugin.fromClass(
    class implements PluginValue {
        // The class allows you to implement the following methods: update, docViewUpdate, destroy.

        decos: DecorationSet = Decoration.none;
        readonly _view: EditorView;
        readonly _renderItem;
        _anchor: Element | null = null;

        constructor(view: EditorView) {
            // Saving the view and creating a renderItem
            this._view = view;
            this._renderItem = view.state
                .facet(ReactRendererFacet)
                .createItem('ghost-popup-example-in-markup-mode', () => this.renderPopup());
        }


        // Called when transactions want to be applied to the view
        update(update: ViewUpdate) {
            if (update.docChanged || update.selectionSet) {
                this.decos = Decoration.none;
                return;
            }

            this.decos = this.decos.map(update.changes);
            const {from, to} = update.state.selection.main;

            for (const tr of update.transactions) {
                for (const eff of tr.effects) {
                    // Check for the desired effect
                    if (eff.is(ShowGhostPopupEffect)) {
                        if (from === to) {

                            // Creating a decoration
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

                    // If such an effect has come, then we cancel the decorations
                    if (eff.is(HideGhostPopupEffect)) {
                        this.decos = Decoration.none;
                    }
                }
            }
        }

        // Is called after accepting a new state in the view and dom
        docViewUpdate() {
            // Save the link to our decoration
            this._anchor = this._view.dom.getElementsByClassName(DECO_CLASS_NAME).item(0);
            this._renderItem.rerender();
        }

        // Called when unmounting the view
        destroy() {
            this._renderItem.remove();
        }

        // Function for popup render
        renderPopup() {
            // Passing the link to our popup
            return this._anchor
                ? renderPopup(this._anchor as HTMLElement, {
                      onClose: () => hideGhostPopup(this._view),
                  })
                : null;
        }
    },
    // Used to draw decorations
    {
        // Value is a reference to our anonymous class and returns the decoration
        decorations: (value) => value.decos,
    },
);
```

Let's create a popup that will be linked to the text.

This is a simple component that takes a link and renders a popup in its place

```ts
// popup.ts
import React from 'react';

import {Ghost} from '@gravity-ui/icons';
import {Button, Popup} from '@gravity-ui/uikit';

type Props = {
    onClose: () => void;
};

export function renderPopup(anchor: HTMLElement, props: Props) {
    return (
        <Popup open anchorRef={{current: anchor}}>
            <div style={{padding: '4px 8px', display: 'flex', alignItems: 'center'}}>
                <Ghost width={'16px'} height={'16px'} />
                <Button view="action" onClick={props.onClose} style={{marginLeft: '4px'}}>
                    Hide me
                </Button>
            </div>
        </Popup>
    );
}
```

Let's create a button for the markup toolbar.

```ts
// toolbar ts

import {Ghost} from '@gravity-ui/icons';

import {ToolbarDataType} from '@gravity-ui/markdown-editor';
import {MToolbarSingleItemData} from '@gravity-ui/markdown-editor/bundle/config/markup';

import {showGhostPopup} from './commands';

export const ghostPopupToolbarItem: MToolbarSingleItemData = {
    id: 'ghost',
    type: ToolbarDataType.SingleButton,
    title: 'Show ghost',
    icon: {data: Ghost},
    exec: (e) => showGhostPopup(e.cm),
    isActive: () => false,
    isEnable: () => true,
};
```

Let's create commands to display the plugin.

```ts
// commands.ts

import type {EditorView} from '@gravity-ui/markdown-editor/cm/view';


import {StateEffect} from '@gravity-ui/markdown-editor/cm/state';
// Empty effects without parameters
export const ShowGhostPopupEffect = StateEffect.define();
export const HideGhostPopupEffect = StateEffect.define();


// Creating events that will trigger the plugin
// Effect on the similarity of meta information for update, we use it as a Boolean flag
export const showGhostPopup = (view: EditorView) => {
    view.dispatch({effects: [ShowGhostPopupEffect.of(null)]});
};

export const hideGhostPopup = (view: EditorView) => {
    view.dispatch({effects: [HideGhostPopupEffect.of(null)]});
};

```

Everything is ready, all that remains is to connect the extension to the editor.

```ts

import {markupToolbarConfigs, useMarkdownEditor} from '@gravity-ui/markdown-editor';
import {ghostPopupExtension} from './ghostExtension';
import {ghostPopupToolbarItem} from './toolbar';

const mToolbarConfig = [...markupToolbarConfigs.mToolbarConfig,];

mToolbarConfig.mToolbarConfig.push(ghostPopupToolbarItem);

const mdEditor = useMarkdownEditor({
    // ...
    // Add extension
    markupConfig: {
        extensions: [ghostPopupExtension],
    },
});

return <MarkdownEditorView
    ...
    // Add a button to the toolbar
    markupToolbarConfig={mToolbarConfig}
    editor={mdEditor}
    ...
/>
```

Now you can use the plugin!
You can also check out the GPT implementation or see the Ghost example on the Playground and in the code.
