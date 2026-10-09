import {findParentNodeClosestToPos} from '#pm/utils';
import type {EditorView} from '#pm/view';
import {isTableCellNode, isTableNode, isTableRowNode} from 'src/table-utils';

/** Same as `DropCursorOptions` from _prosemirror-dropcursor_ package */
export type DropCursorParams = {
    /** The color of the cursor. Defaults to `black`. Use `false` to apply no color and rely only on class. */
    color?: string | false;

    /** The precise width of the cursor in pixels. Defaults to 1. */
    width?: number;

    /** A CSS class name to add to the cursor element. */
    class?: string;
};

type Rect = {
    left: number;
    right: number;
    top: number;
    bottom: number;
};

export class DropCursor {
    protected readonly editorView: EditorView;

    protected readonly width: number;
    protected readonly color: string | undefined;
    protected readonly class: string | undefined;

    protected cursorElem: HTMLElement | null = null;
    private cursorPos: number | null = null;

    constructor(editorView: EditorView, params: DropCursorParams = {}) {
        this.editorView = editorView;
        this.width = params.width ?? 1;
        this.color = params.color === false ? undefined : params.color || 'black';
        this.class = params.class;
    }

    getPos(): number | null {
        return this.cursorPos;
    }

    setPos(val: number) {
        if (typeof val !== 'number' || isNaN(val)) throw new Error('"val" is not a number');
        if (this.cursorPos === val) return;
        this.cursorPos = val;
        this.update();
    }

    clear() {
        this.cursorPos = null;
        this.cursorElem?.remove();
        this.cursorElem = null;
    }

    update() {
        const {cursorPos} = this;
        if (cursorPos === null) return;

        const $pos = this.editorView.state.doc.resolve(cursorPos);
        const isBlock = !$pos.parent.inlineContent;
        let rect: Rect | undefined;
        if (isBlock) {
            const before = $pos.nodeBefore,
                after = $pos.nodeAfter;
            if (before || after) {
                const node = this.editorView.nodeDOM(cursorPos - (before ? before.nodeSize : 0));
                if (node) {
                    const nodeRect = (node as HTMLElement).getBoundingClientRect();
                    let top = before ? nodeRect.bottom : nodeRect.top;
                    if (before && after)
                        top =
                            (top +
                                (
                                    this.editorView.nodeDOM(cursorPos) as HTMLElement
                                ).getBoundingClientRect().top) /
                            2;
                    rect = {
                        left: nodeRect.left,
                        right: nodeRect.right,
                        top: top - this.width / 2,
                        bottom: top + this.width / 2,
                    };
                }
            }
        }
        if (!rect) {
            const coords = this.editorView.coordsAtPos(cursorPos);
            rect = {
                left: coords.left - this.width / 2,
                right: coords.left + this.width / 2,
                top: coords.top,
                bottom: coords.bottom,
            };
        }

        this.render(rect, {isBlock});
    }

    protected render(rect: Rect, {isBlock}: {isBlock: boolean}) {
        const parent = this.editorView.dom.offsetParent!;
        if (!this.cursorElem) {
            this.cursorElem = parent.appendChild(document.createElement('div'));
            if (this.class) this.cursorElem.className = this.class;
            this.cursorElem.style.cssText =
                'position: absolute; z-index: 50; pointer-events: none;';
            if (this.color) {
                this.cursorElem.style.backgroundColor = this.color;
            }
        }
        this.cursorElem.classList.toggle('prosemirror-dropcursor-block', isBlock);
        this.cursorElem.classList.toggle('prosemirror-dropcursor-inline', !isBlock);
        let parentLeft, parentTop;
        if (
            !parent ||
            (parent === document.body && getComputedStyle(parent).position === 'static')
        ) {
            parentLeft = -pageXOffset;
            parentTop = -pageYOffset;
        } else {
            const rect = parent.getBoundingClientRect();
            parentLeft = rect.left - parent.scrollLeft;
            parentTop = rect.top - parent.scrollTop;
        }
        this.cursorElem.style.left = rect.left - parentLeft + 'px';
        this.cursorElem.style.top = rect.top - parentTop + 'px';
        this.cursorElem.style.width = rect.right - rect.left + 'px';
        this.cursorElem.style.height = rect.bottom - rect.top + 'px';
    }
}

export class TableRowDropCursor extends DropCursor {
    update() {
        const cursorPos = this.getPos();
        if (cursorPos === null) return;

        const $cursorPos = this.editorView.state.doc.resolve(cursorPos);
        const parentTable = findParentNodeClosestToPos($cursorPos, isTableNode);
        if (!parentTable) return;

        let side: 'top' | 'bottom';
        let trowPos: number;
        if ($cursorPos.nodeAfter && isTableRowNode($cursorPos.nodeAfter)) {
            side = 'top';
            trowPos = cursorPos;
        } else if ($cursorPos.nodeBefore && isTableRowNode($cursorPos.nodeBefore)) {
            side = 'bottom';
            trowPos = cursorPos - $cursorPos.nodeBefore.nodeSize;
        } else {
            this.cursorElem?.remove();
            this.cursorElem = null;
            return;
        }

        const trElem = this.editorView.nodeDOM(trowPos);
        const tableElem = this.editorView.nodeDOM(parentTable.pos);

        const trRect = (trElem as HTMLElement).getBoundingClientRect();
        const tableRect = (tableElem as HTMLElement).getBoundingClientRect();

        const rect: Rect = {
            top: trRect[side] - this.width / 2,
            bottom: trRect[side] + this.width / 2,
            left: tableRect.left,
            right: tableRect.right,
        };
        this.render(rect, {isBlock: true});
    }
}

export class TableColumnDropCursor extends DropCursor {
    update() {
        const cursorPos = this.getPos();
        if (cursorPos === null) return;

        const $cursorPos = this.editorView.state.doc.resolve(cursorPos);
        const parentTable = findParentNodeClosestToPos($cursorPos, isTableNode);
        if (!parentTable) return;

        let side: 'left' | 'right';
        let tcellPos: number;
        if ($cursorPos.nodeAfter && isTableCellNode($cursorPos.nodeAfter)) {
            side = 'left';
            tcellPos = cursorPos;
        } else if ($cursorPos.nodeBefore && isTableCellNode($cursorPos.nodeBefore)) {
            side = 'right';
            tcellPos = cursorPos - $cursorPos.nodeBefore.nodeSize;
        } else {
            this.cursorElem?.remove();
            this.cursorElem = null;
            return;
        }

        const tdElem = this.editorView.nodeDOM(tcellPos);
        const tableElem = this.editorView.nodeDOM(parentTable.pos);

        const tdRect = (tdElem as HTMLElement).getBoundingClientRect();
        const tableRect = (tableElem as HTMLElement).getBoundingClientRect();

        const rect: Rect = {
            left: tdRect[side] - this.width / 2,
            right: tdRect[side] + this.width / 2,
            top: tableRect.top,
            bottom: tableRect.bottom,
        };
        this.render(rect, {isBlock: true});
    }
}
