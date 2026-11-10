import {TextSelection} from 'prosemirror-state';

import type {MarkupString} from 'src/common';
import {WysiwygEditor, type WysiwygEditorOptions} from 'src/core';
import type {TransformFn} from 'src/core/markdown/ProseMirrorTransformer';
import {getPMTransformers} from 'src/core/markdown/ProseMirrorTransformer/getTransformers';
import type {DynamicModifiers} from 'src/core/types/dynamicModifiers';
import {getDescedantByAttribute} from 'src/utils/node-descedants';

import {MarkupManager} from '../MarkupManager';
import {createDynamicModifiers} from '../config/dynamicModifiers';
import type {ModeEvents} from '../shared/events';
import {getTopOffset} from '../shared/getTopOffset';
import type {ModeCore} from '../shared/types';

import type {WysiwygCoreOptions} from './types';

/** @internal */
export class WysiwygCore implements ModeCore<WysiwygEditor> {
    #editor?: WysiwygEditor;
    readonly #options: WysiwygCoreOptions;
    readonly #events: ModeEvents;
    readonly #getInitialMarkup: () => MarkupString;
    readonly #modifiers?: DynamicModifiers[];
    readonly #pmTransformers: TransformFn[];

    constructor(
        options: WysiwygCoreOptions,
        events: ModeEvents,
        getInitialMarkup: () => MarkupString,
    ) {
        const {logger, experimental = {}, wysiwygConfig = {}} = options;
        this.#options = {...options, wysiwygConfig: {...wysiwygConfig}};
        this.#events = events;
        this.#getInitialMarkup = getInitialMarkup;
        this.#modifiers = experimental.preserveMarkupFormatting
            ? createDynamicModifiers(new MarkupManager(logger.nested({module: 'markup-manager'})))
            : undefined;
        this.#pmTransformers = getPMTransformers({
            emptyRowTransformer: experimental.preserveEmptyRows,
        });
    }

    get editor(): WysiwygEditor | undefined {
        return this.#editor;
    }

    getEditor(): WysiwygEditor {
        if (!this.#editor) {
            const {preset, logger, md = {}, wysiwygConfig = {}} = this.#options;
            const mdPreset: NonNullable<WysiwygEditorOptions['mdPreset']> =
                preset === 'zero' || preset === 'commonmark' ? preset : 'default';
            this.#editor = new WysiwygEditor({
                mdPreset,
                logger: logger.nested({mode: 'wysiwyg'}),
                initialContent: this.#getInitialMarkup(),
                extensions: wysiwygConfig.extensions,
                pmTransformers: this.#pmTransformers,
                modifiers: this.#modifiers,
                allowHTML: md.html,
                linkify: md.linkify,
                linkifyTlds: md.linkifyTlds,
                escapeConfig: wysiwygConfig.escapeConfig,
                onChange: () => this.#events.emit('rerender-toolbar', null),
                onDocChange: () => this.#events.emit('change', null),
            });
        }
        return this.#editor;
    }

    destroy(): void {
        this.#editor?.destroy();
        this.#editor = undefined;
    }

    moveCursorToLine(line: number): void {
        const DATA_LINE = 'data-line';
        const SELECTOR = `[${DATA_LINE}="${line}"]` as const;
        const editor = this.getEditor();
        const view = editor.view;
        const isConnected = Boolean(view.dom.parentElement);

        const setSelection = (pos: number) => {
            const {tr} = view.state;
            view.dispatch(tr.setSelection(TextSelection.near(tr.doc.resolve(pos), 1)));
        };

        const scrollIntoView = (elemTop: number) => {
            const topOffset = getTopOffset(editor.dom);
            window.scrollTo({top: elemTop + window.scrollY - topOffset});
        };

        const elem = editor.dom.querySelector(SELECTOR);
        if (elem) {
            setSelection(view.posAtDOM(elem, 0));

            if (isConnected) {
                scrollIntoView(elem.getBoundingClientRect().top);
            }

            return;
        }

        const node = getDescedantByAttribute(view.state.doc, DATA_LINE, [line, String(line)]);
        if (node) {
            setSelection(node.pos);

            if (isConnected) {
                scrollIntoView(view.coordsAtPos(node.pos).top);
            }
        }
    }
}
