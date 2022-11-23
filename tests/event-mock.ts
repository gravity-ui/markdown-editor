/** WARNING: This mock don't working with files */
export class DataTransferMock implements DataTransfer {
    #storage = new Map<string, string>();
    #types = new Set<string>();

    dropEffect: 'copy' | 'link' | 'none' | 'move' = 'none';
    effectAllowed:
        | 'copy'
        | 'link'
        | 'none'
        | 'move'
        | 'copyLink'
        | 'copyMove'
        | 'linkMove'
        | 'all'
        | 'uninitialized' = 'none';
    readonly files: FileList = [] as unknown as FileList;

    readonly items: DataTransferItemList = [] as unknown as DataTransferItemList;

    get types(): readonly string[] {
        return Array.from<string>(this.#types.values());
    }

    clearData(format?: string | undefined): void {
        if (format) {
            this.#types.delete(format);
            this.#storage.delete(format);
        } else {
            this.#types.clear();
            this.#storage.clear();
        }
    }

    getData(format: string): string {
        return this.#storage.get(format) ?? '';
    }

    setData(format: string, data: string): void {
        this.#storage.set(format, data);
        this.#types.add(format);
    }

    setDragImage(_image: Element, _x: number, _y: number): void {
        throw new Error('Method setDragImage not implemented in DataTransferMock.');
    }
}

export class ClipboardEventMock implements ClipboardEvent {
    readonly clipboardData: DataTransfer | null;
    readonly bubbles: boolean;
    cancelBubble = false;
    readonly cancelable: boolean;
    readonly composed: boolean;
    readonly currentTarget: EventTarget | null = null;
    readonly defaultPrevented: boolean = false;
    readonly eventPhase: number = 0;
    readonly isTrusted: boolean = true;
    readonly returnValue: boolean = false;
    readonly srcElement: EventTarget | null = null;
    readonly target: EventTarget | null = null;
    readonly timeStamp: DOMHighResTimeStamp = Date.now();
    readonly type: string;
    readonly AT_TARGET: number = 0;
    readonly BUBBLING_PHASE: number = 0;
    readonly CAPTURING_PHASE: number = 0;
    readonly NONE: number = 0;
    constructor(type: string, eventInitDict?: ClipboardEventInit) {
        this.type = type;
        this.bubbles = eventInitDict?.bubbles ?? false;
        this.composed = eventInitDict?.composed ?? false;
        this.cancelable = eventInitDict?.cancelable ?? true;
        this.clipboardData = eventInitDict?.clipboardData ?? null;
    }
    composedPath(): EventTarget[] {
        return [];
    }
    initEvent(
        _type: string,
        _bubbles?: boolean | undefined,
        _cancelable?: boolean | undefined,
    ): void {
        // throw new Error('Method not implemented.');
    }
    preventDefault(): void {
        // throw new Error('Method not implemented.');
    }
    stopImmediatePropagation(): void {
        // throw new Error('Method not implemented.');
    }
    stopPropagation(): void {
        // throw new Error('Method not implemented.');
    }
}
