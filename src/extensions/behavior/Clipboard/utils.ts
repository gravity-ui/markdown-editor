/** Сontains all data formats known to us */
export enum DataTransferType {
    Text = 'text/plain',
    Html = 'text/html',
    Yfm = 'text/yfm', // self
    UriList = 'text/uri-list',
    VSCodeData = 'vscode-editor-data',
    Files = 'Files',
}

export function isIosSafariShare({types}: DataTransfer): boolean {
    // if link is copied from ios safari share button,
    // then data transfer only have text/uri-list data type
    return (
        types.includes(DataTransferType.UriList) &&
        !types.includes(DataTransferType.Text) &&
        !types.includes(DataTransferType.Html)
    );
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

export function extractTextContentFromHtml(html: string) {
    const element = document.createElement('div');
    element.innerHTML = html;
    element.replaceChildren(...Array.from(element.children).filter((v) => v.nodeName !== 'META'));

    // Look if all nodes are div or span. That they don't have any classname and have only text child.
    if (
        Array.from(element.children).every(({nodeName, classList, childNodes}) => {
            return (
                (nodeName === 'DIV' || nodeName === 'SPAN') &&
                !classList.length &&
                childNodes.length === 1 &&
                (childNodes[0].nodeName === '#text' || childNodes[0].nodeName === 'BR')
            );
        })
    ) {
        return Array.from(element.children).reduce((a, v) => a + v.textContent + '\n', '');
    }

    return null;
}
