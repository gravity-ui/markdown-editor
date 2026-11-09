import {EditorView} from '@codemirror/view';

import type {MarkupString} from 'src/common';
import {i18n} from 'src/i18n/bundle';
import {createCodemirror} from 'src/markup';
import {getAutocompleteConfig} from 'src/markup/codemirror/autocomplete';
import {Editor} from 'src/markup/editor';

import {emojiDefs} from '../emoji';
import type {ModeEvents} from '../shared/events';
import {getTopOffset} from '../shared/getTopOffset';
import type {ModeCore} from '../shared/types';

import type {MarkupCoreOptions} from './types';

/** @internal */
export class MarkupCore implements ModeCore<Editor> {
    #editor?: Editor;
    readonly #options: MarkupCoreOptions;
    readonly #events: ModeEvents;
    readonly #getInitialMarkup: () => MarkupString;
    readonly #emojiDefs?: Record<string, string>;

    constructor(
        options: MarkupCoreOptions,
        events: ModeEvents,
        getInitialMarkup: () => MarkupString,
    ) {
        this.#options = {
            ...options,
            markupConfig: {...options.markupConfig},
            experimental: {...options.experimental},
            handlers: {...options.handlers},
        };
        this.#events = events;
        this.#getInitialMarkup = getInitialMarkup;
        this.#emojiDefs =
            options.preset === 'full' ? (options.config?.emoji?.defs ?? emojiDefs) : undefined;
    }

    get editor(): Editor | undefined {
        return this.#editor;
    }

    getEditor(): Editor {
        if (!this.#editor) {
            const {
                experimental = {},
                handlers = {},
                markupConfig = {},
                logger,
                renderStorage,
                directiveSyntax,
            } = this.#options;
            const events = this.#events;
            const preserveEmptyRows = experimental.preserveEmptyRows || false;
            const uploadFile = handlers.uploadFile;
            const parseInsertedUrlAsImage = markupConfig.parseInsertedUrlAsImage;
            const needImageDimensions = Boolean(experimental.needToSetDimensionsForUploadedImages);
            const enableNewImageSizeCalculation = Boolean(
                experimental.enableNewImageSizeCalculation,
            );
            this.#editor = new Editor(
                createCodemirror({
                    doc: this.#getInitialMarkup(),
                    logger: logger.nested({mode: 'markup'}),
                    placeholder: markupConfig.placeholder ?? i18n('markup_placeholder'),
                    onCancel: () => events.emit('cancel', null),
                    onSubmit: () => events.emit('submit', null),
                    onChange: () => events.emit('rerender-toolbar', null),
                    onDocChange: () => events.emit('change', null),
                    onScroll: (event) => events.emit('cm-scroll', {event}),
                    reactRenderer: renderStorage,
                    uploadHandler: uploadFile,
                    parseInsertedUrlAsImage,
                    needImageDimensions,
                    parseHtmlOnPaste: markupConfig.parseHtmlOnPaste,
                    enableNewImageSizeCalculation,
                    extensions: markupConfig.extensions,
                    disabledExtensions: markupConfig.disabledExtensions,
                    keymaps: markupConfig.keymaps,
                    preserveEmptyRows,
                    yfmLangOptions: {
                        languageData: getAutocompleteConfig({
                            preserveEmptyRows,
                            emojiDefs: this.#emojiDefs,
                        }).concat(markupConfig.languageData || []),
                    },
                    autocompletion: markupConfig.autocompletion,
                    tooltips: markupConfig.tooltips,
                    directiveSyntax,
                    receiver: events,
                    searchPanel: markupConfig.searchPanel,
                }),
            );
        }
        return this.#editor;
    }

    moveCursorToLine(line: number): void {
        const view = this.getEditor().cm;
        const isConnected = Boolean(view.dom.parentElement);
        const cmLine = Math.min(Math.max(line + 1, 1), view.state.doc.lines);
        const anchor = view.state.doc.line(cmLine).from;
        view.dispatch({
            scrollIntoView: true,
            selection: {anchor},
            effects: isConnected
                ? [
                      EditorView.scrollIntoView(anchor, {
                          y: 'start',
                          x: 'start',
                          yMargin: getTopOffset(view.dom),
                      }),
                  ]
                : undefined,
        });
    }

    destroy(): void {
        this.#editor?.codemirror.destroy();
        this.#editor = undefined;
    }
}
