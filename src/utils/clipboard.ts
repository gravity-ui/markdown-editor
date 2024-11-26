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

export function isVSCode(data: DataTransfer): boolean {
    return data.types.includes(DataTransferType.VSCodeData);
}

export type VSCodeData = {
    version: number;
    isFromEmptySelection: boolean;
    multicursorText: null | string;
    mode: string;
    [key: string]: unknown;
};

export function tryParseVSCodeData(data: DataTransfer): VSCodeData | undefined {
    try {
        return JSON.parse(data.getData(DataTransferType.VSCodeData));
    } catch (e) {
        console.error(e);
        return undefined;
    }
}

/**
 * Checks if HTML conversion should be skipped based on clipboard contents.
 */
export function shouldSkipHtmlConversion(clipboardData: DataTransfer): boolean {
    const hasHtml = clipboardData.types.includes(DataTransferType.Html);

    // If there's no HTML content, skip conversion
    if (!hasHtml) return true;

    // Check for standard HTML clipboard (text/plain + text/html)
    if (clipboardData.types.length === 2) return false;

    // Check for WebStorm/Safari case (includes RTF)
    if (clipboardData.types.length === 3) {
        const rtf = clipboardData.getData(DataTransferType.Rtf);
        return rtf.indexOf('\fmodern JetBrains') > 0;
    }

    // Skip conversion for any other cases
    return true;
}
