import type {EditorView} from '@codemirror/view';

import {ReactRenderStorage} from '../../extensions';
import {Logger2} from '../../logger';
import {DirectiveSyntaxContext} from '../../utils/directive';

import {createCodemirror} from './create';

function createFilesDataTransfer(files: File[]): DataTransfer {
    const fileList = files as unknown as FileList;

    return {
        dropEffect: 'none',
        effectAllowed: 'all',
        files: fileList,
        items: [] as unknown as DataTransferItemList,
        types: ['Files'],
        clearData: () => undefined,
        getData: () => '',
        setData: () => undefined,
        setDragImage: () => undefined,
    } as DataTransfer;
}

function dispatchPasteWithFiles(view: EditorView, files: File[]) {
    const event = new Event('paste', {bubbles: true, cancelable: true});
    Object.defineProperty(event, 'clipboardData', {
        value: createFilesDataTransfer(files),
    });

    view.contentDOM.dispatchEvent(event);
}

function dispatchDropWithFiles(view: EditorView, files: File[]) {
    jest.spyOn(view, 'posAtCoords').mockReturnValue(0);

    const event = new MouseEvent('drop', {bubbles: true, cancelable: true});
    Object.defineProperty(event, 'dataTransfer', {
        value: createFilesDataTransfer(files),
    });

    view.contentDOM.dispatchEvent(event);
}

function createView(uploadHandler: (file: File) => Promise<{url: string}>) {
    return createCodemirror({
        doc: '',
        placeholder: '',
        logger: new Logger2(),
        onCancel: () => undefined,
        onSubmit: () => undefined,
        onChange: () => undefined,
        onDocChange: () => undefined,
        onScroll: () => undefined,
        reactRenderer: new ReactRenderStorage(),
        uploadHandler,
        directiveSyntax: new DirectiveSyntaxContext(undefined),
        preserveEmptyRows: false,
        searchPanel: false,
    });
}

describe('createCodemirror file upload integration', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should start file upload on paste when upload handler is enabled', () => {
        const file = new File(['test'], 'test.txt', {type: 'text/plain'});
        const uploadHandler = jest.fn(() => new Promise<{url: string}>(() => undefined));
        const view = createView(uploadHandler);

        dispatchPasteWithFiles(view, [file]);

        expect(uploadHandler).toHaveBeenCalledTimes(1);
        expect(uploadHandler).toHaveBeenCalledWith(file);
        expect(view.state.sliceDoc()).toBe(' ');

        view.destroy();
    });

    it('should start file upload on drop when upload handler is enabled', () => {
        const file = new File(['test'], 'test.txt', {type: 'text/plain'});
        const uploadHandler = jest.fn(() => new Promise<{url: string}>(() => undefined));
        const view = createView(uploadHandler);

        dispatchDropWithFiles(view, [file]);

        expect(uploadHandler).toHaveBeenCalledTimes(1);
        expect(uploadHandler).toHaveBeenCalledWith(file);
        expect(view.state.sliceDoc()).toBe(' ');

        view.destroy();
    });
});
