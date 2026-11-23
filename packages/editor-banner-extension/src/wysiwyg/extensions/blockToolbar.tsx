import {
    type KeyboardEvent,
    type ReactElement,
    createContext,
    useContext,
    useLayoutEffect,
    useRef,
} from 'react';

import {useFloatingParentNodeId, useFloatingTree} from '@floating-ui/react';
import {
    BaseTooltipPlugin,
    Toolbar,
    type ToolbarData,
    ToolbarDataType,
    type ToolbarIconData,
    type ToolbarListItemData,
    cn,
} from '@gravity-ui/markdown-editor';
import type {ExtensionDeps} from '@gravity-ui/markdown-editor/core';
import type {NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {type Command, Plugin, type Selection} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {PopupPlacement} from '@gravity-ui/uikit';

import {closeOnTabOut} from '../utils/popup';

import './blockToolbar.scss';

const b = cn('banner-block-toolbar');

/** The open toolbar of each editor, for Tab to move focus into it. */
type Toolbars = WeakMap<EditorView, HTMLElement>;

const ToolbarsContext = createContext<Toolbars>(new WeakMap());

const isEnable = () => true;

const focusToolbar =
    (toolbars: Toolbars): Command =>
    (_state, _dispatch, view) => {
        const button = view && toolbars.get(view)?.querySelector('button');
        if (!button) return false;
        button.focus();
        return true;
    };

export type ToolbarOption<V> = {value: V; icon: ToolbarIconData; title: () => string};

type OptionsButton<V> = {
    id: string;
    title: (value: string) => string;
    options: ToolbarOption<V>[];
    current: V;
    onSelect: (value: V) => void;
};

export const optionsButton = <V,>({
    id,
    title,
    options,
    current,
    onSelect,
}: OptionsButton<V>): ToolbarListItemData<EditorView> => {
    const active = options.find(({value}) => value === current) ?? options[0];
    return {
        id,
        type: ToolbarDataType.ListButton,
        icon: active.icon,
        title: title(active.title()),
        withArrow: true,
        alwaysActive: true,
        data: options.map((option) => ({
            id: `${id}-${option.value}`,
            icon: option.icon,
            title: option.title,
            isActive: () => option.value === current,
            isEnable,
            exec: () => onSelect(option.value),
        })),
    };
};

const focusSteps: Record<string, Record<string, number>> = {
    menu: {ArrowDown: 1, ArrowUp: -1},
    toolbar: {ArrowRight: 1, ArrowLeft: -1},
};

/**
 * Arrows move the focus between the items of an open menu, and between the buttons of the toolbar;
 * the focus wraps around at the ends.
 */
function moveFocus(event: KeyboardEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    const menu = target.closest('[role="menu"]');
    const step = focusSteps[menu ? 'menu' : 'toolbar'][event.key];
    if (!step) return false;
    const items = Array.from(
        menu
            ? menu.querySelectorAll<HTMLElement>('[role="menuitem"][tabindex="0"]')
            : event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled)'),
    );
    const index = items.indexOf(target);
    if (index < 0) return false;
    event.preventDefault();
    items[(index + step + items.length) % items.length].focus();
    return true;
}

type BlockToolbarProps = {
    view: EditorView;
    qa: string;
    data: ToolbarData<EditorView>;
};

export function BlockToolbar({view, qa, data}: BlockToolbarProps) {
    const toolbars = useContext(ToolbarsContext);
    const ref = useRef<HTMLDivElement>(null);
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return undefined;
        toolbars.set(view, element);
        return () => {
            toolbars.delete(view);
            if (element.contains(document.activeElement)) view.focus();
        };
    }, [view, toolbars]);
    const tree = useFloatingTree();
    const nodeId = useFloatingParentNodeId();
    const focusEditor = () => view.focus();
    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        if (moveFocus(event)) return;
        const menu =
            event.key === 'Escape' &&
            tree?.nodesRef.current.find((node) => node.parentId === nodeId && node.context?.open)
                ?.context;
        if (!menu) {
            closeOnTabOut(event, focusEditor);
            return;
        }
        event.stopPropagation();
        menu.onOpenChange(false, event.nativeEvent, 'escape-key');
    };
    return (
        <div className={b()} ref={ref} role="toolbar" onKeyDown={onKeyDown}>
            <Toolbar editor={view} focus={focusEditor} qa={qa} data={data} />
        </div>
    );
}

type BlockTooltipOptions = {
    idPrefix: string;
    nodeType: (schema: Schema) => NodeType;
    placement: PopupPlacement;
    content: (
        view: EditorView,
        node: BaseTooltipPlugin.BaseTooltipNode,
        deps: ExtensionDeps,
    ) => ReactElement | null;
};

class BlockTooltipView extends BaseTooltipPlugin.BaseTooltipPluginView {
    declare protected popupPlacement: PopupPlacement | undefined;
    private engaged = false;
    private focusSelection: Selection | null = null;
    private outsideHidden = false;

    constructor(
        view: EditorView,
        {idPrefix, nodeType, placement, content}: BlockTooltipOptions,
        toolbars: Toolbars,
        deps: ExtensionDeps,
    ) {
        super(view, {
            idPrefix,
            nodeType: nodeType(view.state.schema),
            content: (editor, node) => (
                <ToolbarsContext.Provider value={toolbars}>
                    {content(editor, node, deps)}
                </ToolbarsContext.Provider>
            ),
        });
        this.popupPlacement = placement;
        const openChange = this.popupOpenChangeHandler;
        this.popupOpenChangeHandler = (open, event, reason) => {
            const focused = toolbars.get(this.view)?.contains(document.activeElement);
            openChange?.(open, event, reason);
            this.outsideHidden = this.manualHidden && reason === 'outside-press';
            if (!open && reason === 'escape-key' && focused) this.view.focus();
        };
    }

    show() {
        if (!this.manualHidden || !this.currentNode) return;
        this.manualHidden = false;
        this.outsideHidden = false;
        this.stopTrackingViewFocus();
        this.render();
    }

    focus(pointer: boolean) {
        if (this.engaged) {
            if (this.outsideHidden) this.show();
            return;
        }
        this.focusSelection = pointer ? this.view.state.selection : null;
        this.updateTooltipView();
    }

    protected hidePopupManual() {
        this.outsideHidden = false;
        super.hidePopupManual();
    }

    protected setCurrentNode(nodeType: NodeType) {
        const {state} = this.view;
        const {$from, $to} = state.selection;
        let skipped = false;
        for (let depth = $from.depth; !skipped && depth > $to.depth; depth--) {
            skipped = $from.node(depth).type === nodeType;
        }
        if (skipped) {
            this.currentNode = null;
            this.manualHidden = false;
            this.stopTrackingViewFocus();
            return;
        }
        const hiddenWithoutFocus =
            (this.manualHidden || !this.currentNode) && !this.view.hasFocus();
        super.setCurrentNode(nodeType);
        if (hiddenWithoutFocus && this.currentNode && !this.manualHidden) {
            this.manualHidden = true;
            this.startTrackingViewFocus();
        }
    }

    protected updateTooltipView() {
        if (!this.engaged) {
            const {selection} = this.view.state;
            if (!this.view.hasFocus() || this.focusSelection?.eq(selection)) return;
            this.engaged = true;
            this.focusSelection = null;
        }
        const previous = this.currentNode;
        const hidden = this.manualHidden;
        this.setCurrentNode(this.view.state.schema.nodes[this.nodeType.name]);
        const current = this.currentNode;
        if (!current) {
            if (previous) this.render();
            return;
        }
        const same =
            previous?.pos === current.pos &&
            previous.dom === current.dom &&
            hidden === this.manualHidden &&
            previous.node.sameMarkup(current.node);
        if (!same) this.render();
    }
}

function pointerFocusEvents(onFocus: (view: EditorView, pointer: boolean) => void) {
    let pointer = false;
    return {
        mousedown: (view: EditorView) => {
            pointer = !view.hasFocus();
            return false;
        },
        focus: (view: EditorView) => {
            const byPointer = pointer;
            pointer = false;
            onFocus(view, byPointer);
            return false;
        },
    };
}

export function blockTooltip(options: BlockTooltipOptions) {
    const toolbars: Toolbars = new WeakMap();
    return {
        plugin: (deps: ExtensionDeps) => {
            let tooltip: BlockTooltipView | undefined;
            return new Plugin({
                view: (view) => {
                    tooltip = new BlockTooltipView(view, options, toolbars, deps);
                    return tooltip;
                },
                props: {
                    handleDOMEvents: pointerFocusEvents((_view, pointer) =>
                        tooltip?.focus(pointer),
                    ),
                },
            });
        },
        focus: focusToolbar(toolbars),
    };
}
