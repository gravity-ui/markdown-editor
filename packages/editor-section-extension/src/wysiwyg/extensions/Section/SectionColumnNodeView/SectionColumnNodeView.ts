import {cn} from '@gravity-ui/markdown-editor';
import type {Node} from '@gravity-ui/markdown-editor/pm/model';
import type {EditorView, NodeView} from '@gravity-ui/markdown-editor/pm/view';
import {
    sectionColumnAttrs,
    sectionColumnContentClassName,
    sectionGridSize,
} from '@gravity-ui/markdown-plugin-section';

import {sectionNodeType} from '../SectionSpecs';
import {resizeSectionColumns} from '../commands';

const b = cn('section-column-nodeview');
const previewSize = '--g-md-section-preview-size';

type Pair = [number, number];
type Resize = {
    pointerId: number;
    section: HTMLElement;
    first: HTMLElement;
    startX: number;
    step: number;
    direction: number;
    previous: Pair;
    sizes: Pair;
};

export class SectionColumnNodeView implements NodeView {
    readonly dom: HTMLElement;
    readonly contentDOM: HTMLElement;

    private readonly handle: HTMLElement;
    private node: Node;
    private readonly view: EditorView;
    private readonly getPos: () => number | undefined;
    private resize?: Resize;

    constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
        this.node = node;
        this.view = view;
        this.getPos = getPos;
        const document = view.dom.ownerDocument;
        this.dom = document.createElement('div');
        this.dom.className = `${b()} ${sectionColumnAttrs(node.attrs).class}`;
        this.contentDOM = document.createElement('div');
        this.contentDOM.className = sectionColumnContentClassName;
        this.handle = document.createElement('span');
        this.handle.className = b('handle');
        this.handle.contentEditable = 'false';
        this.handle.setAttribute('aria-hidden', 'true');
        this.dom.append(this.contentDOM, this.handle);

        this.handle.addEventListener('pointerdown', this.onPointerDown);
        this.handle.addEventListener('pointermove', this.onPointerMove);
        this.handle.addEventListener('pointerup', this.onPointerUp);
        this.handle.addEventListener('pointercancel', this.onPointerCancel);
        this.handle.addEventListener('lostpointercapture', this.onPointerCancel);
    }

    update(node: Node): boolean {
        if (node.type !== this.node.type) return false;
        if (!node.sameMarkup(this.node)) {
            this.dom.classList.remove(...sectionColumnAttrs(this.node.attrs).class.split(' '));
            this.dom.classList.add(...sectionColumnAttrs(node.attrs).class.split(' '));
        }
        this.node = node;
        return true;
    }

    stopEvent(event: Event) {
        return event.target === this.handle;
    }

    ignoreMutation(mutation: Parameters<NonNullable<NodeView['ignoreMutation']>>[0]) {
        if (mutation.type === 'selection') return false;
        return (
            mutation.target === this.handle ||
            (mutation.type === 'attributes' && mutation.target === this.dom)
        );
    }

    destroy() {
        this.finishResize(false);
        this.handle.removeEventListener('pointerdown', this.onPointerDown);
        this.handle.removeEventListener('pointermove', this.onPointerMove);
        this.handle.removeEventListener('pointerup', this.onPointerUp);
        this.handle.removeEventListener('pointercancel', this.onPointerCancel);
        this.handle.removeEventListener('lostpointercapture', this.onPointerCancel);
    }

    private onPointerDown = (event: PointerEvent) => {
        if (
            !this.view.editable ||
            event.button !== 0 ||
            event.pointerType === 'touch' ||
            this.resize
        )
            return;
        const position = this.findBoundary();
        const section = this.dom.parentElement;
        const first = this.dom.previousElementSibling;
        if (!position || !section || !(first instanceof HTMLElement)) return;

        const rtl = getComputedStyle(section).direction === 'rtl';
        const left = first.getBoundingClientRect();
        const right = this.dom.getBoundingClientRect();
        const gap = rtl ? left.left - right.right : right.left - left.right;
        const step = (section.getBoundingClientRect().width + gap) / sectionGridSize;
        if (step <= 0) return;

        const previous: Pair = [position.first.attrs.size, this.node.attrs.size];
        event.preventDefault();
        this.handle.setPointerCapture(event.pointerId);
        this.resize = {
            pointerId: event.pointerId,
            section,
            first,
            startX: event.clientX,
            step,
            direction: rtl ? -1 : 1,
            previous,
            sizes: previous,
        };
        this.handle.className = b('handle', {dragging: true});
        this.handle.dataset.sizes = previous.join(' / ');
    };

    private onPointerMove = (event: PointerEvent) => {
        const resize = this.resize;
        if (resize?.pointerId !== event.pointerId) return;
        const rect = resize.section.getBoundingClientRect();
        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {
            this.finishResize(true);
            return;
        }
        const offset = Math.round(
            ((event.clientX - resize.startX) * resize.direction) / resize.step,
        );
        const total = resize.previous[0] + resize.previous[1];
        const size = Math.max(1, Math.min(total - 1, resize.previous[0] + offset));
        resize.sizes = [size, total - size];
        resize.first.style.setProperty(previewSize, String(resize.sizes[0]));
        this.dom.style.setProperty(previewSize, String(resize.sizes[1]));
        this.handle.dataset.sizes = resize.sizes.join(' / ');
    };

    private onPointerUp = (event: PointerEvent) => {
        if (this.resize?.pointerId === event.pointerId) this.finishResize(true);
    };

    private onPointerCancel = (event: PointerEvent) => {
        if (this.resize?.pointerId === event.pointerId) this.finishResize(false);
    };

    private finishResize(commit: boolean) {
        const resize = this.resize;
        if (!resize) return;
        this.resize = undefined;

        resize.first.style.removeProperty(previewSize);
        this.dom.style.removeProperty(previewSize);
        this.handle.className = b('handle');
        delete this.handle.dataset.sizes;
        if (this.handle.hasPointerCapture(resize.pointerId)) {
            this.handle.releasePointerCapture(resize.pointerId);
        }

        const boundary = commit && this.findBoundary();
        if (boundary && this.view.editable) {
            resizeSectionColumns(
                boundary.pos,
                boundary.index,
                resize.sizes,
                resize.previous,
            )(this.view.state, this.view.dispatch);
        }
    }

    private findBoundary() {
        const pos = this.getPos();
        if (pos === undefined) return null;
        const {doc, schema} = this.view.state;
        const $pos = doc.resolve(pos);
        const index = $pos.index() - 1;
        if ($pos.parent.type !== sectionNodeType(schema) || index < 0) return null;
        return {pos: $pos.before(), index, first: $pos.parent.child(index)};
    }
}
