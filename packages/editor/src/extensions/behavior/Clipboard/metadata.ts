import {DataTransferType} from 'src/utils/clipboard';
import {tryCatch} from 'src/utils/helpers';

/** Changes only with incompatible changes of the envelope */
export const CLIPBOARD_METADATA_VERSION = 1;

export type ClipboardMetadataSection<T extends object> = {
    /** Key of the section in the envelope */
    name: string;
    /** Changes only with incompatible changes of the section fields */
    version: number;
    /** Returns `undefined` for invalid fields */
    parse: (fields: Record<string, unknown>) => T | undefined;
};

export type ClipboardMetadataEntry<T extends object> = {
    section: ClipboardMetadataSection<T>;
    value: T;
};

export function setClipboardMetadata(
    data: DataTransfer,
    entries: ClipboardMetadataEntry<object>[],
): void {
    const metadata: Record<string, unknown> = {version: CLIPBOARD_METADATA_VERSION};
    for (const {section, value} of entries) {
        metadata[section.name] = {...value, version: section.version};
    }
    data.setData(DataTransferType.Metadata, JSON.stringify(metadata));
}

/** Returns `undefined` for missing or invalid metadata and for an unsupported envelope or section version */
export function getClipboardMetadata<T extends object>(
    data: DataTransfer,
    section: ClipboardMetadataSection<T>,
): T | undefined {
    const json = data.getData(DataTransferType.Metadata);
    if (!json) return undefined;

    const parsed = tryCatch((): unknown => JSON.parse(json));
    if (!parsed.success || !isRecord(parsed.result)) return undefined;
    if (parsed.result.version !== CLIPBOARD_METADATA_VERSION) return undefined;

    const fields = parsed.result[section.name];
    if (!isRecord(fields) || fields.version !== section.version) return undefined;

    return section.parse(fields);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
