import dd from 'ts-dedent';

import {DataTransferType, isVSCode, tryParseVSCodeData} from 'src/utils/clipboard';

import {LATEX_MODES} from './const';

export function isLatexMode(mode: string | undefined): boolean {
    if (!mode) return false;
    return LATEX_MODES.has(mode.toLowerCase());
}

export function parseLatexFormulas(content: string): string[] {
    const blocks = content.split(/\n\s*\n/);
    const formulas: string[] = [];

    for (const block of blocks) {
        const lines = block
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        if (lines.length > 0) {
            formulas.push(lines.join('\n'));
        }
    }

    return formulas;
}

export function getLatexData(
    data: DataTransfer,
): null | {editor: string; mode: string; value: string} {
    if (!data.getData(DataTransferType.Text)) return null;

    if (isVSCode(data)) {
        const vsCodeData = tryParseVSCodeData(data);
        const mode = vsCodeData?.mode;

        if (mode && isLatexMode(mode)) {
            return {
                editor: 'vscode',
                mode,
                value: dd(data.getData(DataTransferType.Text)),
            };
        }
    }

    return null;
}
