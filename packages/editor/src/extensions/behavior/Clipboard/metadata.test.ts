import {describe, expect, it} from 'vitest';

import {DataTransferType} from 'src/utils/clipboard';

import {DataTransferMock} from '../../../../tests/event-mock';

import {
    type ClipboardMetadataSection,
    getClipboardMetadata,
    setClipboardMetadata,
} from './metadata';

const indentSection: ClipboardMetadataSection<{indent: string}> = {
    name: 'indent',
    version: 1,
    parse: ({indent}) => (typeof indent === 'string' ? {indent} : undefined),
};

const flagSection: ClipboardMetadataSection<{flag: boolean}> = {
    name: 'flag',
    version: 2,
    parse: ({flag}) => (typeof flag === 'boolean' ? {flag} : undefined),
};

function createData(metadata: string) {
    const data = new DataTransferMock();
    data.setData(DataTransferType.Metadata, metadata);
    return data;
}

describe('Clipboard metadata', () => {
    it('should write each section with its version inside the versioned envelope', () => {
        const data = new DataTransferMock();
        setClipboardMetadata(data, [
            {section: indentSection, value: {indent: '\t '}},
            {section: flagSection, value: {flag: true}},
        ]);

        expect(JSON.parse(data.getData(DataTransferType.Metadata))).toEqual({
            version: 1,
            indent: {version: 1, indent: '\t '},
            flag: {version: 2, flag: true},
        });
    });

    it('should read the written sections', () => {
        const data = new DataTransferMock();
        setClipboardMetadata(data, [
            {section: indentSection, value: {indent: '  '}},
            {section: flagSection, value: {flag: false}},
        ]);

        expect(getClipboardMetadata(data, indentSection)).toEqual({indent: '  '});
        expect(getClipboardMetadata(data, flagSection)).toEqual({flag: false});
    });

    it('should read a section with unknown fields', () => {
        const data = createData('{"version":1,"indent":{"version":1,"indent":"  ","tab":4}}');

        expect(getClipboardMetadata(data, indentSection)).toEqual({indent: '  '});
    });

    it('should read a supported section next to a section with an unsupported version', () => {
        const data = createData(
            '{"version":1,"indent":{"version":1,"indent":"  "},"flag":{"version":3,"flag":true}}',
        );

        expect(getClipboardMetadata(data, indentSection)).toEqual({indent: '  '});
        expect(getClipboardMetadata(data, flagSection)).toBeUndefined();
    });

    it('should return undefined without metadata', () => {
        expect(getClipboardMetadata(new DataTransferMock(), indentSection)).toBeUndefined();
    });

    it.each([
        ['invalid JSON', '{'],
        ['a non-object envelope', '[]'],
        ['an unsupported envelope version', '{"version":2,"indent":{"version":1,"indent":"  "}}'],
        ['a missing section', '{"version":1}'],
        ['a non-object section', '{"version":1,"indent":"  "}'],
        ['invalid section fields', '{"version":1,"indent":{"version":1,"indent":2}}'],
    ])('should return undefined for %s', (_, metadata) => {
        expect(getClipboardMetadata(createData(metadata), indentSection)).toBeUndefined();
    });
});
