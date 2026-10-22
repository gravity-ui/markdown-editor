import {Plugin, PluginKey} from 'prosemirror-state';

import type {Serializer} from '#core';
import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {type RendererItem, getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderClassName, headerNodeName} from '../../HeaderSpecs';
import {findHeaderPos, headerAt, mapHeaderPos} from '../../commands';

import {HeaderToolbar} from './HeaderToolbar';

const activeHeaderKey = new PluginKey<number | null>('header-controls');

type ActiveHeader = {pos: number; node: Node; dom: HTMLElement};

class HeaderHoverView {
    private current: ActiveHeader | null = null;
    private settingsOpen = false;
    private hideTimer: ReturnType<typeof setTimeout> | undefined;
    private readonly renderItem: RendererItem;
    private readonly view: EditorView;
    private pointerTarget: Element | null = null;

    constructor(
        view: EditorView,
        fileUploadHandler: FileUploadHandler | undefined,
        serializer: Serializer,
    ) {
        this.view = view;
        this.renderItem = getReactRendererFromState(view.state).createItem(
            'header-hover',
            () =>
                this.current && (
                    <HeaderToolbar
                        node={this.current.node}
                        pos={this.current.pos}
                        anchorElement={this.current.dom}
                        editorView={view}
                        fileUploadHandler={fileUploadHandler}
                        serializer={serializer}
                        onClose={this.hide}
                        onSettingsOpenChange={this.setSettingsOpen}
                    />
                ),
        );
        view.dom.ownerDocument.addEventListener('pointerover', this.pointerOver);
        view.dom.addEventListener('focusin', this.focusIn);
        this.update(view);
    }

    update(view: EditorView) {
        const pos = activeHeaderKey.getState(view.state);
        if (pos === null || pos === undefined || !view.editable) {
            if (this.current) this.hide();
            return;
        }
        const node = headerAt(view.state.doc, pos);
        const dom = view.nodeDOM(pos);
        if (!node || !(dom instanceof HTMLElement)) {
            if (this.current) this.hide();
        } else if (
            pos !== this.current?.pos ||
            node !== this.current.node ||
            dom !== this.current.dom
        ) {
            this.current = {pos, node, dom};
            this.renderItem.rerender();
        }
    }

    destroy() {
        clearTimeout(this.hideTimer);
        this.view.dom.ownerDocument.removeEventListener('pointerover', this.pointerOver);
        this.view.dom.removeEventListener('focusin', this.focusIn);
        this.renderItem.remove();
    }

    private focusIn = () => {
        const pos = findHeaderPos(this.view.state.selection);
        if (pos !== null && !this.settingsOpen)
            this.view.dispatch(this.view.state.tr.setMeta(activeHeaderKey, pos));
    };

    private hide = () => {
        clearTimeout(this.hideTimer);
        this.current = null;
        this.settingsOpen = false;
        this.renderItem.rerender();
    };

    private setSettingsOpen = (open: boolean) => {
        this.settingsOpen = open;
        if (!open && !this.isInside(this.pointerTarget)) this.scheduleHide();
    };

    private isInside(target: Element | null) {
        return Boolean(
            target &&
            (this.current?.dom.contains(target) ||
                target.closest(
                    '.g-md-header-toolbar, .g-md-header-settings, .g-md-button-settings',
                )),
        );
    }

    private scheduleHide() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            const focused = this.view.dom.ownerDocument.activeElement;
            if (
                !this.settingsOpen &&
                !(
                    this.view.hasFocus() &&
                    findHeaderPos(this.view.state.selection) === this.current?.pos
                ) &&
                !this.isInside(this.pointerTarget) &&
                !focused?.closest('.g-md-header-toolbar')
            )
                this.hide();
        }, 120);
    }

    private pointerOver = (event: PointerEvent) => {
        if (!this.view.editable) return;
        const target = event.target instanceof Element ? event.target : null;
        this.pointerTarget = target;
        clearTimeout(this.hideTimer);
        if (this.settingsOpen) return;
        const dom = target?.closest<HTMLElement>(`.${HeaderClassName.Root}`);
        if (dom && this.view.dom.contains(dom)) {
            const $pos = this.view.state.doc.resolve(this.view.posAtDOM(dom, 0));
            for (let depth = $pos.depth; depth > 0; depth--) {
                if ($pos.node(depth).type.name !== headerNodeName) continue;
                const pos = $pos.before(depth);
                const node = headerAt(this.view.state.doc, pos);
                if (node && (this.current?.pos !== pos || this.current.dom !== dom)) {
                    this.view.dispatch(this.view.state.tr.setMeta(activeHeaderKey, pos));
                }
                return;
            }
        }
        if (!this.isInside(target)) this.scheduleHide();
    };
}

export const headerTooltipPlugin = (
    fileUploadHandler: FileUploadHandler | undefined,
    serializer: Serializer,
) =>
    new Plugin({
        key: activeHeaderKey,
        state: {
            init: (_, state) => findHeaderPos(state.selection),
            apply: (tr, previous) => {
                const explicit = tr.getMeta(activeHeaderKey) as number | null | undefined;
                if (explicit !== undefined) return explicit;
                if (tr.selectionSet) return findHeaderPos(tr.selection);
                return previous === null ? null : mapHeaderPos(tr, previous);
            },
        },
        view: (view) => new HeaderHoverView(view, fileUploadHandler, serializer),
    });
