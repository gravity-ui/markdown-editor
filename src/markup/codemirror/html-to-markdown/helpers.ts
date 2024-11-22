import {DataTransferType} from '../../../extensions/behavior/Clipboard/utils';

export function applyFormatting(text: string, element: HTMLElement): string {
    // Check for italic formatting (either through tags or CSS)
    const hasItalic =
        element.tagName.toLowerCase() === 'i' ||
        element.tagName.toLowerCase() === 'em' ||
        element.style.fontStyle === 'italic';

    // Check for bold formatting (either through tags or CSS font-weight)
    const hasBold =
        element.tagName.toLowerCase() === 'b' ||
        element.tagName.toLowerCase() === 'strong' ||
        parseInt(element.style.fontWeight, 10) >= 600;

    // Apply markdown formatting in specific order
    let formatted = text;
    if (hasItalic) formatted = `*${formatted}*`; // Wrap in single asterisks for italic
    if (hasBold) formatted = `**${formatted}**`; // Wrap in double asterisks for bold
    return formatted;
}

/**
 * Determines whether to skip HTML conversion based on the clipboard data.
 * It checks the types of data present in the clipboard and identifies specific edge cases
 * related to different applications like VsCode, WebStorm, and Safari.
 */
export function shouldSkipHtmlConversionBasedOnClipboard(clipboardData: DataTransfer): boolean {
    // usually html content will have event.clipboardData.types
    // equal ['text/plain', 'text/html']
    // But there is some nasty edgecases:
    //
    // - VsCode
    // We will get event.clipboardData.types
    // ['text/plain', 'text/html', 'application/vnd.code.copymetadata', 'vscode-editor-data']
    // where text/plain will contain correct markdown - in this case we should skip converting HTML
    let shouldSkipHtmlConversion = !(
        clipboardData.types.length === 2 && clipboardData.types.includes('text/html')
    );

    // - WebStorm
    // ['text/plain', 'text/html', 'text/rtf']
    // text/rtf will contain \fmodern JetBrains
    // text/plain will contain correct markdown - in this case we should skip converting HTML
    // - Safari, MacOS Notes, etc.
    // ['text/plain', 'text/html', 'text/rtf']
    // we do have text/rtf but we should proceed with conversion of HTML
    if (clipboardData.types.length === 3 && clipboardData.types.includes('text/html')) {
        const rtf = clipboardData.getData(DataTransferType.Rtf);
        shouldSkipHtmlConversion = rtf.indexOf('\fmodern JetBrains') > 0;
    }

    return shouldSkipHtmlConversion;
}
