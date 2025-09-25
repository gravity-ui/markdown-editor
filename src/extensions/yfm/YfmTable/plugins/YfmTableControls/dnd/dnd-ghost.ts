import type {EditorView} from '#pm/view';
import type {TableDescBinded} from 'src/table-utils/table-desc';

type Event = Pick<MouseEvent, 'clientX' | 'clientY' | 'target'>;

type BuildGhostResult = {
    domElement: HTMLElement;
    shiftX: number;
    shiftY: number;
};

export type YfmTableDnDGhostParams = {
    initial: Event;
    type: 'row' | 'column';
    rangeIdx: number;
    tableDesc: TableDescBinded;
};

export class YfmTableDnDGhost {
    private _x: number;
    private _y: number;

    private readonly _dndBackgroundElem: HTMLElement;
    private readonly _ghostTable: HTMLElement;
    private readonly _ghostButton: HTMLElement | null = null;

    private readonly _tblShiftX: number;
    private readonly _tblShiftY: number;

    private readonly _btnShiftX: number = 0;
    private readonly _btnShiftY: number = 0;

    private _rafId: number;

    constructor(view: EditorView, params: YfmTableDnDGhostParams) {
        this._x = params.initial.clientX;
        this._y = params.initial.clientY;

        this._dndBackgroundElem = view.dom.ownerDocument.createElement('div');
        this._dndBackgroundElem.classList.add('g-md-yfm-table-dnd-cursor-background');

        {
            const res = this._buildGhostButton(params);
            if (res) {
                this._ghostButton = res.domElement;
                this._btnShiftX = res.shiftX;
                this._btnShiftY = res.shiftY;
                this._dndBackgroundElem.appendChild(this._ghostButton);
            }
        }

        {
            const {domElement, shiftX, shiftY} =
                params.type === 'row'
                    ? this._buildRowGhost(view, params)
                    : this._buildColumnGhost(view, params);

            this._ghostTable = domElement;
            this._tblShiftX = shiftX;
            this._tblShiftY = shiftY;
            this._dndBackgroundElem.appendChild(this._ghostTable);
        }

        this._updatePositions();

        this._rafId = requestAnimationFrame(() => {
            document.body.append(this._dndBackgroundElem);
            this._startAnimation();
        });
    }

    move(event: Event) {
        this._x = event.clientX;
        this._y = event.clientY;
    }

    destroy() {
        cancelAnimationFrame(this._rafId);
        this._dndBackgroundElem.remove();
    }

    private _startAnimation() {
        const self = this;
        let last = {x: self._x, y: self._y};

        self._rafId = requestAnimationFrame(function update() {
            if (self._x !== last.x || self._y !== last.y) {
                last = {x: self._x, y: self._y};
                self._updatePositions();
            }
            self._rafId = requestAnimationFrame(update);
        });
    }

    private _updatePositions() {
        this._ghostTable.style.top = this._y + this._tblShiftY + 'px';
        this._ghostTable.style.left = this._x + this._tblShiftX + 'px';

        if (this._ghostButton) {
            this._ghostButton.style.top = this._y + this._btnShiftY + 'px';
            this._ghostButton.style.left = this._x + this._btnShiftX + 'px';
        }
    }

    private _buildRowGhost(
        view: EditorView,
        {tableDesc, rangeIdx}: YfmTableDnDGhostParams,
    ): BuildGhostResult {
        let shiftX = 0;
        let shiftY = 0;

        const document = view.dom.ownerDocument;
        const container = this._buildGhostContainer(view);

        const table = container.appendChild(document.createElement('table'));
        const tbody = table.appendChild(document.createElement('tbody'));

        {
            const tablePos = tableDesc.pos;
            const tableNode = view.domAtPos(tablePos + 1).node;
            const rect = (tableNode as Element).getBoundingClientRect();
            table.style.width = rect.width + 'px';
        }

        const range = tableDesc.base.getRowRanges()[rangeIdx];
        for (let rowIdx = range.startIdx; rowIdx <= range.endIdx; rowIdx++) {
            const tr = tbody.appendChild(document.createElement('tr'));

            for (let colIdx = 0; colIdx < tableDesc.cols; colIdx++) {
                const cellPos = tableDesc.getPosForCell(rowIdx, colIdx);
                if (cellPos.type === 'real') {
                    const origNode = view.domAtPos(cellPos.from + 1).node as HTMLElement;
                    const cloned = tr.appendChild(origNode.cloneNode(true));

                    const rect = origNode.getBoundingClientRect();
                    (cloned as HTMLElement).style.width = rect.width + 'px';
                    (cloned as HTMLElement).style.height = rect.height + 'px';

                    if (rowIdx === range.startIdx && colIdx === 0) {
                        shiftX = rect.left - this._x;
                        shiftY = rect.top - this._y;
                    }
                }
            }
        }

        return {domElement: container, shiftX, shiftY};
    }

    private _buildColumnGhost(
        view: EditorView,
        {tableDesc, rangeIdx}: YfmTableDnDGhostParams,
    ): BuildGhostResult {
        let shiftX = 0;
        let shiftY = 0;

        const document = view.dom.ownerDocument;
        const container = this._buildGhostContainer(view);

        {
            const tablePos = tableDesc.pos;
            const table = view.domAtPos(tablePos + 1).node;
            const rect = (table as Element).getBoundingClientRect();
            container.style.height = rect.height + 'px';
        }

        const table = container.appendChild(document.createElement('table'));
        const tbody = table.appendChild(document.createElement('tbody'));

        const range = tableDesc.base.getColumnRanges()[rangeIdx];
        for (let rowIdx = 0; rowIdx < tableDesc.rows; rowIdx++) {
            const tr = tbody.appendChild(document.createElement('tr'));

            for (let colIdx = range.startIdx; colIdx <= range.endIdx; colIdx++) {
                const cellPos = tableDesc.getPosForCell(rowIdx, colIdx);
                if (cellPos.type === 'real') {
                    const origNode = view.domAtPos(cellPos.from + 1).node as HTMLElement;
                    const cloned = tr.appendChild(origNode.cloneNode(true));

                    const rect = origNode.getBoundingClientRect();
                    (cloned as HTMLElement).style.width = rect.width + 'px';
                    (cloned as HTMLElement).style.height = rect.height + 'px';

                    if (rowIdx === 0 && colIdx === range.startIdx) {
                        container.style.minWidth = rect.width + 'px';

                        shiftX = rect.left - this._x;
                        shiftY = rect.top - this._y;
                    }
                }
            }
        }

        return {domElement: container, shiftX, shiftY};
    }

    private _buildGhostButton({
        initial: {target},
    }: YfmTableDnDGhostParams): BuildGhostResult | null {
        if (!(target instanceof Element)) return null;

        const button = target.closest('.g-button');
        if (!button) return null;

        const rect = button.getBoundingClientRect();
        const cloned = button.cloneNode(true) as HTMLElement;
        cloned.style.cursor = '';
        cloned.classList.add('g-md-yfm-table-dnd-ghost-button');

        return {
            domElement: cloned,
            shiftX: rect.left - this._x,
            shiftY: rect.top - this._y,
        };
    }

    private _buildGhostContainer(view: EditorView): HTMLElement {
        const container = view.dom.ownerDocument.createElement('div');
        const yfmClasses = view.dom.classList
            .entries()
            .map(([, val]) => val)
            .filter((val) => val.startsWith('yfm_'));
        container.classList.add('g-md-yfm-table-dnd-ghost', 'yfm', ...yfmClasses);
        return container;
    }
}
