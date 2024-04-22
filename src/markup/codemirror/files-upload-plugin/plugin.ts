import type {ChangeSpec} from '@codemirror/state';
import {
    Decoration,
    DecorationSet,
    EditorView,
    PluginValue,
    ViewPlugin,
    ViewUpdate,
    WidgetType,
} from '@codemirror/view';

import type {RendererItem} from '../../../extensions';
import type {FileUploadHandler, FileUploadResult} from '../../../utils/upload';
import {FileUploadHandlerFacet} from '../files-upload-facet';
import {ReactRendererFacet} from '../react-facet';

import {IMG_MAX_HEIGHT, SUCCESS_UPLOAD_REMOVE_TIMEOUT} from './const';
import {AddUploadWidgetEffect, RemoveUploadWidgetEffect} from './effects';
import {getImageDimensions, getTransferFiles, isImageFile, uniqueId} from './utils';
import {renderWidget} from './widget';

class FileUploadWidget extends WidgetType {
    readonly selfId: string;

    private presenter?: FileUploadPresenter;

    private renderer: RendererItem | null = null;
    private props: object = {};

    constructor(id: string) {
        super();
        this.selfId = id;
    }

    toDOM(view: EditorView): HTMLElement {
        const dom = document.createElement('div');
        dom.className = 'cm6-file-upload-widget';
        dom.style.display = 'inline-block';
        this.renderer?.remove();
        this.createRenderItem(dom, view);
        return dom;
    }

    updateDOM(dom: HTMLElement, view: EditorView): boolean {
        this.renderer?.remove();
        this.createRenderItem(dom, view);
        return true;
    }

    destroy(dom: HTMLElement): void {
        super.destroy(dom);
        this.renderer?.remove();
        this.presenter?.cancel();
        this.presenter = undefined;
    }

    setPresenter(presenter: FileUploadPresenter) {
        this.presenter = presenter;
    }

    render(props: object) {
        Object.assign(this.props, props);
        this.renderer?.rerender();
    }

    private createRenderItem(dom: HTMLElement, view: EditorView) {
        this.renderer = view.state
            .facet(ReactRendererFacet)
            .createItem('cm-file-upload-widget', () => renderWidget(dom, {...(this.props as any)}));
    }
}

class FileUploadPresenter {
    readonly widget: FileUploadWidget;

    private readonly file: File;
    private readonly view: Pick<EditorView, 'dispatch'>;
    private readonly uploader: FileUploadHandler;
    private readonly needDimmensionsForImages: boolean;

    private state: 'initial' | 'uploading' | 'success' | 'error' | 'canceled' = 'initial';

    constructor(params: {
        file: File;
        widget: FileUploadWidget;
        uploader: FileUploadHandler;
        view: Pick<EditorView, 'dispatch'>;
        needDimmensionsForImages: boolean;
    }) {
        this.file = params.file;
        this.view = params.view;
        this.widget = params.widget;
        this.uploader = params.uploader;
        this.needDimmensionsForImages = params.needDimmensionsForImages;
        this.widget.setPresenter(this);
        this.run();
    }

    cancel() {
        this.state = 'canceled';
    }

    private run() {
        this.state = 'uploading';
        this.widget.render({
            status: 'uploading',
            fileName: this.file.name,
            fileType: isImageFile(this.file) ? 'image' : 'file',
        });
        this.uploader(this.file).then(this.onUploadSuccess, this.onUploadError);
    }

    private onUploadSuccess = (res: FileUploadResult) => {
        if (this.state === 'canceled') return;
        this.state = 'success';
        this.widget.render({
            status: 'success',
            fileName: this.file.name,
            fileType: isImageFile(this.file) ? 'image' : 'file',
        });
        setTimeout(async () => {
            const markup = await this.formatFileMarkup(res);
            if (this.state === 'canceled') return;

            this.view.dispatch({
                effects: RemoveUploadWidgetEffect.of({
                    id: this.widget.selfId,
                    markup,
                }),
            });
        }, SUCCESS_UPLOAD_REMOVE_TIMEOUT);
    };

    private onUploadError = (err: unknown) => {
        if (this.state === 'canceled') return;
        this.state = 'error';
        this.widget.render({
            status: 'error',
            fileName: this.file.name,
            fileType: isImageFile(this.file) ? 'image' : 'file',
            errorText: String(err),
            onReUploadClick: () => {
                if (this.state === 'error') this.run();
            },
        });
    };

    private async formatFileMarkup(res: FileUploadResult) {
        const fileName = res.name ?? this.file.name ?? '';

        let markup: string;
        if (isImageFile(this.file)) {
            if (this.needDimmensionsForImages) {
                try {
                    let {height} = await getImageDimensions(this.file);
                    height = Math.min(height, IMG_MAX_HEIGHT);
                    markup = `![${fileName}](${res.url} =x${height})`;
                } catch (err) {
                    markup = `![${fileName}](${res.url})`;
                }
            } else {
                markup = `![${fileName}](${res.url})`;
            }
        } else {
            markup = `{% file src="${res.url}" name="${fileName.replace('"', '')}" %}`;
        }

        return markup;
    }
}

export const FilesUploadPlugin = ViewPlugin.fromClass(
    class implements PluginValue {
        decos: DecorationSet = Decoration.none;
        readonly view: EditorView;

        constructor(view: EditorView) {
            this.view = view;
        }

        update(update: ViewUpdate): void {
            this.decos = this.decos.map(update.changes);
            const uploadFacet = this.view.state.facet(FileUploadHandlerFacet);

            const changes: ChangeSpec[] = [];

            for (const tr of update.transactions) {
                for (const eff of tr.effects) {
                    if (eff.is(AddUploadWidgetEffect)) {
                        this.decos = this.decos.update({
                            add: Array.from(eff.value.files).map((file, index) => {
                                const {widget} = new FileUploadPresenter({
                                    file,
                                    view: this.view,
                                    uploader: uploadFacet.fn,
                                    needDimmensionsForImages: Boolean(uploadFacet.imgWithDimms),
                                    widget: new FileUploadWidget(uniqueId('__file_widget_id')),
                                });
                                return Decoration.widget({
                                    widget,
                                    side: 1,
                                    __file_widget_id: widget.selfId,
                                }).range(eff.value.pos + index);
                            }),
                        });
                    }
                    if (eff.is(RemoveUploadWidgetEffect)) {
                        this.decos = this.decos.update({
                            filter: (from, to, deco) => {
                                if (deco.spec.__file_widget_id !== eff.value.id) return true;
                                if (eff.value.markup) {
                                    changes.push({from, to, insert: eff.value.markup});
                                }
                                return false;
                            },
                        });
                    }
                }
            }

            if (changes.length) {
                setTimeout(() => {
                    this.view.dispatch({changes});
                });
            }
        }
    },
    {
        decorations: (v) => v.decos,
        eventHandlers: {
            paste(event, view) {
                if (!event.clipboardData) return false;

                const files = getTransferFiles(event.clipboardData);
                if (!files) return false;

                const {from, to} = view.state.selection.main;

                view.dispatch({
                    selection: {anchor: from},
                    effects: AddUploadWidgetEffect.of({files, pos: from}),
                    changes: {from, to, insert: ' '.repeat(files.length)},
                });
                event.preventDefault();
                return true;
            },
            drop(event, view) {
                if (!event.dataTransfer) return false;

                const files = getTransferFiles(event.dataTransfer);
                if (!files) return false;

                const pos = this.view.posAtCoords(event, false);
                view.dispatch({
                    selection: {anchor: pos},
                    effects: AddUploadWidgetEffect.of({files, pos}),
                    changes: {from: pos, insert: ' '.repeat(files.length)},
                });
                event.preventDefault();
                return true;
            },
        },
    },
);
