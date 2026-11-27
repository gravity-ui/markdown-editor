import type {EditorEventMap} from 'src/bundle/shared/events';
import type {WysiwygCore} from 'src/bundle/wysiwyg/WysiwygCore';
import type {WysiwygEditorHost} from 'src/bundle/wysiwyg/editor-host';
import type {
    MarkdownWysiwygEditorEvents,
    MarkdownWysiwygEditorInstance,
} from 'src/bundle/wysiwyg/public/types';
import type {WysiwygCoreOptions} from 'src/bundle/wysiwyg/types';
import type {Listener, Receiver, SafeEventEmitter} from 'src/utils/event-emitter';

const bindings = new WeakMap<MarkdownWysiwygEditorInstance, WysiwygEditorBinding>();

/** @internal */
export class WysiwygEditorBinding implements WysiwygEditorHost {
    readonly api: MarkdownWysiwygEditorInstance;
    readonly #core: WysiwygCore;
    readonly #events: SafeEventEmitter<EditorEventMap>;
    readonly logger: WysiwygCoreOptions['logger'];
    readonly preset: WysiwygCoreOptions['preset'];
    readonly mobile: boolean;
    readonly renderStorage: WysiwygCoreOptions['renderStorage'];
    #toolbarVisible: boolean;
    #view?: object;

    constructor(
        options: WysiwygCoreOptions,
        events: SafeEventEmitter<EditorEventMap>,
        core: WysiwygCore,
        toolbarVisible: boolean,
    ) {
        this.logger = options.logger;
        this.preset = options.preset;
        this.mobile = options.mobile ?? false;
        this.renderStorage = options.renderStorage;
        this.#events = events;
        this.#core = core;
        this.#toolbarVisible = toolbarVisible;
        const owner = this;
        // This owner receives only WYSIWYG events.
        const publicEvents = events as Receiver<MarkdownWysiwygEditorEvents>;
        this.api = {
            get logger() {
                return owner.logger;
            },
            get toolbarVisible() {
                return owner.toolbarVisible;
            },
            focus: () => this.focus(),
            hasFocus: () => this.wysiwygEditor.hasFocus(),
            getValue: () => this.wysiwygEditor.getValue(),
            isEmpty: () => this.wysiwygEditor.isEmpty(),
            clear: () => this.wysiwygEditor.clear(),
            replace: (value) => this.wysiwygEditor.replace(value),
            prepend: (value) => this.wysiwygEditor.prepend(value),
            append: (value) => this.wysiwygEditor.append(value),
            insert: (value) => this.wysiwygEditor.insert(value),
            moveCursor: (position) => {
                if (typeof position === 'object') this.#core.moveCursorToLine(position.line);
                else this.wysiwygEditor.moveCursor(position);
            },
            on: (type, listener) => publicEvents.on(type, listener),
            off: (type, listener) => publicEvents.off(type, listener),
        };
        bindings.set(this.api, this);
    }

    get toolbarVisible() {
        return this.#toolbarVisible;
    }
    get wysiwygEditor() {
        return this.#core.getEditor();
    }
    get actions(): WysiwygEditor.Actions {
        return this.wysiwygEditor.actions;
    }

    action<T extends keyof WysiwygEditor.Actions>(name: T): WysiwygEditor.Actions[T] {
        return this.wysiwygEditor.action(name);
    }

    focus(): void {
        this.wysiwygEditor.focus();
    }

    on<K extends keyof EditorEventMap>(type: K, listener: Listener<EditorEventMap[K]>): void {
        this.#events.on(type, listener);
    }

    off<K extends keyof EditorEventMap>(type: K, listener: Listener<EditorEventMap[K]>): void {
        this.#events.off(type, listener);
    }

    emit<K extends keyof EditorEventMap>(type: K, value: EditorEventMap[K]): void {
        this.#events.emit(type, value);
    }

    changeToolbarVisibility(options: {visible: boolean}): void {
        this.#toolbarVisible = options.visible;
        this.emit('rerender', null);
        this.emit('change-toolbar-visibility', options);
    }

    attachView(): () => void {
        if (this.#view) throw new Error('Only one View can be mounted per editor');
        const token = {};
        this.#view = token;
        try {
            this.#core.getEditor();
        } catch (error) {
            this.#view = undefined;
            throw error;
        }
        return () => {
            if (this.#view === token) this.#view = undefined;
        };
    }

    destroy(): void {
        this.#core.destroy();
    }
}

/** @internal */
export function getWysiwygBinding(api: MarkdownWysiwygEditorInstance): WysiwygEditorBinding {
    const binding = bindings.get(api);
    if (!binding) throw new Error('Expected a standalone WYSIWYG editor instance');
    return binding;
}
