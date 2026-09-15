import {useState} from 'react';

import {
    type MarkdownEditorPreset,
    MarkdownEditorView,
    type ToolbarsPreset,
    useMarkdownEditor,
    wHeading1ItemData,
    wItalicItemData,
} from '@gravity-ui/markdown-editor';
import {
    ActionName as Action,
    ToolbarName as Toolbar,
} from '@gravity-ui/markdown-editor/_/modules/toolbars/constants.js';
import {full} from '@gravity-ui/markdown-editor/_/modules/toolbars/presets.js';

const custom: ToolbarsPreset = {
    items: {
        ...full.items,
        customHeading: {
            ...full.items[Action.heading2],
            view: {
                ...full.items[Action.heading2].view,
                title: 'Custom heading',
                aliases: ['topic'],
            },
        },
    },
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSelection]: [[Action.italic, Action.bold]],
        [Toolbar.wysiwygSlash]: [['customHeading', Action.paragraph]],
    },
};
const alternate: ToolbarsPreset = {
    items: full.items,
    orders: {
        ...full.orders,
        [Toolbar.wysiwygSelection]: [[Action.strike]],
        [Toolbar.wysiwygSlash]: [[Action.heading1]],
    },
};
const empty: ToolbarsPreset = {
    items: full.items,
    orders: {...full.orders, [Toolbar.wysiwygSelection]: [], [Toolbar.wysiwygSlash]: []},
};
const mainOnly: ToolbarsPreset = {
    items: full.items,
    orders: {[Toolbar.wysiwygMain]: [[Action.bold]]},
};
const zeroCustom: ToolbarsPreset = {
    items: {paragraph: full.items[Action.paragraph]},
    orders: {
        [Toolbar.wysiwygSelection]: [[Action.paragraph]],
        [Toolbar.wysiwygSlash]: [[Action.paragraph]],
    },
};
const refreshed: ToolbarsPreset = {...custom};
const conditional: ToolbarsPreset = {
    items: {
        hidden: {...full.items.bold, wysiwyg: {...full.items.bold.wysiwyg, condition: () => false}},
        disabled: {
            ...full.items.italic,
            wysiwyg: {...full.items.italic.wysiwyg, condition: 'enabled', isEnable: () => false},
        },
    },
    orders: {[Toolbar.wysiwygSelection]: [['hidden'], ['disabled']]},
};
const configs = {
    custom,
    alternate,
    empty,
    mainOnly,
    zeroCustom,
    refreshed,
    conditional,
    default: undefined,
};

export function ContextualToolbars({
    initialConfig = 'custom',
    preset = 'full',
    legacy = false,
    mobile = false,
    initialMode = 'wysiwyg',
    initialMarkup = 'Select this text',
}: {
    initialConfig?: keyof typeof configs;
    preset?: MarkdownEditorPreset;
    legacy?: boolean | 'empty';
    mobile?: boolean;
    initialMode?: 'wysiwyg' | 'markup';
    initialMarkup?: string;
}) {
    const [config, setConfig] = useState(initialConfig);
    const editor = useMarkdownEditor({
        preset,
        mobile,
        initial: {markup: initialMarkup, mode: initialMode},
        wysiwygConfig: legacy
            ? {
                  extensionOptions: {
                      selectionContext: {config: legacy === 'empty' ? [] : [[wItalicItemData]]},
                      commandMenu: {actions: legacy === 'empty' ? [] : [wHeading1ItemData]},
                  },
              }
            : undefined,
    });

    return (
        <div style={{width: 800}}>
            {(
                [
                    'custom',
                    'alternate',
                    'empty',
                    'zeroCustom',
                    'refreshed',
                    'conditional',
                    'default',
                ] as const
            ).map((name) => (
                <button
                    key={name}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => setConfig(name)}
                >
                    Use {name} toolbar
                </button>
            ))}
            <MarkdownEditorView
                editor={editor}
                toolbarsPreset={configs[config]}
                autofocus
                stickyToolbar={false}
            />
        </div>
    );
}
