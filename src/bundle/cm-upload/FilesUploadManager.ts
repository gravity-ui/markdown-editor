import {CMFilesUploadPresenter, CMFilesUploadPresenterParams} from './FilesUploadPresenter';

export interface CMFilesUploader {
    upload(files: ArrayLike<File>): void;
    destroy(): void;
}

export type CMFilesUploadManagerParams = Pick<
    CMFilesUploadPresenterParams,
    'cm' | 'uploadHandler' | 'reactRenderer' | 'needDimmensionsForImages'
>;

export class CMFilesUploadManager implements CMFilesUploader, CMFilesUploadPresenterParams {
    readonly cm: CMFilesUploadManagerParams['cm'];
    readonly uploadHandler: CMFilesUploadManagerParams['uploadHandler'];
    readonly reactRenderer: CMFilesUploadManagerParams['reactRenderer'];
    readonly needDimmensionsForImages: boolean;

    private readonly _presenters: CMFilesUploadPresenter[] = [];

    constructor(params: CMFilesUploadManagerParams) {
        this.cm = params.cm;
        this.uploadHandler = params.uploadHandler;
        this.reactRenderer = params.reactRenderer;
        this.needDimmensionsForImages = params.needDimmensionsForImages;
    }

    upload(files: ArrayLike<File>) {
        this._presenters.push(new CMFilesUploadPresenter(this).run(files));
    }

    destroy() {
        for (const presenter of this._presenters) {
            presenter.destroy();
        }
        this._presenters.length = 0;
    }

    onAllSettled(presenter: CMFilesUploadPresenter): void {
        presenter.destroy();
        const index = this._presenters.indexOf(presenter);
        if (index >= 0) {
            this._presenters.splice(index, 1);
        }
    }
}
