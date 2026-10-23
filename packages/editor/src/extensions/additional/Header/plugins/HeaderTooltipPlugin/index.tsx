import {Plugin} from 'prosemirror-state';

import type {Node} from '#pm/model';
import type {EditorView} from '#pm/view';
import {type RendererItem, getReactRendererFromState} from 'src/extensions/behavior/ReactRenderer';
import type {FileUploadHandler} from 'src/utils/upload';

import {HeaderClassName, headerNodeName} from '../../HeaderSpecs';
import {headerAt} from '../../commands';

import {HeaderToolbar} from './HeaderToolbar';

type ActiveHeader = {pos: number; node: Node; dom: HTMLElement};

class HeaderHoverView {
    private current: ActiveHeader | null = null;
    private settingsOpen = false;
    private hideTimer: ReturnType<typeof setTimeout> | undefined;
    private readonly renderItem: RendererItem;
    private readonly view: EditorView;
    private pointerTarget: Element | null = null;

    constructor(view: EditorView, fileUploadHandler?: FileUploadHandler) {
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
                        onClose={this.hide}
                        onSettingsOpenChange={this.setSettingsOpen}
                    />
                ),
        );
        view.dom.ownerDocument.addEventListener('pointerover', this.pointerOver);
    }

    update(view: EditorView) {
        if (!this.current) return;
        if (!view.editable) {
            this.hide();
            return;
        }
        const node = headerAt(view.state.doc, this.current.pos);
        const dom = view.nodeDOM(this.current.pos);
        if (!node || !(dom instanceof HTMLElement)) {
            this.hide();
        } else if (node !== this.current.node || dom !== this.current.dom) {
            this.current = {pos: this.current.pos, node, dom};
            this.renderItem.rerender();
        }
    }

    destroy() {
        clearTimeout(this.hideTimer);
        this.view.dom.ownerDocument.removeEventListener('pointerover', this.pointerOver);
        this.renderItem.remove();
    }

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
                target.closest('.g-md-header-toolbar, .g-md-header-settings')),
        );
    }

    private scheduleHide() {
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            const focused = this.view.dom.ownerDocument.activeElement;
            if (
                !this.settingsOpen &&
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
                    this.current = {pos, node, dom};
                    this.renderItem.rerender();
                }
                return;
            }
        }
        if (!this.isInside(target)) this.scheduleHide();
    };
}

export const headerTooltipPlugin = (fileUploadHandler?: FileUploadHandler) =>
    new Plugin({view: (view) => new HeaderHoverView(view, fileUploadHandler)});
