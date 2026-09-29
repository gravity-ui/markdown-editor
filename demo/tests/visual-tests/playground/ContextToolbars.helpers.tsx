import {type ToolbarsPreset, wysiwygToolbarConfigs} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {full} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';

import {Playground} from './Playground.helpers';

const {
    wBoldItemData,
    wBulletListItemData,
    wHeading1ItemData,
    wItalicItemData,
    wQuoteItemData,
    wStrikethroughItemData,
    wTextItemData,
} = wysiwygToolbarConfigs;

const toolbarsPreset: ToolbarsPreset = {
    items: full.items,
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSelection]: [
            [Action.text],
            [Action.bold, Action.italic],
            [Action.colorify],
        ],
        [Toolbar.wysiwygSlash]: [[Action.heading1, Action.heading2, Action.quote]],
    },
};

const deprecatedOptions = {
    extensionOptions: {
        selectionContext: {config: [[wStrikethroughItemData]]},
        commandMenu: {actions: [wTextItemData]},
    },
};

export function SelectionToolbarPlayground() {
    return (
        <Playground
            initial="Select this text"
            wysiwygConfig={{
                extensionOptions: {
                    selectionContext: {config: [[wItalicItemData, wBoldItemData]]},
                },
            }}
        />
    );
}

export function CommandMenuPlayground() {
    return (
        <Playground
            initial=""
            wysiwygConfig={{
                extensionOptions: {
                    commandMenu: {
                        actions: [wHeading1ItemData, wBulletListItemData, wQuoteItemData],
                    },
                },
            }}
        />
    );
}

export function PresetSelectionToolbarPlayground() {
    return <Playground initial="Select this text" toolbarsPreset={toolbarsPreset} />;
}

export function PresetCommandMenuPlayground() {
    return <Playground initial="" toolbarsPreset={toolbarsPreset} />;
}

export function PresetOverOptionsSelectionToolbarPlayground() {
    return (
        <Playground
            initial="Select this text"
            toolbarsPreset={toolbarsPreset}
            wysiwygConfig={deprecatedOptions}
        />
    );
}

export function PresetOverOptionsCommandMenuPlayground() {
    return (
        <Playground initial="" toolbarsPreset={toolbarsPreset} wysiwygConfig={deprecatedOptions} />
    );
}
