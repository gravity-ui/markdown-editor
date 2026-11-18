import {describe, expect, it} from 'vitest';

import {DataTransferType, isFilesWithoutText} from './clipboard';

function createDataTransfer(data: Partial<Record<DataTransferType, string>>): DataTransfer {
    return {
        types: Object.keys(data),
        getData: (type: string) => data[type as DataTransferType] ?? '',
    } as unknown as DataTransfer;
}

describe('isFilesWithoutText', () => {
    it.each([
        ['files only', {[DataTransferType.Files]: ''}],
        [
            'an image from a web page',
            {[DataTransferType.Files]: '', [DataTransferType.Html]: '<img>'},
        ],
        [
            'an image from MS Word',
            {
                [DataTransferType.Files]: '',
                [DataTransferType.Html]: '<img src="file:///clip_image001.png">',
                [DataTransferType.Rtf]: '{\\rtf1 {\\pict}}',
                [DataTransferType.Text]: '\r\n',
            },
        ],
    ])('should accept %s', (_name, data) => {
        expect(isFilesWithoutText(createDataTransfer(data))).toBe(true);
    });

    it.each([
        ['text without files', {[DataTransferType.Text]: 'text'}],
        [
            'cells with their image from a spreadsheet',
            {
                [DataTransferType.Files]: '',
                [DataTransferType.Html]: '<table></table>',
                [DataTransferType.Text]: 'A1\tB1',
            },
        ],
    ])('should reject %s', (_name, data) => {
        expect(isFilesWithoutText(createDataTransfer(data))).toBe(false);
    });
});
