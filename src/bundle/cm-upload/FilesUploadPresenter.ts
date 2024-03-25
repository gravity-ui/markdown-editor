import type CodeMirror from 'codemirror';

import {ReactRenderStorage, RendererItem} from '../../extensions';
import {isImageFile} from '../../utils/clipboard';
import type {FileUploadHandler, FileUploadResult} from '../../utils/upload';

import {UploadedFile, renderUploadWidget} from './FilesUploadWidget';
import {IMG_MAX_HEIGHT} from './const';
import {getImageDimensions} from './utils';

const SUCCESS_UPLOAD_REMOVE_TIMEOUT = 1000; // 1 sec
const enum State {
    Initial,
    Running,
    Destroyed,
}

export interface CMFilesUploadPresenterParams {
    readonly cm: CodeMirror.Editor;
    readonly uploadHandler: FileUploadHandler;
    readonly reactRenderer: ReactRenderStorage;
    onAllSettled(presenter: CMFilesUploadPresenter): void;
    needDimmensionsForImages: boolean;
}

export class CMFilesUploadPresenter {
    private readonly _params: CMFilesUploadPresenterParams;

    private readonly _uploadFiles: (UploadedFile & {file: File})[] = [];

    private __reactWidget: RendererItem | null = null;
    private readonly _reactContainer: HTMLElement;
    private _cmWidget: CodeMirror.LineWidget | null = null;

    private readonly _initialPosition: CodeMirror.Position;

    private _state: State = State.Initial;

    private get _reactWidget(): RendererItem {
        if (this.__reactWidget) return this.__reactWidget;
        this.__reactWidget = this._params.reactRenderer.createItem(
            'cm-upload-files',
            renderUploadWidget(this._reactContainer, {
                files: this._uploadFiles,
                onReUploadClick: this._onReUploadClick.bind(this),
                onCloseClick: this._onCloseClick.bind(this),
            }),
        );
        return this.__reactWidget;
    }

    constructor(params: CMFilesUploadPresenterParams) {
        this._params = params;

        this._reactContainer = document.createElement('div');
        this._reactContainer.classList.add('cm-widget-container');

        this._initialPosition = this._params.cm.getCursor();
    }

    run(files: ArrayLike<File>) {
        if (this._state !== State.Initial) return this;
        this._state = State.Running;

        for (const file of Array.from(files)) {
            this._uploadFiles.push({
                file,
                fileType: isImageFile(file) ? 'image' : 'file',
                fileName: file.name,
                status: 'uploading',
            });

            this._params.uploadHandler(file).then(
                (res) => this._onFileUpload({...res, file}),
                (err: unknown) => this._onFileFail({file, err}),
            );
        }

        this._cmWidget = this._params.cm.addLineWidget(
            this._initialPosition.line,
            this._reactContainer,
            {},
        );
        this._reactWidget.rerender();
        this._scheduleWidgetChange();

        return this;
    }

    destroy() {
        this._state = State.Destroyed;

        this.__reactWidget?.remove();
        this.__reactWidget = null;

        this._cmWidget?.clear();
        this._cmWidget = null;
    }

    private _onFileUpload(res: FileUploadResult & {file: File}) {
        if (this._state === State.Destroyed) return;

        const file = this._uploadFiles.find((item) => item.file === res.file);
        if (file) {
            file.status = 'success';
            this._reactWidget.rerender();
        }

        setTimeout(() => {
            this._insertFileMarkup(res);
            this._removeFileFromView(res.file);
        }, SUCCESS_UPLOAD_REMOVE_TIMEOUT);
    }

    private _onFileFail(res: {file: File; err: unknown}) {
        if (this._state === State.Destroyed) return;

        const file = this._uploadFiles.find((item) => item.file === res.file);
        if (file) {
            file.status = 'error';
            file.errorText = String(res.err);
            this._reactWidget.rerender();
        }
    }

    private _onReUploadClick(uFile: UploadedFile) {
        if (uFile.status !== 'error') return;

        const file = this._uploadFiles.find((f) => f === uFile);
        if (file) {
            this._params.uploadHandler(file.file).then(
                (res) => this._onFileUpload({...res, file: file.file}),
                (err: unknown) => this._onFileFail({file: file.file, err}),
            );

            file.status = 'uploading';
            file.errorText = undefined;
            this._reactWidget.rerender();
        }
    }

    private _onCloseClick() {
        this._params.onAllSettled(this);
    }

    private async _insertFileMarkup(res: FileUploadResult & {file: File}) {
        const fileName = res.name ?? res.file.name ?? '';

        let markup: string;
        if (isImageFile(res.file)) {
            if (this._params.needDimmensionsForImages) {
                try {
                    let {height} = await getImageDimensions(res.file);
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

        const isInitPosition = this._isInitialCursorPos(this._params.cm.getCursor());

        this._params.cm.replaceRange(
            isInitPosition ? markup + ' ' : ' ' + markup,
            isInitPosition
                ? this._initialPosition
                : {line: this._initialPosition.line, ch: Number.MAX_SAFE_INTEGER},
        );

        if (isInitPosition) {
            this._initialPosition.ch += markup.length + 1;
            this._params.cm.setCursor(this._initialPosition);
        }
    }

    private _removeFileFromView(file: File) {
        if (this._state === State.Destroyed) return;

        const index = this._uploadFiles.findIndex((item) => item.file === file);
        if (index >= 0) {
            this._uploadFiles.splice(index, 1);
            this._reactWidget.rerender();
            this._scheduleWidgetChange();

            this._checkIfAllFilesUploaded();
        }
    }

    private _checkIfAllFilesUploaded() {
        if (this._state === State.Destroyed) return;

        if (!this._uploadFiles.length) {
            this._params.onAllSettled(this);
        }
    }

    private _isInitialCursorPos(currentPosition: CodeMirror.Position): boolean {
        return (
            this._initialPosition.ch === currentPosition.ch &&
            this._initialPosition.line === currentPosition.line
        );
    }

    private _scheduleWidgetChange() {
        setTimeout(() => {
            this._cmWidget?.changed();
        }, 20);
    }
}
