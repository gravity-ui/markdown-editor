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
import type {Node, NodeType, Schema} from '@gravity-ui/markdown-editor/pm/model';
import {
    type Command,
    type EditorState,
    Plugin,
    type Selection,
    type Transaction,
} from '@gravity-ui/markdown-editor/pm/state';
import type {EditorView} from '@gravity-ui/markdown-editor/pm/view';
import type {PopupPlacement} from '@gravity-ui/uikit';

import {closeOnTabOut} from '../utils/popup';

import './BlockToolbar.scss';

const b = cn('banner-block-toolbar');

export type Toolbars = WeakMap<EditorView, HTMLElement>;

export type Tooltips = WeakMap<EditorView, {show(): void}>;

const ToolbarsContext = createContext<Toolbars>(new WeakMap());

export const isEnable = () => true;

export const isActive = () => false;

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

const focusToolbar =
    (toolbars: Toolbars, last: boolean): Command =>
    (_state, _dispatch, view) => {
        const toolbar = view && toolbars.get(view);
        if (!toolbar) return false;
        const buttons = toolbar.querySelectorAll('button');
        const button = buttons[last ? buttons.length - 1 : 0];
        if (!button) return false;
        button.focus();
        return true;
    };

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
        <div className={b()} ref={ref} role="presentation" onKeyDown={onKeyDown}>
            <Toolbar editor={view} focus={focusEditor} qa={qa} data={data} />
        </div>
    );
}

type Placement = (state: EditorState, pos: number) => PopupPlacement;

type BlockTooltipOptions = {
    idPrefix: string;
    nodeType: (schema: Schema) => NodeType;
    placement: Placement;
    watch?: (state: EditorState, node: Node) => unknown;
    skip?: (state: EditorState) => boolean;
    toolbars?: Toolbars;
    tooltips?: Tooltips;
    keepWithin?: (view: EditorView) => Element | null | undefined;
    content: (
        view: EditorView,
        node: BaseTooltipPlugin.BaseTooltipNode,
        deps: ExtensionDeps,
    ) => ReactElement | null;
};

class BlockTooltipView extends BaseTooltipPlugin.BaseTooltipPluginView {
    declare protected popupPlacement: PopupPlacement | undefined;
    private readonly placement: Placement;
    private readonly watch?: (state: EditorState, node: Node) => unknown;
    private readonly skip?: (state: EditorState) => boolean;
    private watched: unknown;
    private engaged = false;
    private focusSelection: Selection | null = null;
    private outsideHidden = false;

    constructor(
        view: EditorView,
        {idPrefix, nodeType, placement, watch, skip, keepWithin, content}: BlockTooltipOptions,
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
        this.placement = placement;
        this.watch = watch;
        this.skip = skip;
        const openChange = this.popupOpenChangeHandler;
        this.popupOpenChangeHandler = (open, event, reason) => {
            const target = event instanceof FocusEvent ? event.relatedTarget : event?.target;
            const within = keepWithin?.(this.view);
            if (!open && target instanceof window.Node && within?.contains(target)) return;
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
        let skipped = Boolean(this.skip?.(state));
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
        const {popupPlacement: placement, manualHidden: hidden, watched} = this;
        this.setCurrentNode(this.view.state.schema.nodes[this.nodeType.name]);
        const current = this.currentNode;
        this.watched = current ? this.watch?.(this.view.state, current.node) : undefined;
        if (!current) {
            if (previous) this.render();
            return;
        }
        this.popupPlacement = this.placement(this.view.state, current.pos);
        const same =
            previous?.pos === current.pos &&
            previous.dom === current.dom &&
            hidden === this.manualHidden &&
            watched === this.watched &&
            previous.node.sameMarkup(current.node);
        if (!same || this.popupPlacement !== placement) this.render();
    }
}

export const isDomSelectionReset = (trs: readonly Transaction[]) =>
    trs.every((tr) => !tr.docChanged && !tr.getMeta('pointer') && !tr.scrolledIntoView);

export function pointerFocusEvents(onFocus: (view: EditorView, pointer: boolean) => void) {
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
    const toolbars: Toolbars = options.toolbars ?? new WeakMap();
    return {
        plugin: (deps: ExtensionDeps) => {
            let tooltip: BlockTooltipView | undefined;
            return new Plugin({
                view: (view) => {
                    tooltip = new BlockTooltipView(view, options, toolbars, deps);
                    options.tooltips?.set(view, tooltip);
                    return tooltip;
                },
                props: {
                    handleDOMEvents: pointerFocusEvents((_view, pointer) =>
                        tooltip?.focus(pointer),
                    ),
                },
            });
        },
        focus: (last = false) => focusToolbar(toolbars, last),
    };
}
