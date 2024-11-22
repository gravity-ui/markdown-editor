/** Сontains all data formats known to us */
export enum DataTransferType {
    Text = 'text/plain',
    Html = 'text/html',
    Yfm = 'text/yfm', // self
    Rtf = 'text/rtf', // Safari, WebStorm/Intelij
    UriList = 'text/uri-list',
    VSCodeData = 'vscode-editor-data',
    Files = 'Files',
}

export function isFilesOnly({types}: DataTransfer): boolean {
    return types.length === 1 && types[0] === DataTransferType.Files;
}

export function isFilesFromHtml({types}: DataTransfer): boolean {
    return (
        types.length === 2 &&
        types.includes(DataTransferType.Files) &&
        types.includes(DataTransferType.Html)
    );
}

export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}
