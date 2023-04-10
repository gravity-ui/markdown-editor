type UnkObj = {[key: string]: unknown};

export type Listener<T> = (value: T) => void;

export interface Emitter<T extends object = UnkObj> {
    emit<K extends keyof T>(type: K, data: T[K]): void;
}

export interface Receiver<T extends object = UnkObj> {
    on<K extends keyof T>(type: K, listener: Listener<T[K]>): void;
    off<K extends keyof T>(type: K, listener: Listener<T[K]>): void;
}

export class EventEmitter<T extends object = UnkObj> implements Emitter<T>, Receiver<T> {
    protected _listeners = new Map<keyof T, Listener<any>[]>();

    on<K extends keyof T>(type: K, listener: Listener<T[K]>): void {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, []);
        }
        this._listeners.get(type)!.push(listener);
    }

    off<K extends keyof T>(type: K, listener: Listener<T[K]>): void {
        if (this._listeners.has(type)) {
            this._listeners.set(
                type,
                this._listeners.get(type)!.filter((val) => val !== listener),
            );
        }
    }

    emit<K extends keyof T>(type: K, value: T[K]): void {
        this._listeners.get(type)?.forEach((listener) => listener(value));
    }
}

export class SafeEventEmitter<T extends object = UnkObj> extends EventEmitter<T> {
    private onError: (error: unknown) => void;

    constructor(options?: {onError?: (error: unknown) => void}) {
        super();
        this.onError = options?.onError ?? console.error;
    }

    emit<K extends keyof T>(type: K, value: T[K]): void {
        this._listeners.get(type)?.forEach((listener) => this.safeExec(() => listener(value)));
    }

    private safeExec(fn: () => void): void {
        try {
            fn();
        } catch (e) {
            this.onError(e);
        }
    }
}
